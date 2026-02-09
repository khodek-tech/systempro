import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { encrypt } from '@/lib/email/encryption';
import { emailAccountCreateSchema, emailAccountUpdateSchema, parseBody } from '@/lib/api/schemas';

export async function POST(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailAccountCreateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { name, email, imapServer, imapPort, smtpServer, smtpPort, username, password } = parsed.data;

    // Encrypt password
    const { encrypted, iv, tag } = encrypt(password);

    const id = `email-acc-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

    const supabase = await createClient();
    const { error } = await supabase.from('emailove_ucty').insert({
      id,
      nazev: name,
      email,
      imap_server: imapServer,
      imap_port: imapPort ?? 993,
      smtp_server: smtpServer,
      smtp_port: smtpPort ?? 465,
      uzivatelske_jmeno: username,
      heslo_sifrovane: encrypted,
      heslo_iv: iv,
      heslo_tag: tag,
    });

    if (error) {
      console.error('Failed to create email account:', error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true, id });
  } catch (error) {
    console.error('Email account creation error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to create account';
    return NextResponse.json({ success: false, error: errMsg });
  }
}

export async function PUT(request: NextRequest) {
  const { error: authError } = await requireAdmin();
  if (authError) {
    const status = authError === 'Forbidden' ? 403 : 401;
    return NextResponse.json({ success: false, error: authError }, { status });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailAccountUpdateSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { id, name, email, imapServer, imapPort, smtpServer, smtpPort, username, password, active } = parsed.data;

    const supabase = await createClient();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updates: Record<string, any> = {
      aktualizovano: new Date().toISOString(),
    };

    if (name !== undefined) updates.nazev = name;
    if (email !== undefined) updates.email = email;
    if (imapServer !== undefined) updates.imap_server = imapServer;
    if (imapPort !== undefined) updates.imap_port = imapPort;
    if (smtpServer !== undefined) updates.smtp_server = smtpServer;
    if (smtpPort !== undefined) updates.smtp_port = smtpPort;
    if (username !== undefined) updates.uzivatelske_jmeno = username;
    if (active !== undefined) updates.aktivni = active;

    // Re-encrypt if password changed
    if (password) {
      const { encrypted, iv, tag } = encrypt(password);
      updates.heslo_sifrovane = encrypted;
      updates.heslo_iv = iv;
      updates.heslo_tag = tag;
    }

    const { error } = await supabase
      .from('emailove_ucty')
      .update(updates)
      .eq('id', id);

    if (error) {
      console.error('Failed to update email account:', error);
      return NextResponse.json({ success: false, error: error.message });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email account update error:', error);
    const errMsg = error instanceof Error ? error.message : 'Failed to update account';
    return NextResponse.json({ success: false, error: errMsg });
  }
}
