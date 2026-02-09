import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { withImapConnection } from '@/lib/email/imap-client';
import { emailImapActionSchema, parseBody } from '@/lib/api/schemas';

export async function POST(request: NextRequest) {
  const { user, error: authError } = await requireAuth();
  if (authError || !user) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const parsed = parseBody(emailImapActionSchema, body);
    if (!parsed.success) {
      return NextResponse.json({ success: false, error: parsed.error }, { status: 400 });
    }
    const { action, messageId, accountId, targetFolderId } = parsed.data;

    const supabase = await createClient();

    // Load the message to get imap_uid and folder
    const { data: message, error: msgError } = await supabase
      .from('emailove_zpravy')
      .select('imap_uid, id_slozky')
      .eq('id', messageId)
      .single();

    if (msgError || !message) {
      return NextResponse.json({ success: false, error: 'Message not found' }, { status: 404 });
    }

    const imapUid = message.imap_uid as number;
    if (imapUid <= 0) {
      // Locally-created message (e.g. sent via SMTP but no IMAP UID) — skip IMAP
      return NextResponse.json({ success: true, skipped: true });
    }

    // Get source folder IMAP path
    const { data: sourceFolder } = await supabase
      .from('emailove_slozky')
      .select('imap_cesta')
      .eq('id', message.id_slozky)
      .single();

    if (!sourceFolder?.imap_cesta) {
      return NextResponse.json({ success: false, error: 'Source folder not found' }, { status: 404 });
    }

    // For move: get target folder path
    let targetImapPath: string | undefined;
    if (action === 'move') {
      if (!targetFolderId) {
        return NextResponse.json({ success: false, error: 'targetFolderId required for move' }, { status: 400 });
      }
      const { data: targetFolder } = await supabase
        .from('emailove_slozky')
        .select('imap_cesta')
        .eq('id', targetFolderId)
        .single();

      if (!targetFolder?.imap_cesta) {
        return NextResponse.json({ success: false, error: 'Target folder not found' }, { status: 404 });
      }
      targetImapPath = targetFolder.imap_cesta;
    }

    const result = await withImapConnection(accountId, supabase, async (client) => {
      const lock = await client.getMailboxLock(sourceFolder.imap_cesta);
      try {
        const uidStr = String(imapUid);

        switch (action) {
          case 'move': {
            const moveResult = await client.messageMove(uidStr, targetImapPath!, { uid: true });
            let newUid: number | undefined;
            if (typeof moveResult === 'object' && moveResult.uidMap) {
              const mapped = moveResult.uidMap.get(imapUid);
              if (mapped) newUid = mapped;
            }
            return { newUid };
          }
          case 'setRead':
            await client.messageFlagsAdd(uidStr, ['\\Seen'], { uid: true });
            return {};
          case 'setUnread':
            await client.messageFlagsRemove(uidStr, ['\\Seen'], { uid: true });
            return {};
          case 'setFlagged':
            await client.messageFlagsAdd(uidStr, ['\\Flagged'], { uid: true });
            return {};
          case 'unsetFlagged':
            await client.messageFlagsRemove(uidStr, ['\\Flagged'], { uid: true });
            return {};
          case 'delete':
            await client.messageDelete(uidStr, { uid: true });
            return {};
          default:
            throw new Error(`Unknown action: ${action}`);
        }
      } finally {
        lock.release();
      }
    });

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error('IMAP action error:', error);
    const errMsg = error instanceof Error ? error.message : 'IMAP action failed';
    return NextResponse.json({ success: false, error: errMsg });
  }
}
