import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { decrypt } from '@/lib/email/encryption';
import { withImapConnection } from '@/lib/email/imap-client';
import nodemailer from 'nodemailer';
import MailComposer from 'nodemailer/lib/mail-composer';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const accountId = formData.get('accountId') as string;
    const to = JSON.parse(formData.get('to') as string || '[]');
    const cc = formData.has('cc') ? JSON.parse(formData.get('cc') as string) : undefined;
    const bcc = formData.has('bcc') ? JSON.parse(formData.get('bcc') as string) : undefined;
    const subject = formData.get('subject') as string || '';
    const bodyText = formData.get('bodyText') as string || '';
    const bodyHtml = formData.get('bodyHtml') as string | null;
    const inReplyTo = formData.get('inReplyTo') as string | null;
    const threadId = formData.get('threadId') as string | null;

    if (!accountId || !to?.length) {
      return NextResponse.json({ success: false, error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createClient();

    // Resolve employee ID from auth user
    const { data: employee } = await supabase
      .from('zamestnanci')
      .select('id')
      .eq('auth_id', user.id)
      .single();

    if (!employee) {
      return NextResponse.json({ success: false, error: 'Employee not found' }, { status: 403 });
    }

    // Check send permission for this employee
    const { data: access } = await supabase
      .from('emailovy_pristup')
      .select('muze_odesilat')
      .eq('id_uctu', accountId)
      .eq('id_zamestnance', employee.id)
      .single();

    if (!access?.muze_odesilat) {
      return NextResponse.json({ success: false, error: 'No send permission' }, { status: 403 });
    }

    // Get account details
    const { data: account, error: accError } = await supabase
      .from('emailove_ucty')
      .select('*')
      .eq('id', accountId)
      .single();

    if (accError || !account) {
      return NextResponse.json({ success: false, error: 'Account not found' }, { status: 404 });
    }

    // Decrypt password
    const password = decrypt(account.heslo_sifrovane, account.heslo_iv, account.heslo_tag);

    // Collect attachments from formData
    const attachments: { filename: string; content: Buffer; contentType: string }[] = [];
    const files = formData.getAll('attachments');
    for (const file of files) {
      if (file instanceof File) {
        const buffer = Buffer.from(await file.arrayBuffer());
        attachments.push({
          filename: file.name,
          content: buffer,
          contentType: file.type,
        });
      }
    }

    // Create transport
    const smtpPort = account.smtp_port ?? 465;
    const transporter = nodemailer.createTransport({
      host: account.smtp_server,
      port: smtpPort,
      secure: smtpPort === 465,
      ...(smtpPort !== 465 && { requireTLS: true }),
      auth: {
        user: account.uzivatelske_jmeno,
        pass: password,
      },
      tls: { rejectUnauthorized: false },
    });

    // Format addresses
    const formatAddr = (addr: { name?: string; address: string }) =>
      addr.name ? `"${addr.name}" <${addr.address}>` : addr.address;

    // Send email
    const mailOptions: nodemailer.SendMailOptions = {
      from: formatAddr({ name: account.nazev, address: account.email }),
      to: to.map(formatAddr).join(', '),
      subject,
      text: bodyText,
      ...(bodyHtml && { html: bodyHtml }),
      ...(cc && { cc: cc.map(formatAddr).join(', ') }),
      ...(bcc && { bcc: bcc.map(formatAddr).join(', ') }),
      ...(inReplyTo && { inReplyTo, references: inReplyTo }),
      ...(attachments.length > 0 && { attachments }),
    };

    const info = await transporter.sendMail(mailOptions);

    // Save to Sent folder in DB
    const sentFolder = await supabase
      .from('emailove_slozky')
      .select('id, imap_cesta')
      .eq('id_uctu', accountId)
      .eq('typ', 'sent')
      .single();

    // Try to APPEND the message to the IMAP Sent folder (best-effort)
    let appendedUid = 0;
    if (sentFolder.data?.imap_cesta) {
      try {
        const composer = new MailComposer({
          from: formatAddr({ name: account.nazev, address: account.email }),
          to: to.map(formatAddr).join(', '),
          subject,
          text: bodyText,
          ...(bodyHtml && { html: bodyHtml }),
          ...(cc && { cc: cc.map(formatAddr).join(', ') }),
          ...(bcc && { bcc: bcc.map(formatAddr).join(', ') }),
          ...(inReplyTo && { inReplyTo, references: inReplyTo }),
          messageId: info.messageId,
          date: new Date(),
          ...(attachments.length > 0 && { attachments }),
        });
        const rawMessage = await compiler(composer);

        const result = await withImapConnection(accountId, supabase, async (client) => {
          return await client.append(sentFolder.data.imap_cesta, rawMessage, ['\\Seen']);
        });

        if (typeof result === 'object' && result.uid) {
          appendedUid = result.uid;
        }
      } catch (appendErr) {
        // APPEND is best-effort — email was already sent via SMTP
        console.error('IMAP APPEND to Sent failed (non-critical):', appendErr);
      }
    }

    if (sentFolder.data) {
      const messageId = `msg-${accountId}-sent-${Date.now()}`;
      await supabase.from('emailove_zpravy').insert({
        id: messageId,
        id_uctu: accountId,
        id_slozky: sentFolder.data.id,
        imap_uid: appendedUid,
        id_zpravy_rfc: info.messageId || null,
        predmet: subject,
        odesilatel: { name: account.nazev, address: account.email },
        prijemci: to,
        kopie: cc || null,
        datum: new Date().toISOString(),
        nahled: bodyText.substring(0, 200),
        telo_text: bodyText,
        telo_html: bodyHtml || null,
        precteno: true,
        oznaceno: false,
        ma_prilohy: attachments.length > 0,
        metadata_priloh: attachments.map((a) => ({
          name: a.filename,
          size: a.content.length,
          contentType: a.contentType,
          partId: '',
        })),
        odpoved_na: inReplyTo || null,
        vlakno_id: threadId || info.messageId || null,
        velikost: 0,
      });

      // Update sent folder message count
      const { data: folderData } = await supabase
        .from('emailove_slozky')
        .select('pocet_zprav')
        .eq('id', sentFolder.data.id)
        .single();
      if (folderData) {
        await supabase.from('emailove_slozky').update({
          pocet_zprav: (folderData.pocet_zprav ?? 0) + 1,
        }).eq('id', sentFolder.data.id);
      }
    }

    return NextResponse.json({ success: true, messageId: info.messageId });
  } catch (error) {
    console.error('Email send error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to send email';
    return NextResponse.json({ success: false, error: errMsg });
  }
}

/** Compile a MailComposer instance into a raw RFC822 Buffer */
function compiler(mail: InstanceType<typeof MailComposer>): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    mail.compile().build((err: Error | null, message: Buffer) => {
      if (err) reject(err);
      else resolve(message);
    });
  });
}
