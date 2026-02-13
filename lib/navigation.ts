import { useManualStore } from '@/stores/manual-store';
import { useEmailStore } from '@/stores/email-store';
import { useChatStore } from '@/stores/chat-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useAbsenceStore } from '@/stores/absence-store';
import { useShiftsStore } from '@/stores/shifts-store';
import { usePresenceStore } from '@/stores/presence-store';
import { useAdminStore } from '@/stores/admin-store';

// When adding a new module with a fullscreen view, add its close call here.
export function closeAllViews() {
  useManualStore.getState().closeManualView();
  useEmailStore.getState().closeEmailView();
  useChatStore.getState().closeChatView();
  useTasksStore.getState().closeTasksView();
  useAbsenceStore.getState().closeAbsenceView();
  useAbsenceStore.getState().closeApprovalView();
  useShiftsStore.getState().closeShiftsView();
  usePresenceStore.getState().closePresenceView();
  useAdminStore.getState().goToMain();
}
