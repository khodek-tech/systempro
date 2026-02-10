import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { ImapFlow } from 'imapflow';
import { emailBackfillSchema, parseBody } from '@/lib/api/schemas';
import { resolveInlineImages } from '@/lib/email/imap-helpers';

// Walk MIME bodyStructure tree and return part IDs for text/plain and text/html (skip attachments)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTextParts(node: any): { textPart?: string; htmlPart?: string } {
  if (!node) return {};
  if (!node.childNodes?.length) {
    const partId = node.part || '1';
    if (node.type === 'text/plain' && node.disposition !== 'attachment')
      return { textPart: partId };
    if (node.type === 'text/html' && node.disposition !== 'attachment')
      return { htmlPart: partId };
    return {};
  }
  const result: { textPart?: string; htmlPart?: string } = {};
  for (const child of node.childNodes) {
    const childResult = findTextParts(child);
    if (childResult.textPart && !result.textPart) result.textPart = childResult.textPart;
    if (childResult.htmlPart && !result.htmlPart) result.htmlPart = childResult.htmlPart;
  }
  return result;
}

// Convert a readable stream to a UTF-8 string with timeout protection
async function streamToString(stream: ReadableStream | NodeJS.ReadableStream, timeoutMs = 10000): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = [];
    const timeout = setTimeout(() => {
      reject(new Error('Stream read timeout'));
    }, timeoutMs);

    (async () => {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        for await (const chunk of stream as any) {
          chunks.push(Buffer.from(chunk));
        }
        clearTimeout(timeout);
        resolve(Buffer.concat(chunks).toString('utf-8'));
      } catch (err) {
        clearTimeout(timeout);
        reject(err);
      }
    })();
  });
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailBackfillSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { accountId, folderId, batchSize } = parsed.data;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Missing accountId' }, { status: 400 });
    }

    const supabase = await createClient();

    // Fetch account
    const { data: account, error: accError } = await supabase
      .from('emailove_ucty')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Decrypt password
    let password: string;
    try {
      password = decrypt(account.heslo_sifrovane, account.heslo_iv, account.heslo_tag);
    } catch {
      return NextResponse.json({ success: false, error: 'Decryption failed' });
    }

    // Find target folder — if folderId given use that, otherwise pick first folder with missing bodies
    let targetFolderId = folderId;
    let targetImapPath: string | null = null;

    if (targetFolderId) {
      const { data: folder } = await supabase
        .from('emailove_slozky')
        .select('id, imap_cesta')
        .eq('id', targetFolderId)
        .single();
      targetImapPath = folder?.imap_cesta ?? null;
    } else {
      // Find folder with most missing HTML bodies
      const { data: folders } = await supabase
        .from('emailove_slozky')
        .select('id, imap_cesta')
        .eq('id_uctu', accountId)
        .order('poradi');

      if (folders) {
        for (const folder of folders) {
          // Priority 1: missing HTML bodies
          const { count } = await supabase
            .from('emailove_zpravy')
            .select('id', { count: 'exact', head: true })
            .eq('id_slozky', folder.id)
            .is('telo_html', null);

          if (count && count > 0) {
            targetFolderId = folder.id;
            targetImapPath = folder.imap_cesta;
            break;
          }
        }

        // Priority 2: emails with unresolved cid: references
        if (!targetFolderId) {
          for (const folder of folders) {
            const { count } = await supabase
              .from('emailove_zpravy')
              .select('id', { count: 'exact', head: true })
              .eq('id_slozky', folder.id)
              .ilike('telo_html', '%cid:%');

            if (count && count > 0) {
              targetFolderId = folder.id;
              targetImapPath = folder.imap_cesta;
              break;
            }
          }
        }
      }
    }

    if (!targetFolderId || !targetImapPath) {
      return NextResponse.json({ success: true, processed: 0, remaining: 0, message: 'No folders need backfill' });
    }

    // Get messages needing backfill (missing HTML or unresolved cid: references)
    const { data: missingMsgs, count: totalMissing } = await supabase
      .from('emailove_zpravy')
      .select('id, imap_uid', { count: 'exact' })
      .eq('id_slozky', targetFolderId)
      .or('telo_html.is.null,telo_html.ilike.%cid:%')
      .order('datum', { ascending: false })
      .limit(batchSize);

    if (!missingMsgs || missingMsgs.length === 0) {
      return NextResponse.json({ success: true, processed: 0, remaining: 0 });
    }

    // Connect to IMAP
    const client = new ImapFlow({
      host: account.imap_server,
      port: account.imap_port ?? 993,
      secure: (account.imap_port ?? 993) === 993,
      auth: {
        user: account.uzivatelske_jmeno,
        pass: password,
      },
      logger: false,
      tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
      connectionTimeout: 30000,
      greetingTimeout: 16000,
      socketTimeout: 300000,
    });

    let processed = 0;
    const errors: string[] = [];

    try {
      await client.connect();
      const lock = await client.getMailboxLock(targetImapPath);

      try {
        for (const msg of missingMsgs) {
          try {
            // Fetch bodyStructure to find text/html part IDs
            const fetched = await client.fetchOne(String(msg.imap_uid), {
              uid: true,
              bodyStructure: true,
            });

            if (fetched && fetched.bodyStructure) {
              const { textPart, htmlPart } = findTextParts(fetched.bodyStructure);
              let text: string | null = null;
              let html: string | null = null;

              if (textPart) {
                const { content } = await client.download(String(msg.imap_uid), textPart, { uid: true });
                if (content) text = (await streamToString(content)).substring(0, 50000) || null;
              }
              if (htmlPart) {
                const { content } = await client.download(String(msg.imap_uid), htmlPart, { uid: true });
                if (content) html = (await streamToString(content)) || null;
              }
              // Resolve inline CID images to base64 data URIs
              if (html && html.includes('cid:')) {
                html = await resolveInlineImages(html, client, String(msg.imap_uid), fetched.bodyStructure);
              }
              // Apply size limit after inline image resolution
              if (html && html.length > 500000) {
                html = html.substring(0, 500000);
              }

              if (text || html) {
                const preview = (text || stripHtmlTags(html) || '').substring(0, 200).replace(/\s+/g, ' ').trim();
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const updateData: Record<string, any> = {};
                if (html) updateData.telo_html = html;
                if (text) updateData.telo_text = text;
                if (preview) updateData.nahled = preview;

                await supabase.from('emailove_zpravy').update(updateData).eq('id', msg.id);
                processed++;
              }
            }

            // Anti rate-limit delay
            await new Promise(r => setTimeout(r, 100));
          } catch (msgErr) {
            errors.push(`UID ${msg.imap_uid}: ${msgErr instanceof Error ? msgErr.message : String(msgErr)}`);
          }
        }
      } finally {
        lock.release();
      }
    } finally {
      await client.logout().catch(() => {});
    }

    const remaining = Math.max(0, (totalMissing ?? 0) - processed);
    return NextResponse.json({
      success: true,
      processed,
      remaining,
      errors: errors.length > 0 ? errors.slice(0, 10) : undefined,
    });
  } catch (error) {
    console.error('Backfill error:', error);
    return NextResponse.json({ success: false, error: 'Backfill failed' });
  }
}

function stripHtmlTags(html: string | null): string {
  if (!html) return '';
  return html
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}
