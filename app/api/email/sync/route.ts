import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/supabase/api-auth';
import { createClient } from '@/lib/supabase/server';
import { emailSyncSchema, parseBody } from '@/lib/api/schemas';
import { syncAccount } from '@/lib/email/sync-core';

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

    const supabase = await createClient();
    const result = await syncAccount(supabase, accountId, mode);

    if (!result.success) {
      return NextResponse.json({ success: false, error: result.error });
    }
    return NextResponse.json({ success: true, newCount: result.newCount, logId: result.logId });
  } catch (error) {
    console.error('Email sync error:', error);
    return NextResponse.json({ success: false, error: 'Sync failed' });
  }
}
