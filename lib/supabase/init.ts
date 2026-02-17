'use client';

import { useEffect, useState } from 'react';
import { useRolesStore } from '@/core/stores/roles-store';
import { useStoresStore } from '@/core/stores/stores-store';
import { useUsersStore } from '@/core/stores/users-store';
import { useModulesStore } from '@/core/stores/modules-store';
import { useAbsenceStore } from '@/features/absence/absence-store';
import { useTasksStore } from '@/features/tasks/tasks-store';
import { useChatStore } from '@/features/chat/chat-store';
import { useEmailStore } from '@/features/email/email-store';
import { useAdminStore } from '@/admin/admin-store';
import { useAttendanceStore } from '@/features/attendance/attendance-store';
import { usePohodaStore } from '@/features/pohoda/pohoda-store';
import { useMotivationStore } from '@/features/motivation/motivation-store';
import { LEGACY_STORAGE_KEYS } from '@/lib/constants';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

/**
 * Clean up legacy localStorage keys from when stores used persist middleware.
 */
function cleanupLegacyStorage() {
  if (typeof window === 'undefined') return;
  for (const key of LEGACY_STORAGE_KEYS) {
    localStorage.removeItem(key);
  }
}

/**
 * Retry a function with exponential backoff.
 */
async function withRetry<T>(fn: () => Promise<T>, maxAttempts = 3, baseDelay = 1000): Promise<T> {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      if (attempt === maxAttempts) throw err;
      const delay = baseDelay * Math.pow(2, attempt - 1);
      logger.warn(`Init attempt ${attempt}/${maxAttempts} failed, retrying in ${delay}ms`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }
  throw new Error('withRetry: unreachable');
}

/**
 * Initialize all stores by fetching data from Supabase.
 * Order matters: roles + stores first, then users (depends on roles/stores for validation),
 * then everything else in parallel.
 * Critical phases (1+2) are retried up to 3 times. Phase 3 (non-critical) continues on partial failure.
 * After init: start Realtime subscriptions (polling handled by Vercel Cron Jobs).
 */
async function initializeStores() {
  // Phase 1: Core entities (no dependencies) — critical, retry
  await withRetry(() =>
    Promise.all([
      useRolesStore.getState().fetchRoles(),
      useStoresStore.getState().fetchStores(),
    ])
  );

  // Phase 2: Users (may reference roles/stores) — critical, retry
  await withRetry(() => useUsersStore.getState().fetchUsers());

  // Phase 3: Everything else in parallel — non-critical, best-effort
  await Promise.allSettled([
    useModulesStore.getState().fetchModules(),
    useAbsenceStore.getState().fetchAbsenceRequests(),
    useTasksStore.getState().fetchTasks(),
    useChatStore.getState().fetchChatData(),
    useEmailStore.getState().fetchEmailData(),
    useAdminStore.getState().fetchAttendanceRecords(),
    useAttendanceStore.getState().fetchTodayAttendance(),
    usePohodaStore.getState().fetchPohodaConfig(),
    useMotivationStore.getState().fetchSettings(),
  ]);

  // Phase 4: Start Realtime subscriptions + auto-sync polling as fallback
  useAttendanceStore.getState().subscribeRealtime();
  useAdminStore.getState().subscribeRealtime();
  useEmailStore.getState().subscribeRealtime();
  useChatStore.getState().subscribeRealtime();
  useTasksStore.getState().subscribeRealtime();
  useAbsenceStore.getState().subscribeRealtime();
  useAttendanceStore.getState().startAutoSync();
  useChatStore.getState().startAutoSync();
  useTasksStore.getState().startAutoSync();
}

/**
 * Tear down Realtime subscriptions.
 */
export function cleanupSubscriptions() {
  useAttendanceStore.getState().unsubscribeRealtime();
  useAdminStore.getState().unsubscribeRealtime();
  useEmailStore.getState().unsubscribeRealtime();
  useChatStore.getState().unsubscribeRealtime();
  useTasksStore.getState().unsubscribeRealtime();
  useAbsenceStore.getState().unsubscribeRealtime();
  useAttendanceStore.getState().stopAutoSync();
  useChatStore.getState().stopAutoSync();
  useTasksStore.getState().stopAutoSync();
}

/**
 * Hook that initializes all stores on mount.
 * Returns { ready, error } - ready=true when all data is loaded, error if init failed.
 */
export function useInitializeData() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    cleanupLegacyStorage();
    initializeStores()
      .then(() => {
        if (!cancelled) {
          setReady(true);
        }
      })
      .catch((err) => {
        logger.error('Failed to initialize stores');
        if (!cancelled) {
          const message = err instanceof Error ? err.message : 'Nepodařilo se načíst data';
          setError(message);
          toast.error('Chyba při načítání dat. Zkuste obnovit stránku.');
        }
      });

    return () => {
      cancelled = true;
      cleanupSubscriptions();
    };
  }, []);

  return { ready, error };
}
