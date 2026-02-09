import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { ImapFlow } from 'imapflow';
import nodemailer from 'nodemailer';
import { emailTestConnectionSchema, parseBody } from '@/lib/api/schemas';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailTestConnectionSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }

    let imapServer: string, imapPort: number, smtpServer: string, smtpPort: number, username: string, password: string;

    if ('accountId' in parsed.data && parsed.data.accountId) {
      // Test existing account
      const supabase = await createClient();
      const { data: account, error: accError } = await supabase
        .from('emailove_ucty')
        .select('*')
        .eq('id', body.accountId)
        .single();

      if (accError || !account) {
        return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
      }

      imapServer = account.imap_server;
      imapPort = account.imap_port ?? 993;
      smtpServer = account.smtp_server;
      smtpPort = account.smtp_port ?? 465;
      username = account.uzivatelske_jmeno;
      password = decrypt(account.heslo_sifrovane, account.heslo_iv, account.heslo_tag);
    } else {
      // Test new credentials (already validated by Zod)
      const creds = parsed.data as { imapServer: string; imapPort?: number; smtpServer: string; smtpPort?: number; username: string; password: string };
      imapServer = creds.imapServer;
      imapPort = creds.imapPort ?? 993;
      smtpServer = creds.smtpServer;
      smtpPort = creds.smtpPort ?? 465;
      username = creds.username;
      password = creds.password;
    }

    let imapOk = false;
    let smtpOk = false;
    let imapError: string | undefined;
    let smtpError: string | undefined;

    // Test IMAP
    try {
      const client = new ImapFlow({
        host: imapServer,
        port: imapPort,
        secure: imapPort === 993,
        auth: { user: username, pass: password },
        logger: false,
        tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
      });
      await client.connect();
      await client.logout();
      imapOk = true;
    } catch (err) {
      imapError = err instanceof Error ? err.message : String(err);
    }

    // Test SMTP
    try {
      const transporter = nodemailer.createTransport({
        host: smtpServer,
        port: smtpPort,
        secure: smtpPort === 465,
        ...(smtpPort !== 465 && { requireTLS: true }),
        auth: { user: username, pass: password },
        tls: { rejectUnauthorized: process.env.EMAIL_REJECT_UNAUTHORIZED !== 'false' },
      });
      await transporter.verify();
      smtpOk = true;
    } catch (err) {
      smtpError = err instanceof Error ? err.message : String(err);
    }

    const success = imapOk && smtpOk;
    return NextResponse.json({
      success,
      imap: imapOk,
      smtp: smtpOk,
      error: !success
        ? `${!imapOk ? `IMAP: ${imapError}` : ''}${!imapOk && !smtpOk ? ' | ' : ''}${!smtpOk ? `SMTP: ${smtpError}` : ''}`
        : undefined,
    });
  } catch (error) {
    console.error('Test connection error:', error);
    return NextResponse.json({ success: false, error: 'Test failed' });
  }
}
