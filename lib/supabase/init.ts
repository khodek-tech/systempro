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
import { LEGACY_STORAGE_KEYS } from '@/lib/constants';

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
 * Initialize all stores by fetching data from Supabase.
 * Order matters: roles + stores first, then users (depends on roles/stores for validation),
 * then everything else in parallel.
 * After init: start Realtime subscriptions and auto-sync.
 */
async function initializeStores() {
  // Phase 1: Core entities (no dependencies)
  await Promise.all([
    useRolesStore.getState().fetchRoles(),
    useStoresStore.getState().fetchStores(),
  ]);

  // Phase 2: Users (may reference roles/stores)
  await useUsersStore.getState().fetchUsers();

  // Phase 3: Everything else in parallel
  await Promise.all([
    useModulesStore.getState().fetchModules(),
    useAbsenceStore.getState().fetchAbsenceRequests(),
    useTasksStore.getState().fetchTasks(),
    useChatStore.getState().fetchChatData(),
    useEmailStore.getState().fetchEmailData(),
    useAdminStore.getState().fetchAttendanceRecords(),
  ]);

  // Phase 4: Start Realtime subscriptions and auto-sync
  useEmailStore.getState().subscribeRealtime();
  useEmailStore.getState().startAutoSync();
  useChatStore.getState().subscribeRealtime();
}

/**
 * Tear down Realtime subscriptions and auto-sync intervals.
 */
function cleanupSubscriptions() {
  useEmailStore.getState().unsubscribeRealtime();
  useEmailStore.getState().stopAutoSync();
  useChatStore.getState().unsubscribeRealtime();
}

/**
 * Hook that initializes all stores on mount.
 * Returns { ready: boolean } - true when all data is loaded.
 */
export function useInitializeData() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    cleanupLegacyStorage();
    initializeStores().then(() => {
      if (!cancelled) {
        setReady(true);
      }
    });

    return () => {
      cancelled = true;
      cleanupSubscriptions();
    };
  }, []);

  return { ready };
}
