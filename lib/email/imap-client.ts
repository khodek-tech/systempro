/**
 * Shared IMAP connection utility.
 * Extracts common connect-decrypt-execute-logout pattern used across API routes.
 */

import { ImapFlow } from 'imapflow';
import { decrypt } from './encryption';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SupabaseClient = any;

interface AccountRow {
  imap_server: string;
  imap_port: number | null;
  uzivatelske_jmeno: string;
  heslo_sifrovane: string;
  heslo_iv: string;
  heslo_tag: string;
}

/**
 * Open an IMAP connection for the given account, execute `fn`, then logout.
 * Handles: account lookup → decrypt password → connect → fn(client) → logout.
 */
export async function withImapConnection<T>(
  accountId: string,
  supabase: SupabaseClient,
  fn: (client: ImapFlow) => Promise<T>,
): Promise<T> {
  const { data: account, error: accError } = await supabase
    .from('emailove_ucty')
    .select('imap_server, imap_port, uzivatelske_jmeno, heslo_sifrovane, heslo_iv, heslo_tag')
    .eq('id', accountId)
    .single();

  if (accError || !account) {
    throw new Error('Account not found');
  }

  const acc = account as AccountRow;
  const password = decrypt(acc.heslo_sifrovane, acc.heslo_iv, acc.heslo_tag);

  const client = new ImapFlow({
    host: acc.imap_server,
    port: acc.imap_port ?? 993,
    secure: (acc.imap_port ?? 993) === 993,
    auth: {
      user: acc.uzivatelske_jmeno,
      pass: password,
    },
    logger: false,
    tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
    connectionTimeout: 30000,
    greetingTimeout: 16000,
    socketTimeout: 60000,
  });

  await client.connect();
  try {
    return await fn(client);
  } finally {
    await client.logout().catch(() => {});
  }
}
