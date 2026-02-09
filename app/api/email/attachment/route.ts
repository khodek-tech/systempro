import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { ImapFlow } from 'imapflow';

export async function GET(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = request.nextUrl;
    const accountId = searchParams.get('accountId');
    const folderId = searchParams.get('folderId');
    const messageUid = searchParams.get('messageUid');
    const partId = searchParams.get('partId');

    if (!accountId || !folderId || !messageUid || !partId) {
      return NextResponse.json({ success: false, error: 'Missing parameters' }, { status: 400 });
    }

    const supabase = await createClient();

    // Get account
    const { data: account } = await supabase
      .from('emailove_ucty')
      .select('*')
      .eq('id', accountId)
      .single();

    if (!account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Get folder IMAP path
    const { data: folder } = await supabase
      .from('emailove_slozky')
      .select('imap_cesta')
      .eq('id', folderId)
      .single();

    if (!folder) {
      return NextResponse.json({ success: false, error: 'Folder not found' }, { status: 404 });
    }

    // Decrypt password
    const password = decrypt(account.heslo_sifrovane, account.heslo_iv, account.heslo_tag);

    // Connect to IMAP and fetch attachment
    const client = new ImapFlow({
      host: account.imap_server,
      port: account.imap_port ?? 993,
      secure: (account.imap_port ?? 993) === 993,
      auth: { user: account.uzivatelske_jmeno, pass: password },
      logger: false,
      tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
    });

    await client.connect();
    const lock = await client.getMailboxLock(folder.imap_cesta);

    try {
      const uid = parseInt(messageUid, 10);
      const { content } = await client.download(String(uid), partId, { uid: true });

      // Read the stream into a buffer
      const chunks: Buffer[] = [];
      for await (const chunk of content) {
        chunks.push(Buffer.from(chunk));
      }
      const buffer = Buffer.concat(chunks);

      // Get attachment info from message
      const { data: message } = await supabase
        .from('emailove_zpravy')
        .select('metadata_priloh')
        .eq('id_uctu', accountId)
        .eq('imap_uid', uid)
        .single();

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const attachments = (message?.metadata_priloh || []) as any[];
      const attachment = attachments.find((a: { partId?: string }) => a.partId === partId);
      const filename = attachment?.name || 'attachment';
      const contentType = attachment?.contentType || 'application/octet-stream';

      lock.release();
      await client.logout();

      return new NextResponse(buffer, {
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${encodeURIComponent(filename)}"`,
          'Content-Length': buffer.length.toString(),
        },
      });
    } catch (err) {
      lock.release();
      await client.logout();
      throw err;
    }
  } catch (error) {
    console.error('Attachment download error:', error);
    return NextResponse.json({ success: false, error: 'Failed to download attachment' });
  }
}
