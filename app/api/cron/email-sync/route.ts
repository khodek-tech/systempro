import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncAccount } from '@/lib/email/sync-core';

export const maxDuration = 300; // 5 min max for Vercel serverless

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Fetch all active email accounts
  const { data: accounts, error } = await supabase
    .from('emailove_ucty')
    .select('id, nazev')
    .eq('aktivni', true);

  if (error || !accounts) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }

  const results: { accountId: string; name: string; success: boolean; newCount: number; error?: string }[] = [];

  // Sync accounts sequentially to avoid IMAP connection overload
  for (const account of accounts) {
    try {
      const result = await syncAccount(supabase, account.id, 'incremental', 50);
      results.push({
        accountId: account.id,
        name: account.nazev,
        success: result.success,
        newCount: result.newCount,
        error: result.error,
      });
    } catch (err) {
      results.push({
        accountId: account.id,
        name: account.nazev,
        success: false,
        newCount: 0,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  const totalNew = results.reduce((sum, r) => sum + r.newCount, 0);
  const failedCount = results.filter((r) => !r.success).length;

  return NextResponse.json({
    ok: true,
    accountsSynced: accounts.length,
    totalNew,
    failedCount,
    results,
  });
}
