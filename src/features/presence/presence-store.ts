import { create } from 'zustand';
import { PresenceRecord, PresenceStatus } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';
import { useStoresStore } from '@/core/stores/stores-store';
import { useModulesStore } from '@/core/stores/modules-store';
import { useAttendanceStore } from '@/features/attendance/attendance-store';
import { useAbsenceStore } from '@/features/absence/absence-store';
import { useShiftsStore } from '@/features/shifts/shifts-store';

interface PresenceState {
  presenceViewMode: 'card' | 'view';
}

interface PresenceActions {
  getTodayPresence: (viewerRoleId: string) => PresenceRecord[];
  getPresenceStatus: (userId: string) => PresenceStatus;
  openPresenceView: () => void;
  closePresenceView: () => void;
}

export const usePresenceStore = create<PresenceState & PresenceActions>()((set) => ({
  presenceViewMode: 'card',
  openPresenceView: () => set({ presenceViewMode: 'view' }),
  closePresenceView: () => set({ presenceViewMode: 'card' }),
  getTodayPresence: (viewerRoleId: string): PresenceRecord[] => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    // Get view mappings for presence module
    const moduleConfig = useModulesStore.getState().getModuleConfig('presence');
    const viewMapping = moduleConfig?.viewMappings?.find(
      (m) => m.viewerRoleId === viewerRoleId
    );

    // If no view mapping for this role, return empty
    if (!viewMapping) {
      return [];
    }

    const visibleRoleIds = viewMapping.visibleRoleIds;

    // Get all active users
    const activeUsers = useUsersStore.getState().getActiveUsers();

    // Filter users by visible roles
    const visibleUsers = activeUsers.filter((user) =>
      user.roleIds.some((roleId) => visibleRoleIds.includes(roleId))
    );

    const records: PresenceRecord[] = [];

    for (const user of visibleUsers) {
      // Check if user has a shift today
      const hasShiftToday = checkUserHasShiftToday(user.id, today);

      // Only include users who have a shift today
      if (!hasShiftToday) {
        continue;
      }

      // Get presence status
      const status = getPresenceStatusForUser(user.id, todayStr);

      // Get store name (first store if assigned)
      let storeName: string | undefined;
      if (user.storeIds.length > 0) {
        const store = useStoresStore.getState().getStoreById(user.storeIds[0]);
        storeName = store?.name;
      }

      // Get absence type if excused
      let absenceType: PresenceRecord['absenceType'];
      if (status === 'excused') {
        const absenceRequests = useAbsenceStore.getState().absenceRequests;
        const todayAbsence = absenceRequests.find(
          (req) =>
            req.userId === user.id &&
            req.status === 'approved' &&
            req.dateFrom <= todayStr &&
            req.dateTo >= todayStr
        );
        absenceType = todayAbsence?.type;
      }

      records.push({
        userId: user.id,
        userName: user.fullName,
        status,
        absenceType,
        storeName,
      });
    }

    // Sort: present first, then absent, then excused
    const statusOrder: Record<PresenceStatus, number> = {
      present: 0,
      absent: 1,
      excused: 2,
    };

    return records.sort((a, b) => statusOrder[a.status] - statusOrder[b.status]);
  },

  getPresenceStatus: (userId: string): PresenceStatus => {
    const todayStr = new Date().toISOString().split('T')[0];
    return getPresenceStatusForUser(userId, todayStr);
  },
}));

// Helper function to check if user should be working RIGHT NOW
function checkUserHasShiftToday(userId: string, date: Date): boolean {
  const user = useUsersStore.getState().getUserById(userId);
  if (!user) return false;

  const storeId = user.storeIds.length > 0 ? user.storeIds[0] : null;

  // Check if it's a work day at all
  const hasStoreOrWorkingHours = storeId || user.workingHours;
  if (!hasStoreOrWorkingHours) return false;

  const isWorkDay = useShiftsStore.getState().isWorkDayForUser(userId, storeId, date);
  if (!isWorkDay) return false;

  // Check if current time is within working hours
  const openingHours = useShiftsStore.getState().getEffectiveWorkingHours(
    userId,
    storeId,
    date.getDay()
  );

  if (!openingHours || openingHours.closed) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  // Compare times as strings (works for HH:mm format)
  return currentTime >= openingHours.open && currentTime <= openingHours.close;
}

// Helper function to determine presence status for a user
function getPresenceStatusForUser(userId: string, dateStr: string): PresenceStatus {
  // Check if user is checked in
  const isCheckedIn = useAttendanceStore.getState().isUserCheckedIn(userId);
  if (isCheckedIn) {
    return 'present';
  }

  // Check if user has an approved absence for today
  const absenceRequests = useAbsenceStore.getState().absenceRequests;
  const hasApprovedAbsence = absenceRequests.some(
    (req) =>
      req.userId === userId &&
      req.status === 'approved' &&
      req.dateFrom <= dateStr &&
      req.dateTo >= dateStr
  );

  if (hasApprovedAbsence) {
    return 'excused';
  }

  // Otherwise, they should be at work but aren't
  return 'absent';
}
