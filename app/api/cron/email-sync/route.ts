import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { syncAccount } from '@/lib/email/sync-core';

export const maxDuration = 300; // 5 min max for Vercel serverless

const MAX_ACCOUNTS_PER_RUN = 8;
const HEARTBEAT_WINDOW_MIN = 20;
const DEDUP_GUARD_MIN = 5;

export async function GET(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = createAdminClient();

  // Cleanup stuck logs older than 10 minutes
  await supabase
    .from('emailovy_log')
    .update({ stav: 'timeout', zprava: 'Sync exceeded time limit' })
    .eq('stav', 'running')
    .lt('vytvoreno', new Date(Date.now() - 10 * 60 * 1000).toISOString());

  // Check heartbeat: is anyone actively using the email module?
  const heartbeatCutoff = new Date(Date.now() - HEARTBEAT_WINDOW_MIN * 60 * 1000).toISOString();
  const { data: activeUsers } = await supabase
    .from('email_aktivita')
    .select('id_zamestnance')
    .gte('posledni_aktivita', heartbeatCutoff)
    .limit(1);

  if (!activeUsers || activeUsers.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'no active users',
    });
  }

  // Fetch active accounts that have completed initial sync (posledni_sync IS NOT NULL)
  const { data: accounts, error } = await supabase
    .from('emailove_ucty')
    .select('id, nazev, posledni_sync')
    .eq('aktivni', true)
    .not('posledni_sync', 'is', null)
    .order('posledni_sync', { ascending: true });

  if (error || !accounts) {
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 });
  }

  // Filter out accounts whose last successful sync was less than DEDUP_GUARD_MIN minutes ago
  const dedupCutoff = Date.now() - DEDUP_GUARD_MIN * 60 * 1000;
  const eligibleAccounts = accounts.filter((acc) => {
    if (!acc.posledni_sync) return true;
    return new Date(acc.posledni_sync).getTime() < dedupCutoff;
  });

  // Priority scheduling: hot → warm → cold
  // Hot: account has heartbeat < 10 min (someone is actively viewing it)
  // Warm: account has heartbeat < 2h
  // Cold: no recent activity
  const HOT_WINDOW_MS = 10 * 60 * 1000;
  const WARM_WINDOW_MS = 2 * 60 * 60 * 1000;

  const { data: accountHeartbeats } = await supabase
    .from('email_aktivita')
    .select('id_uctu, posledni_aktivita')
    .neq('id_uctu', '');

  const heartbeatMap = new Map<string, number>();
  if (accountHeartbeats) {
    for (const hb of accountHeartbeats) {
      const ts = new Date(hb.posledni_aktivita).getTime();
      const existing = heartbeatMap.get(hb.id_uctu);
      if (!existing || ts > existing) {
        heartbeatMap.set(hb.id_uctu, ts);
      }
    }
  }

  const now = Date.now();
  const hot: typeof eligibleAccounts = [];
  const warm: typeof eligibleAccounts = [];
  const cold: typeof eligibleAccounts = [];

  for (const acc of eligibleAccounts) {
    const lastActivity = heartbeatMap.get(acc.id);
    if (lastActivity && now - lastActivity < HOT_WINDOW_MS) {
      hot.push(acc);
    } else if (lastActivity && now - lastActivity < WARM_WINDOW_MS) {
      warm.push(acc);
    } else {
      cold.push(acc);
    }
  }

  // Take hot first, then warm, then cold — up to MAX_ACCOUNTS_PER_RUN
  const accountsToSync = [...hot, ...warm, ...cold].slice(0, MAX_ACCOUNTS_PER_RUN);

  if (accountsToSync.length === 0) {
    return NextResponse.json({
      ok: true,
      skipped: true,
      reason: 'all accounts recently synced',
    });
  }

  const results: { accountId: string; name: string; success: boolean; newCount: number; error?: string }[] = [];

  // Sync accounts sequentially to avoid IMAP connection overload
  for (const account of accountsToSync) {
    try {
      const result = await syncAccount(supabase, account.id, 'incremental', 50, 30000);
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
    accountsSynced: accountsToSync.length,
    totalEligible: eligibleAccounts.length,
    totalActive: accounts.length,
    totalNew,
    failedCount,
    results,
  });
}
