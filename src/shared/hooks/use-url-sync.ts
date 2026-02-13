'use client';

import { useEffect, useRef } from 'react';
import { useManualStore } from '@/stores/manual-store';
import { useEmailStore } from '@/stores/email-store';
import { useChatStore } from '@/stores/chat-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useAbsenceStore } from '@/stores/absence-store';
import { useShiftsStore } from '@/stores/shifts-store';
import { usePresenceStore } from '@/stores/presence-store';
import { useAdminStore } from '@/stores/admin-store';
import { closeAllViews } from '@/lib/navigation';

/**
 * Derives the URL path from current store state.
 * Priority matches RoleView.tsx rendering order.
 */
function deriveUrlFromState(): string {
  const { manualViewMode } = useManualStore.getState();
  const { emailViewMode } = useEmailStore.getState();
  const { chatViewMode } = useChatStore.getState();
  const { tasksViewMode } = useTasksStore.getState();
  const { approvalViewMode, absenceViewMode } = useAbsenceStore.getState();
  const { shiftsViewMode } = useShiftsStore.getState();
  const { presenceViewMode } = usePresenceStore.getState();
  const { subView, settingsTab } = useAdminStore.getState();

  if (manualViewMode === 'view') return '/manual';
  if (emailViewMode === 'view') return '/email';
  if (chatViewMode === 'view') return '/chat';
  if (tasksViewMode === 'view') return '/tasks';
  if (approvalViewMode === 'view') return '/approval';
  if (absenceViewMode === 'view') return '/absence';
  if (shiftsViewMode === 'view') return '/shifts';
  if (presenceViewMode === 'view') return '/presence';

  if (subView === 'reports') return '/reports';
  if (subView === 'settings') {
    return settingsTab && settingsTab !== 'stores'
      ? `/settings/${settingsTab}`
      : '/settings';
  }

  return '/';
}

/**
 * Applies a URL slug to the stores, opening the correct view.
 */
function applySlugToStores(slug: string[]) {
  const manual = useManualStore.getState();
  const email = useEmailStore.getState();
  const chat = useChatStore.getState();
  const tasks = useTasksStore.getState();
  const absence = useAbsenceStore.getState();
  const shifts = useShiftsStore.getState();
  const presence = usePresenceStore.getState();
  const admin = useAdminStore.getState();

  // Close all fullscreen views first
  closeAllViews();

  const [first, second] = slug;

  switch (first) {
    case 'absence':
      absence.openAbsenceView();
      break;
    case 'approval':
      absence.openApprovalView();
      break;
    case 'tasks':
      tasks.openTasksView();
      break;
    case 'chat':
      chat.openChatView();
      break;
    case 'email':
      email.openEmailView();
      break;
    case 'shifts':
      shifts.openShiftsView();
      break;
    case 'manual':
      manual.openManualView();
      break;
    case 'presence':
      presence.openPresenceView();
      break;
    case 'reports':
      admin.goToReports();
      break;
    case 'settings':
      admin.goToSettings();
      if (second) {
        admin.setSettingsTab(second as Parameters<typeof admin.setSettingsTab>[0]);
      }
      break;
    // default: already reset to main above
  }
}

/**
 * Bidirectional URL ↔ store synchronization hook.
 *
 * - On initial load: applies the URL slug to stores (once data is ready)
 * - On store changes: updates the URL to match current state
 * - On popstate (back/forward): applies URL to stores
 */
export function useUrlSync(slug: string[], ready: boolean) {
  const initialApplied = useRef(false);
  const lastUrl = useRef(typeof window !== 'undefined' ? window.location.pathname : '/');

  // A) Initial load: apply URL slug → stores (once)
  useEffect(() => {
    if (!ready || initialApplied.current) return;
    initialApplied.current = true;

    // Only apply if slug is non-empty (not just `/`)
    if (slug.length > 0) {
      applySlugToStores(slug);
    }
  }, [ready, slug]);

  // B) Store → URL: subscribe to all relevant stores
  useEffect(() => {
    if (!ready) return;

    const updateUrl = () => {
      const newPath = deriveUrlFromState();
      if (newPath !== lastUrl.current) {
        lastUrl.current = newPath;
        window.history.pushState(null, '', newPath);
      }
    };

    const unsubs = [
      useManualStore.subscribe(updateUrl),
      useEmailStore.subscribe(updateUrl),
      useChatStore.subscribe(updateUrl),
      useTasksStore.subscribe(updateUrl),
      useAbsenceStore.subscribe(updateUrl),
      useShiftsStore.subscribe(updateUrl),
      usePresenceStore.subscribe(updateUrl),
      useAdminStore.subscribe(updateUrl),
    ];

    return () => unsubs.forEach((unsub) => unsub());
  }, [ready]);

  // C) Popstate: browser back/forward → apply URL to stores
  useEffect(() => {
    if (!ready) return;

    const handlePopState = () => {
      const pathSlug = window.location.pathname.split('/').filter(Boolean);
      lastUrl.current = window.location.pathname;
      applySlugToStores(pathSlug);
    };

    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [ready]);
}
