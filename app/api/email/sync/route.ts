import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { ImapFlow } from 'imapflow';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { accountId } = body;

    if (!accountId) {
      return NextResponse.json({ success: false, error: 'Missing accountId' }, { status: 400 });
    }

    const supabase = await createClient();
    const startTime = Date.now();

    // Create sync log entry
    const { data: logEntry } = await supabase
      .from('emailovy_log')
      .insert({ id_uctu: accountId, stav: 'running', pocet_novych: 0, trvani_ms: 0 })
      .select('id')
      .single();

    // Fetch account with encrypted password
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
      await updateLog(supabase, logEntry?.id, 'error', 'Failed to decrypt password', 0, Date.now() - startTime);
      return NextResponse.json({ success: false, error: 'Decryption failed' });
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
      tls: { rejectUnauthorized: false },
    });

    let totalNew = 0;

    try {
      await client.connect();

      // Get folder list from server and sync
      const mailboxes = await client.list();

      for (const mailbox of mailboxes) {
        const folderType = detectFolderType(mailbox.path, mailbox.specialUse);

        // Upsert folder in DB
        const folderId = `folder-${accountId}-${sanitizePath(mailbox.path)}`;
        const { data: existingFolder } = await supabase
          .from('emailove_slozky')
          .select('id, posledni_uid')
          .eq('id_uctu', accountId)
          .eq('imap_cesta', mailbox.path)
          .single();

        const folderDbId = existingFolder?.id || folderId;
        const lastUid = existingFolder?.posledni_uid ?? 0;

        if (!existingFolder) {
          await supabase.from('emailove_slozky').insert({
            id: folderId,
            id_uctu: accountId,
            nazev: mailbox.name,
            imap_cesta: mailbox.path,
            typ: folderType,
            poradi: getFolderOrder(folderType),
          });
        }

        // Open mailbox and fetch new messages
        const lock = await client.getMailboxLock(mailbox.path);
        try {
          const status = await client.status(mailbox.path, { messages: true, unseen: true, uidNext: true });

          // Only fetch if there are messages newer than what we've synced
          if (status.uidNext && status.uidNext > lastUid + 1) {
            const fetchRange = `${lastUid + 1}:*`;
            let highestUid = lastUid;
            let newInFolder = 0;

            try {
              for await (const msg of client.fetch(fetchRange, {
                uid: true,
                envelope: true,
                bodyStructure: true,
                flags: true,
                size: true,
                source: { maxLength: 50000 }, // Fetch first 50KB for preview/body
              })) {
                if (msg.uid <= lastUid) continue;

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const envelopeFrom = (msg.envelope as any)?.from;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const envelopeTo = (msg.envelope as any)?.to;
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const envelopeCc = (msg.envelope as any)?.cc;

                const parseAddr = (addr: { name?: string; address?: string; mailbox?: string; host?: string }) => ({
                  name: addr.name || undefined,
                  address: addr.address || (addr.mailbox && addr.host ? `${addr.mailbox}@${addr.host}` : 'unknown'),
                });

                const from = envelopeFrom?.[0]
                  ? parseAddr(envelopeFrom[0])
                  : { address: 'unknown' };

                const to = (envelopeTo || []).map(parseAddr);
                const cc = envelopeCc?.length ? envelopeCc.map(parseAddr) : null;

                const hasAttachments = checkAttachments(msg.bodyStructure);
                const attachmentsMeta = extractAttachmentMeta(msg.bodyStructure);

                // Extract text + html body from source
                let bodyText: string | null = null;
                let bodyHtml: string | null = null;
                let preview = '';
                if (msg.source) {
                  const sourceText = msg.source.toString();
                  const extracted = extractEmailBody(sourceText);
                  bodyText = extracted.text;
                  bodyHtml = extracted.html;
                  preview = (bodyText || stripHtmlTags(bodyHtml) || '').substring(0, 200).replace(/\s+/g, ' ').trim();
                }

                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                const envelope = msg.envelope as any;
                const messageId = `msg-${accountId}-${msg.uid}-${Date.now()}`;
                await supabase.from('emailove_zpravy').upsert({
                  id: messageId,
                  id_uctu: accountId,
                  id_slozky: folderDbId,
                  imap_uid: msg.uid,
                  id_zpravy_rfc: envelope?.messageId || null,
                  predmet: envelope?.subject || '',
                  odesilatel: from,
                  prijemci: to,
                  kopie: cc,
                  datum: envelope?.date?.toISOString() || new Date().toISOString(),
                  nahled: preview,
                  telo_text: bodyText,
                  telo_html: bodyHtml,
                  precteno: msg.flags?.has('\\Seen') ?? false,
                  oznaceno: msg.flags?.has('\\Flagged') ?? false,
                  ma_prilohy: hasAttachments,
                  metadata_priloh: attachmentsMeta,
                  odpoved_na: envelope?.inReplyTo || null,
                  vlakno_id: envelope?.messageId || null,
                  velikost: msg.size ?? 0,
                }, {
                  onConflict: 'id_uctu,id_slozky,imap_uid',
                  ignoreDuplicates: true,
                });

                if (msg.uid > highestUid) highestUid = msg.uid;
                newInFolder++;
              }
            } catch (fetchErr) {
              console.error(`Error fetching messages in ${mailbox.path}:`, fetchErr);
            }

            totalNew += newInFolder;

            // Update folder stats
            await supabase.from('emailove_slozky').update({
              pocet_zprav: status.messages ?? 0,
              pocet_neprectenych: status.unseen ?? 0,
              posledni_uid: highestUid,
            }).eq('id', folderDbId);
          } else {
            // Just update counts
            await supabase.from('emailove_slozky').update({
              pocet_zprav: status.messages ?? 0,
              pocet_neprectenych: status.unseen ?? 0,
            }).eq('id', folderDbId);
          }

          // Re-fetch body for existing messages with empty text+html (max 50)
          try {
            const { data: emptyBodyMsgs } = await supabase
              .from('emailove_zpravy')
              .select('id, imap_uid')
              .eq('id_slozky', folderDbId)
              .is('telo_text', null)
              .is('telo_html', null)
              .limit(50);

            if (emptyBodyMsgs && emptyBodyMsgs.length > 0) {
              for (const dbMsg of emptyBodyMsgs) {
                try {
                  // Fetch source for this specific UID
                  const fetched = await client.fetchOne(String(dbMsg.imap_uid), {
                    uid: true,
                    source: { maxLength: 50000 },
                  });
                  if (fetched?.source) {
                    const { text, html } = extractEmailBody(fetched.source.toString());
                    if (text || html) {
                      const newPreview = (text || stripHtmlTags(html) || '').substring(0, 200).replace(/\s+/g, ' ').trim();
                      await supabase.from('emailove_zpravy').update({
                        telo_text: text,
                        telo_html: html,
                        nahled: newPreview || undefined,
                      }).eq('id', dbMsg.id);
                    }
                  }
                } catch {
                  // Skip individual message errors
                }
              }
            }
          } catch (refetchErr) {
            console.error(`Error re-fetching empty bodies in ${mailbox.path}:`, refetchErr);
          }
        } finally {
          lock.release();
        }
      }

      await client.logout();

      // Update account last sync
      await supabase.from('emailove_ucty').update({
        posledni_sync: new Date().toISOString(),
      }).eq('id', accountId);

      const duration = Date.now() - startTime;
      await updateLog(supabase, logEntry?.id, 'success', null, totalNew, duration);

      return NextResponse.json({ success: true, newCount: totalNew });
    } catch (imapErr) {
      await client.logout().catch(() => {});
      const duration = Date.now() - startTime;
      const errMsg = imapErr instanceof Error ? imapErr.message : String(imapErr);
      await updateLog(supabase, logEntry?.id, 'error', errMsg, totalNew, duration);
      console.error('IMAP sync error:', imapErr);
      return NextResponse.json({ success: false, error: errMsg });
    }
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' });
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateLog(supabase: any, logId: number | undefined, status: string, message: string | null, newCount: number, durationMs: number) {
  if (!logId) return;
  await supabase.from('emailovy_log').update({
    stav: status,
    zprava: message,
    pocet_novych: newCount,
    trvani_ms: durationMs,
  }).eq('id', logId);
}

function detectFolderType(path: string, specialUse?: string): string {
  if (specialUse) {
    if (specialUse.includes('\\Inbox')) return 'inbox';
    if (specialUse.includes('\\Sent')) return 'sent';
    if (specialUse.includes('\\Drafts')) return 'drafts';
    if (specialUse.includes('\\Trash')) return 'trash';
    if (specialUse.includes('\\Junk') || specialUse.includes('\\Spam')) return 'spam';
  }
  const lower = path.toLowerCase();
  if (lower === 'inbox') return 'inbox';
  if (lower.includes('sent')) return 'sent';
  if (lower.includes('draft')) return 'drafts';
  if (lower.includes('trash') || lower.includes('deleted')) return 'trash';
  if (lower.includes('spam') || lower.includes('junk')) return 'spam';
  return 'custom';
}

function getFolderOrder(type: string): number {
  switch (type) {
    case 'inbox': return 0;
    case 'sent': return 1;
    case 'drafts': return 2;
    case 'spam': return 3;
    case 'trash': return 4;
    default: return 5;
  }
}

function sanitizePath(path: string): string {
  return path.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function checkAttachments(bodyStructure: any): boolean {
  if (!bodyStructure) return false;
  if (bodyStructure.disposition === 'attachment') return true;
  if (bodyStructure.childNodes) {
    return bodyStructure.childNodes.some(checkAttachments);
  }
  return false;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function extractAttachmentMeta(bodyStructure: any, results: any[] = []): any[] {
  if (!bodyStructure) return results;
  if (bodyStructure.disposition === 'attachment' || (bodyStructure.dispositionParameters?.filename)) {
    results.push({
      name: bodyStructure.dispositionParameters?.filename || bodyStructure.parameters?.name || 'unnamed',
      size: bodyStructure.size || 0,
      contentType: bodyStructure.type ? `${bodyStructure.type}/${bodyStructure.subtype}` : 'application/octet-stream',
      partId: bodyStructure.part || '1',
    });
  }
  if (bodyStructure.childNodes) {
    for (const child of bodyStructure.childNodes) {
      extractAttachmentMeta(child, results);
    }
  }
  return results;
}

function decodePartBody(part: string): string | null {
  const bodyStart = part.indexOf('\r\n\r\n');
  if (bodyStart === -1) return null;

  const headers = part.substring(0, bodyStart).toLowerCase();
  let body = part.substring(bodyStart + 4).trim().replace(/--$/, '').trim();
  if (!body) return null;

  // Detect Content-Transfer-Encoding
  const encodingMatch = headers.match(/content-transfer-encoding:\s*(\S+)/);
  const encoding = encodingMatch?.[1]?.toLowerCase();

  if (encoding === 'base64') {
    try {
      // Remove line breaks from base64 content
      const cleaned = body.replace(/[\r\n\s]/g, '');
      body = Buffer.from(cleaned, 'base64').toString('utf-8');
    } catch {
      return null;
    }
  } else if (encoding === 'quoted-printable') {
    // Decode quoted-printable: =XX hex sequences and =\r\n soft line breaks
    body = body
      .replace(/=\r?\n/g, '') // soft line breaks
      .replace(/=([0-9A-Fa-f]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));
  }

  return body || null;
}

function extractEmailBody(source: string): { text: string | null; html: string | null } {
  const boundary = source.match(/boundary="?([^"\r\n]+)"?/)?.[1];
  let text: string | null = null;
  let html: string | null = null;

  if (boundary) {
    const parts = source.split(boundary);
    for (const part of parts) {
      const decoded = decodePartBody(part);
      if (!decoded) continue;
      if (part.toLowerCase().includes('text/plain') && !text) {
        text = decoded;
      } else if (part.toLowerCase().includes('text/html') && !html) {
        html = decoded;
      }
    }
  } else {
    // Single-part email
    const decoded = decodePartBody(source);
    if (decoded) {
      if (source.toLowerCase().includes('text/html') || decoded.trim().startsWith('<')) {
        html = decoded;
      } else {
        text = decoded;
      }
    }
  }

  return {
    text: text?.substring(0, 50000) || null,
    html: html?.substring(0, 100000) || null,
  };
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
