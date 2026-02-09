import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { ImapFlow } from 'imapflow';
import { emailSyncSchema, parseBody } from '@/lib/api/schemas';

// Translate raw IMAP errors to user-friendly Czech messages
function friendlyError(msg: string): string {
  if (msg.includes('Connection not available') || msg.includes('ECONNREFUSED'))
    return 'Nepodařilo se připojit k mailovému serveru. Zkuste to za chvíli.';
  if (msg.includes('ETIMEDOUT'))
    return 'Připojení k mailovému serveru vypršelo.';
  if (msg.includes('Authentication') || msg.includes('AUTHENTICATIONFAILED'))
    return 'Chyba přihlášení k mailovému serveru. Zkontrolujte heslo.';
  return msg;
}

// Connect with retry (1 retry after 3s)
async function connectWithRetry(client: ImapFlow, maxRetries = 1) {
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      await client.connect();
      return;
    } catch (err) {
      if (attempt >= maxRetries) throw err;
      await new Promise(r => setTimeout(r, 3000));
    }
  }
}

// Walk MIME bodyStructure tree and return part IDs for text/plain and text/html (skip attachments)
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findTextParts(node: any): { textPart?: string; htmlPart?: string } {
  if (!node) return {};
  // Leaf node (no children)
  if (!node.childNodes?.length) {
    const partId = node.part || '1';
    if (node.type === 'text/plain' && node.disposition !== 'attachment')
      return { textPart: partId };
    if (node.type === 'text/html' && node.disposition !== 'attachment')
      return { htmlPart: partId };
    return {};
  }
  // Recurse children, take first match of each type
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

const BATCH_SIZE_INITIAL = 100;
const BATCH_SIZE_INCREMENTAL = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

// Batch upsert messages into DB
async function batchUpsertMessages(supabase: SupabaseClient, rows: Record<string, unknown>[]): Promise<number> {
  if (rows.length === 0) return 0;
  const { error, data } = await supabase.from('emailove_zpravy').upsert(rows, {
    onConflict: 'id_uctu,id_slozky,imap_uid',
    ignoreDuplicates: false,
  }).select('id');
  if (error) {
    console.error('Batch upsert error:', error.message);
    return 0;
  }
  return data?.length ?? rows.length;
}

// Process a single message: download body parts, return a DB row
async function processMessage(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  msg: any,
  client: ImapFlow,
  accountId: string,
  folderDbId: string,
): Promise<Record<string, unknown> | null> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const envelope = msg.envelope as any;
    const envelopeFrom = envelope?.from;
    const envelopeTo = envelope?.to;
    const envelopeCc = envelope?.cc;

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

    // Download only text/html parts (skip attachments)
    let bodyText: string | null = null;
    let bodyHtml: string | null = null;
    const { textPart, htmlPart } = findTextParts(msg.bodyStructure);

    try {
      if (textPart) {
        const { content } = await client.download(String(msg.uid), textPart, { uid: true });
        if (content) bodyText = (await streamToString(content)).substring(0, 50000) || null;
      }
      if (htmlPart) {
        const { content } = await client.download(String(msg.uid), htmlPart, { uid: true });
        if (content) bodyHtml = (await streamToString(content)).substring(0, 100000) || null;
      }
    } catch (dlErr) {
      console.error(`Error downloading body parts for UID ${msg.uid}:`, dlErr);
    }

    const preview = (bodyText || stripHtmlTags(bodyHtml) || '').substring(0, 200).replace(/\s+/g, ' ').trim();

    const messageId = `msg-${accountId}-${folderDbId}-${msg.uid}`;
    return {
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
    };
  } catch (msgErr) {
    console.error(`Error processing UID ${msg.uid}:`, msgErr);
    return null;
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailSyncSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { accountId, mode } = parsed.data;

    const isInitial = mode === 'initial';
    const batchSize = isInitial ? BATCH_SIZE_INITIAL : BATCH_SIZE_INCREMENTAL;

    const supabase = await createClient();
    const startTime = Date.now();

    // Create sync log entry
    const { data: logEntry } = await supabase
      .from('emailovy_log')
      .insert({ id_uctu: accountId, stav: 'running', pocet_novych: 0, trvani_ms: 0, celkem_zprav: 0, zpracovano: 0 })
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
      tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
      connectionTimeout: 30000,
      greetingTimeout: 16000,
      socketTimeout: 300000,
    });

    let totalNew = 0;
    let syncStatus = 'error';
    let syncError: string | null = null;

    try {
      await connectWithRetry(client);

      // Get folder list from server and sync
      const mailboxes = await client.list();

      // For initial mode: first pass to count total messages across all folders
      if (isInitial && logEntry?.id) {
        let grandTotal = 0;
        for (const mailbox of mailboxes) {
          try {
            const status = await client.status(mailbox.path, { messages: true });
            grandTotal += status.messages ?? 0;
          } catch {
            // skip folders we can't stat
          }
        }
        await supabase.from('emailovy_log').update({
          celkem_zprav: grandTotal,
        }).eq('id', logEntry.id);
      }

      let globalProcessed = 0;

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
          const status = await client.status(mailbox.path, { messages: true, unseen: true });

          // Skip empty folders in initial mode
          if (isInitial && (status.messages ?? 0) === 0 && lastUid === 0) {
            // Update progress — skip this folder's messages (0)
            if (logEntry?.id) {
              await supabase.from('emailovy_log').update({
                zpracovano: globalProcessed,
                aktualni_slozka: mailbox.name,
              }).eq('id', logEntry.id);
            }
            // Still update folder counts
            await supabase.from('emailove_slozky').update({
              pocet_zprav: status.messages ?? 0,
              pocet_neprectenych: status.unseen ?? 0,
            }).eq('id', folderDbId);
            continue;
          }

          // Update progress: current folder name
          if (isInitial && logEntry?.id) {
            await supabase.from('emailovy_log').update({
              aktualni_slozka: mailbox.name,
            }).eq('id', logEntry.id);
          }

          const fetchRange = `${lastUid + 1}:*`;
          let highestUid = lastUid;
          let newInFolder = 0;

          // Collect metadata for all new messages first
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const pendingMessages: any[] = [];
          try {
            for await (const msg of client.fetch(fetchRange, {
              uid: true,
              envelope: true,
              bodyStructure: true,
              flags: true,
              size: true,
            }, { uid: true })) {
              if (msg.uid <= lastUid) continue;
              pendingMessages.push(msg);
            }
          } catch (fetchErr) {
            console.error(`Error fetching metadata in ${mailbox.path}:`, fetchErr);
          }

          // Process messages and batch upsert
          const pendingRows: Record<string, unknown>[] = [];

          for (const msg of pendingMessages) {
            const row = await processMessage(msg, client, accountId, folderDbId);
            if (row) {
              pendingRows.push(row);
              if (msg.uid > highestUid) highestUid = msg.uid;
            }

            // Flush batch when reaching batchSize
            if (pendingRows.length >= batchSize) {
              const inserted = await batchUpsertMessages(supabase, pendingRows);
              newInFolder += inserted;
              globalProcessed += pendingRows.length;
              pendingRows.length = 0;

              // Update progress in initial mode
              if (isInitial && logEntry?.id) {
                await supabase.from('emailovy_log').update({
                  zpracovano: globalProcessed,
                }).eq('id', logEntry.id);
              }
            }
          }

          // Flush remaining rows
          if (pendingRows.length > 0) {
            const inserted = await batchUpsertMessages(supabase, pendingRows);
            newInFolder += inserted;
            globalProcessed += pendingRows.length;

            if (isInitial && logEntry?.id) {
              await supabase.from('emailovy_log').update({
                zpracovano: globalProcessed,
              }).eq('id', logEntry.id);
            }
          }

          totalNew += newInFolder;

          // Always update counts; conditionally update posledni_uid
          const folderUpdate: Record<string, unknown> = {
            pocet_zprav: status.messages ?? 0,
            pocet_neprectenych: status.unseen ?? 0,
          };
          if (highestUid > lastUid) {
            folderUpdate.posledni_uid = highestUid;
          }
          await supabase.from('emailove_slozky').update(folderUpdate).eq('id', folderDbId);
        } finally {
          lock.release();
        }
      }

      // Update account last sync
      await supabase.from('emailove_ucty').update({
        posledni_sync: new Date().toISOString(),
      }).eq('id', accountId);

      syncStatus = 'success';
    } catch (imapErr) {
      syncError = imapErr instanceof Error ? imapErr.message : String(imapErr);
      console.error('IMAP sync error:', imapErr);
    } finally {
      await client.logout().catch(() => {});
      const duration = Date.now() - startTime;
      try {
        await updateLog(supabase, logEntry?.id, syncStatus, syncError, totalNew, duration);
      } catch { /* ignore log update failure */ }
    }

    if (syncError) {
      return NextResponse.json({ success: false, error: friendlyError(syncError) });
    }
    return NextResponse.json({ success: true, newCount: totalNew, logId: logEntry?.id });
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
