/**
 * Core email sync logic shared between the manual sync API route and the cron job.
 * Extracted from app/api/email/sync/route.ts.
 */

import { ImapFlow } from 'imapflow';
import { decrypt } from '@/lib/email/encryption';
import { resolveInlineImages } from '@/lib/email/imap-helpers';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

type SyncMode = 'initial' | 'incremental';

export interface SyncResult {
  success: boolean;
  newCount: number;
  logId?: number;
  error?: string;
}

// Translate raw IMAP errors to user-friendly Czech messages
export function friendlyError(msg: string): string {
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
        if (content) bodyHtml = (await streamToString(content)) || null;
      }
      // Resolve inline CID images to base64 data URIs
      if (bodyHtml && bodyHtml.includes('cid:')) {
        bodyHtml = await resolveInlineImages(bodyHtml, client, String(msg.uid), msg.bodyStructure);
      }
      // Apply size limit after inline image resolution
      if (bodyHtml && bodyHtml.length > 500000) {
        bodyHtml = bodyHtml.substring(0, 500000);
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

async function updateLog(supabase: SupabaseClient, logId: number | undefined, status: string, message: string | null, newCount: number, durationMs: number) {
  if (!logId) return;
  await supabase.from('emailovy_log').update({
    stav: status,
    zprava: message,
    pocet_novych: newCount,
    trvani_ms: durationMs,
  }).eq('id', logId);
}

const BATCH_SIZE_INITIAL = 100;
const BATCH_SIZE_INCREMENTAL = 50;
const RECONCILIATION_COOLDOWN_MS = 60 * 60 * 1000; // 1 hour
const MAX_RECONCILIATION_FOLDERS = 2;
const MAX_FLAG_SYNC_FOLDERS = 3;
const FLAG_SYNC_MAX_MESSAGES = 10000;
const FLAG_SYNC_COOLDOWN_MS = 2 * 60 * 60 * 1000; // 2 hours

interface FolderDbRecord {
  id: string;
  imap_cesta: string;
  posledni_uid: number;
  uid_next: number;
  uid_validity: number;
  pocet_zprav: number;
  pocet_neprectenych: number;
  posledni_reconciliace: string | null;
  posledni_flag_sync: string | null;
}

/**
 * Sync a single email account via IMAP.
 * Can be called from the manual sync API route or the cron job.
 */
export async function syncAccount(
  supabase: SupabaseClient,
  accountId: string,
  mode: SyncMode = 'incremental',
  batchSize?: number,
  timeoutMs?: number,
): Promise<SyncResult> {
  const isInitial = mode === 'initial';
  const effectiveBatchSize = batchSize ?? (isInitial ? BATCH_SIZE_INITIAL : BATCH_SIZE_INCREMENTAL);
  const startTime = Date.now();
  const deadline = timeoutMs ? startTime + timeoutMs : null;

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
    return { success: false, newCount: 0, error: 'Account not found' };
  }

  // Decrypt password
  let password: string;
  try {
    password = decrypt(account.heslo_sifrovane, account.heslo_iv, account.heslo_tag);
  } catch {
    await updateLog(supabase, logEntry?.id, 'error', 'Failed to decrypt password', 0, Date.now() - startTime);
    return { success: false, newCount: 0, error: 'Decryption failed' };
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

    if (isInitial) {
      // =====================================================================
      // INITIAL SYNC: full iteration (unchanged from before)
      // =====================================================================
      totalNew = await syncInitial(client, supabase, accountId, effectiveBatchSize, deadline, logEntry?.id);
      syncStatus = (deadline && Date.now() >= deadline) ? 'timeout' : 'success';
      if (syncStatus === 'timeout') {
        syncError = 'Sync exceeded time limit, some folders were skipped';
      }
    } else {
      // =====================================================================
      // INCREMENTAL SYNC: smart change detection
      // =====================================================================
      totalNew = await syncIncremental(client, supabase, accountId, effectiveBatchSize, deadline);
      syncStatus = (deadline && Date.now() >= deadline) ? 'timeout' : 'success';
      if (syncStatus === 'timeout') {
        syncError = 'Sync exceeded time limit, some folders were skipped';
      }
    }

    // Update account last sync
    await supabase.from('emailove_ucty').update({
      posledni_sync: new Date().toISOString(),
    }).eq('id', accountId);
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

  if (syncError && syncStatus === 'error') {
    return { success: false, newCount: totalNew, logId: logEntry?.id, error: friendlyError(syncError) };
  }
  return { success: true, newCount: totalNew, logId: logEntry?.id, error: syncError || undefined };
}

/**
 * Sync IMAP \Seen flags for a folder: detect read/unread mismatches between
 * IMAP and DB and batch-update DB to match IMAP (source of truth).
 */
async function syncFolderFlags(
  client: ImapFlow,
  supabase: SupabaseClient,
  mailboxPath: string,
  folderDbId: string,
): Promise<void> {
  const lock = await client.getMailboxLock(mailboxPath);
  try {
    // 1. Fetch UID + flags for all messages (lightweight — no body content)
    const imapFlags = new Map<number, boolean>(); // uid → isSeen
    try {
      for await (const msg of client.fetch('1:*', { uid: true, flags: true }, { uid: true })) {
        imapFlags.set(msg.uid, msg.flags?.has('\\Seen') ?? false);
      }
    } catch {
      // Empty folder or fetch error — nothing to sync
      return;
    }

    // 2. Load all messages from DB for this folder
    const { data: dbMessages } = await supabase
      .from('emailove_zpravy')
      .select('id, imap_uid, precteno')
      .eq('id_slozky', folderDbId);

    if (!dbMessages || dbMessages.length === 0) return;

    // 3. Find mismatches
    const toMarkRead: string[] = [];
    const toMarkUnread: string[] = [];

    for (const dbMsg of dbMessages) {
      const imapSeen = imapFlags.get(dbMsg.imap_uid);
      if (imapSeen === undefined) continue; // message doesn't exist on IMAP
      if (imapSeen && !dbMsg.precteno) toMarkRead.push(dbMsg.id);
      if (!imapSeen && dbMsg.precteno) toMarkUnread.push(dbMsg.id);
    }

    // 4. Batch update (chunks of 200 for Supabase limit)
    for (let i = 0; i < toMarkRead.length; i += 200) {
      await supabase.from('emailove_zpravy')
        .update({ precteno: true })
        .in('id', toMarkRead.slice(i, i + 200));
    }
    for (let i = 0; i < toMarkUnread.length; i += 200) {
      await supabase.from('emailove_zpravy')
        .update({ precteno: false })
        .in('id', toMarkUnread.slice(i, i + 200));
    }

    if (toMarkRead.length > 0 || toMarkUnread.length > 0) {
      console.log(`[email-sync] Flag sync ${mailboxPath}: ${toMarkRead.length} marked read, ${toMarkUnread.length} marked unread`);
    }

    // 5. Recount and update folder
    const { count } = await supabase
      .from('emailove_zpravy')
      .select('id', { count: 'exact', head: true })
      .eq('id_slozky', folderDbId)
      .eq('precteno', false);

    await supabase.from('emailove_slozky')
      .update({ pocet_neprectenych: count ?? 0, posledni_flag_sync: new Date().toISOString() })
      .eq('id', folderDbId);
  } finally {
    lock.release();
  }
}

/**
 * Flush dirty flags to IMAP: find messages with dirty_flags=true for this account,
 * group by folder, and batch-update IMAP flags. Called at the start of each incremental sync.
 */
async function flushDirtyFlags(
  client: ImapFlow,
  supabase: SupabaseClient,
  accountId: string,
): Promise<void> {
  // Load all dirty messages for this account
  const { data: dirtyMessages } = await supabase
    .from('emailove_zpravy')
    .select('id, id_slozky, imap_uid, precteno, oznaceno')
    .eq('id_uctu', accountId)
    .eq('dirty_flags', true);

  if (!dirtyMessages || dirtyMessages.length === 0) return;

  // Load folders to get IMAP paths
  const folderIds = [...new Set(dirtyMessages.map((m: { id_slozky: string }) => m.id_slozky))];
  const { data: folders } = await supabase
    .from('emailove_slozky')
    .select('id, imap_cesta')
    .in('id', folderIds);

  if (!folders) return;

  const folderPathMap = new Map<string, string>();
  for (const f of folders) {
    folderPathMap.set(f.id, f.imap_cesta);
  }

  // Group messages by folder
  const byFolder = new Map<string, typeof dirtyMessages>();
  for (const msg of dirtyMessages) {
    const list = byFolder.get(msg.id_slozky) ?? [];
    list.push(msg);
    byFolder.set(msg.id_slozky, list);
  }

  const flushedIds: string[] = [];

  for (const [folderId, msgs] of byFolder) {
    const folderPath = folderPathMap.get(folderId);
    if (!folderPath) continue;

    let lock;
    try {
      lock = await client.getMailboxLock(folderPath);

      for (const msg of msgs) {
        if (msg.imap_uid <= 0) {
          flushedIds.push(msg.id);
          continue;
        }

        try {
          // Sync \Seen flag
          if (msg.precteno) {
            await client.messageFlagsAdd(String(msg.imap_uid), ['\\Seen'], { uid: true });
          } else {
            await client.messageFlagsRemove(String(msg.imap_uid), ['\\Seen'], { uid: true });
          }

          // Sync \Flagged flag
          if (msg.oznaceno) {
            await client.messageFlagsAdd(String(msg.imap_uid), ['\\Flagged'], { uid: true });
          } else {
            await client.messageFlagsRemove(String(msg.imap_uid), ['\\Flagged'], { uid: true });
          }

          flushedIds.push(msg.id);
        } catch (err) {
          console.error(`[email-sync] Failed to flush flags for UID ${msg.imap_uid}:`, err);
        }
      }
    } catch (err) {
      console.error(`[email-sync] Failed to open folder ${folderPath} for flag flush:`, err);
    } finally {
      lock?.release();
    }
  }

  // Reset dirty_flags for flushed messages
  if (flushedIds.length > 0) {
    for (let i = 0; i < flushedIds.length; i += 200) {
      await supabase
        .from('emailove_zpravy')
        .update({ dirty_flags: false })
        .in('id', flushedIds.slice(i, i + 200));
    }
    console.log(`[email-sync] Flushed ${flushedIds.length} dirty flags to IMAP for account ${accountId}`);
  }
}

/**
 * Incremental sync using smart change detection:
 * 1. LIST with statusQuery to get all folder statuses in ~1 IMAP command
 * 2. Load all folders from DB in 1 query
 * 3. Compare uidNext → only open folders with new messages
 * 4. Deferred reconciliation for folders with decreased message count
 */
async function syncIncremental(
  client: ImapFlow,
  supabase: SupabaseClient,
  accountId: string,
  effectiveBatchSize: number,
  deadline: number | null,
): Promise<number> {
  // Step 0: Flush any dirty flags to IMAP before syncing
  try {
    await flushDirtyFlags(client, supabase, accountId);
  } catch (err) {
    console.error(`[email-sync] flushDirtyFlags failed for ${accountId}:`, err);
  }

  // Step 1: Get status of ALL mailboxes in one IMAP command
  const mailboxes = await client.list({
    statusQuery: { messages: true, uidNext: true, unseen: true, uidValidity: true },
  });

  // Step 2: Load ALL folder records from DB in one query
  const { data: dbFolders } = await supabase
    .from('emailove_slozky')
    .select('id, imap_cesta, posledni_uid, uid_next, uid_validity, pocet_zprav, pocet_neprectenych, posledni_reconciliace, posledni_flag_sync')
    .eq('id_uctu', accountId);

  const dbFolderMap = new Map<string, FolderDbRecord>();
  for (const f of (dbFolders ?? [])) {
    dbFolderMap.set(f.imap_cesta, f as FolderDbRecord);
  }

  // Step 3: Compare and classify folders
  const foldersToSync: typeof mailboxes = [];
  const foldersToReconcile: typeof mailboxes = [];
  const foldersToFlagSync: { mailbox: typeof mailboxes[0]; dbFolderId: string }[] = [];
  const folderCountUpdates: { id: string; pocet_zprav: number; pocet_neprectenych: number; uid_next: number; uid_validity: number }[] = [];
  const newFolders: typeof mailboxes = [];

  for (const mailbox of mailboxes) {
    const dbFolder = dbFolderMap.get(mailbox.path);
    const imapMessages = mailbox.status?.messages ?? 0;
    const imapUidNext = mailbox.status?.uidNext ?? 0;
    const imapUnseen = mailbox.status?.unseen ?? 0;
    const imapUidValidity = mailbox.status?.uidValidity ? Number(mailbox.status.uidValidity) : 0;

    if (!dbFolder) {
      // New folder — create it and sync
      newFolders.push(mailbox);
      continue;
    }

    // Prepare count update for all folders (batch update later)
    folderCountUpdates.push({
      id: dbFolder.id,
      pocet_zprav: imapMessages,
      pocet_neprectenych: imapUnseen,
      uid_next: imapUidNext,
      uid_validity: imapUidValidity,
    });

    // Check if uidValidity changed (mailbox was recreated)
    if (imapUidValidity > 0 && dbFolder.uid_validity > 0 && imapUidValidity !== dbFolder.uid_validity) {
      // UID validity changed — need full resync of this folder
      foldersToSync.push(mailbox);
      continue;
    }

    // Check if uidNext increased → new messages
    if (imapUidNext > dbFolder.uid_next && dbFolder.uid_next > 0) {
      foldersToSync.push(mailbox);
    } else if (dbFolder.uid_next === 0 && imapMessages > 0) {
      // First time we track uid_next but folder has messages — sync to capture uid_next
      foldersToSync.push(mailbox);
    }

    // Check if messages decreased → possible deletions, needs reconciliation
    if (imapMessages < dbFolder.pocet_zprav) {
      foldersToReconcile.push(mailbox);
    }

    // Check if flag sync needed: counts differ, never synced, or stale (>6h)
    if (imapMessages <= FLAG_SYNC_MAX_MESSAGES) {
      const flagSyncStale = !dbFolder.posledni_flag_sync ||
        (Date.now() - new Date(dbFolder.posledni_flag_sync).getTime() > FLAG_SYNC_COOLDOWN_MS);
      if (imapUnseen !== dbFolder.pocet_neprectenych || flagSyncStale) {
        foldersToFlagSync.push({ mailbox, dbFolderId: dbFolder.id });
      }
    }
  }

  // Create new folders in DB
  for (const mailbox of newFolders) {
    const folderType = detectFolderType(mailbox.path, mailbox.specialUse);
    const folderId = `folder-${accountId}-${sanitizePath(mailbox.path)}`;
    const imapMessages = mailbox.status?.messages ?? 0;
    const imapUnseen = mailbox.status?.unseen ?? 0;
    const imapUidNext = mailbox.status?.uidNext ?? 0;
    const imapUidValidity = mailbox.status?.uidValidity ? Number(mailbox.status.uidValidity) : 0;

    await supabase.from('emailove_slozky').insert({
      id: folderId,
      id_uctu: accountId,
      nazev: mailbox.name,
      imap_cesta: mailbox.path,
      typ: folderType,
      poradi: getFolderOrder(folderType),
      pocet_zprav: imapMessages,
      pocet_neprectenych: imapUnseen,
      uid_next: imapUidNext,
      uid_validity: imapUidValidity,
    });

    // New folders with messages need syncing
    if (imapMessages > 0) {
      dbFolderMap.set(mailbox.path, {
        id: folderId,
        imap_cesta: mailbox.path,
        posledni_uid: 0,
        uid_next: 0,
        uid_validity: imapUidValidity,
        pocet_zprav: 0,
        pocet_neprectenych: 0,
        posledni_reconciliace: null,
        posledni_flag_sync: null,
      });
      foldersToSync.push(mailbox);
    }
  }

  // Batch update folder counts (non-blocking, best-effort)
  for (const update of folderCountUpdates) {
    await supabase.from('emailove_slozky').update({
      pocet_zprav: update.pocet_zprav,
      pocet_neprectenych: update.pocet_neprectenych,
      uid_next: update.uid_next,
      uid_validity: update.uid_validity,
    }).eq('id', update.id);
  }

  let totalNew = 0;

  // Step 4: Sync only folders with new messages
  for (const mailbox of foldersToSync) {
    if (deadline && Date.now() >= deadline) break;

    const dbFolder = dbFolderMap.get(mailbox.path);
    if (!dbFolder) continue;

    try {
      const newInFolder = await syncFolder(
        client, supabase, accountId, mailbox, dbFolder.id, dbFolder.posledni_uid, effectiveBatchSize,
      );
      totalNew += newInFolder;

      // Update uid_next after sync
      const imapUidNext = mailbox.status?.uidNext ?? 0;
      const imapUidValidity = mailbox.status?.uidValidity ? Number(mailbox.status.uidValidity) : 0;
      await supabase.from('emailove_slozky').update({
        uid_next: imapUidNext,
        uid_validity: imapUidValidity,
      }).eq('id', dbFolder.id);
    } catch (err) {
      console.error(`[email-sync] Error syncing folder ${mailbox.path}:`, err);
    }
  }

  // Step 4b: Flag sync — update read/unread state for folders where IMAP unseen differs from DB
  let flagSyncCount = 0;
  for (const { mailbox, dbFolderId } of foldersToFlagSync) {
    if (flagSyncCount >= MAX_FLAG_SYNC_FOLDERS) break;
    if (deadline && Date.now() >= deadline) break;

    try {
      await syncFolderFlags(client, supabase, mailbox.path, dbFolderId);
      flagSyncCount++;
    } catch (err) {
      console.error(`[email-sync] Flag sync error in ${mailbox.path}:`, err);
    }
  }

  // Step 5: Deferred reconciliation (max MAX_RECONCILIATION_FOLDERS folders, only if cooldown elapsed)
  let reconciledCount = 0;
  for (const mailbox of foldersToReconcile) {
    if (reconciledCount >= MAX_RECONCILIATION_FOLDERS) break;
    if (deadline && Date.now() >= deadline) break;

    const dbFolder = dbFolderMap.get(mailbox.path);
    if (!dbFolder) continue;

    // Check cooldown: skip if reconciled less than 1 hour ago
    if (dbFolder.posledni_reconciliace) {
      const elapsed = Date.now() - new Date(dbFolder.posledni_reconciliace).getTime();
      if (elapsed < RECONCILIATION_COOLDOWN_MS) continue;
    }

    // Skip large folders
    const imapMessages = mailbox.status?.messages ?? 0;
    if (imapMessages > 10000) continue;

    try {
      await reconcileFolder(client, supabase, mailbox.path, dbFolder.id);
      // Update reconciliation timestamp
      await supabase.from('emailove_slozky').update({
        posledni_reconciliace: new Date().toISOString(),
      }).eq('id', dbFolder.id);
      reconciledCount++;
    } catch (err) {
      console.error(`[email-sync] Reconciliation error in ${mailbox.path}:`, err);
    }
  }

  return totalNew;
}

/**
 * Sync a single folder: fetch new messages starting from lastUid+1.
 */
async function syncFolder(
  client: ImapFlow,
  supabase: SupabaseClient,
  accountId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mailbox: any,
  folderDbId: string,
  lastUid: number,
  effectiveBatchSize: number,
): Promise<number> {
  const lock = await client.getMailboxLock(mailbox.path);
  let newInFolder = 0;

  try {
    const fetchRange = `${lastUid + 1}:*`;
    let highestUid = lastUid;

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

    const pendingRows: Record<string, unknown>[] = [];

    for (const msg of pendingMessages) {
      const row = await processMessage(msg, client, accountId, folderDbId);
      if (row) {
        pendingRows.push(row);
        if (msg.uid > highestUid) highestUid = msg.uid;
      }

      if (pendingRows.length >= effectiveBatchSize) {
        const inserted = await batchUpsertMessages(supabase, pendingRows);
        newInFolder += inserted;
        pendingRows.length = 0;
      }
    }

    if (pendingRows.length > 0) {
      const inserted = await batchUpsertMessages(supabase, pendingRows);
      newInFolder += inserted;
    }

    // Update folder stats
    const status = await client.status(mailbox.path, { messages: true, unseen: true });
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

  return newInFolder;
}

/**
 * Reconcile a single folder: remove ghost messages that no longer exist on IMAP.
 */
async function reconcileFolder(
  client: ImapFlow,
  supabase: SupabaseClient,
  mailboxPath: string,
  folderDbId: string,
): Promise<void> {
  const lock = await client.getMailboxLock(mailboxPath);
  try {
    // Get all UIDs currently in this IMAP folder
    const imapUids: number[] = [];
    try {
      for await (const msg of client.fetch('1:*', { uid: true }, { uid: true })) {
        imapUids.push(msg.uid);
      }
    } catch {
      // If fetch fails (e.g. empty folder), treat as empty
    }

    const imapUidSet = new Set(imapUids);

    // Get all UIDs stored in DB for this folder
    const { data: dbMessages } = await supabase
      .from('emailove_zpravy')
      .select('imap_uid')
      .eq('id_slozky', folderDbId);

    if (dbMessages && dbMessages.length > 0) {
      const ghostUids = dbMessages
        .map((m: { imap_uid: number }) => m.imap_uid)
        .filter((uid: number) => uid > 0 && !imapUidSet.has(uid));

      if (ghostUids.length > 0) {
        const { error: deleteError } = await supabase
          .from('emailove_zpravy')
          .delete()
          .eq('id_slozky', folderDbId)
          .in('imap_uid', ghostUids);

        if (deleteError) {
          console.error(`[email-sync] Failed to delete ghost messages in ${mailboxPath}:`, deleteError.message);
        } else {
          console.log(`[email-sync] Reconciliation: removed ${ghostUids.length} ghost messages from ${mailboxPath}`);
        }
      }
    }
  } finally {
    lock.release();
  }
}

/**
 * Initial sync: full iteration of all folders (original behavior, preserved).
 */
async function syncInitial(
  client: ImapFlow,
  supabase: SupabaseClient,
  accountId: string,
  effectiveBatchSize: number,
  deadline: number | null,
  logId?: number,
): Promise<number> {
  const mailboxes = await client.list();

  // First pass to count total messages across all folders
  if (logId) {
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
    }).eq('id', logId);
  }

  let globalProcessed = 0;
  let totalNew = 0;

  for (const mailbox of mailboxes) {
    if (deadline && Date.now() >= deadline) {
      console.warn(`[email-sync] Timeout reached for account ${accountId}, skipping remaining folders`);
      break;
    }

    try {
      const folderType = detectFolderType(mailbox.path, mailbox.specialUse);
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

      const lock = await client.getMailboxLock(mailbox.path);
      try {
        const status = await client.status(mailbox.path, { messages: true, unseen: true, uidNext: true, uidValidity: true });

        if ((status.messages ?? 0) === 0 && lastUid === 0) {
          if (logId) {
            await supabase.from('emailovy_log').update({
              zpracovano: globalProcessed,
              aktualni_slozka: mailbox.name,
            }).eq('id', logId);
          }
          await supabase.from('emailove_slozky').update({
            pocet_zprav: status.messages ?? 0,
            pocet_neprectenych: status.unseen ?? 0,
            uid_next: status.uidNext ?? 0,
            uid_validity: status.uidValidity ? Number(status.uidValidity) : 0,
          }).eq('id', folderDbId);
          continue;
        }

        if (logId) {
          await supabase.from('emailovy_log').update({
            aktualni_slozka: mailbox.name,
          }).eq('id', logId);
        }

        const fetchRange = `${lastUid + 1}:*`;
        let highestUid = lastUid;
        let newInFolder = 0;

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

        const pendingRows: Record<string, unknown>[] = [];

        for (const msg of pendingMessages) {
          const row = await processMessage(msg, client, accountId, folderDbId);
          if (row) {
            pendingRows.push(row);
            if (msg.uid > highestUid) highestUid = msg.uid;
          }

          if (pendingRows.length >= effectiveBatchSize) {
            const inserted = await batchUpsertMessages(supabase, pendingRows);
            newInFolder += inserted;
            globalProcessed += pendingRows.length;
            pendingRows.length = 0;

            if (logId) {
              await supabase.from('emailovy_log').update({
                zpracovano: globalProcessed,
              }).eq('id', logId);
            }
          }
        }

        if (pendingRows.length > 0) {
          const inserted = await batchUpsertMessages(supabase, pendingRows);
          newInFolder += inserted;
          globalProcessed += pendingRows.length;

          if (logId) {
            await supabase.from('emailovy_log').update({
              zpracovano: globalProcessed,
            }).eq('id', logId);
          }
        }

        totalNew += newInFolder;

        const folderUpdate: Record<string, unknown> = {
          pocet_zprav: status.messages ?? 0,
          pocet_neprectenych: status.unseen ?? 0,
          uid_next: status.uidNext ?? 0,
          uid_validity: status.uidValidity ? Number(status.uidValidity) : 0,
        };
        if (highestUid > lastUid) {
          folderUpdate.posledni_uid = highestUid;
        }
        await supabase.from('emailove_slozky').update(folderUpdate).eq('id', folderDbId);
      } finally {
        lock.release();
      }
    } catch (folderErr) {
      console.error(`[email-sync] Error processing folder ${mailbox.path}:`, folderErr);
    }
  }

  return totalNew;
}
