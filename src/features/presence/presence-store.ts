import { create } from 'zustand';
import { PresenceRecord, PresenceStatus } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';
import { useStoresStore } from '@/core/stores/stores-store';
import { useModulesStore } from '@/core/stores/modules-store';
import { useAttendanceStore } from '@/features/attendance/attendance-store';
import { useAbsenceStore } from '@/features/absence/absence-store';
import { useShiftsStore } from '@/features/shifts/shifts-store';

interface PresenceActions {
  getTodayPresence: (viewerRoleId: string) => PresenceRecord[];
  getPresenceStatus: (userId: string) => PresenceStatus;
}

export const usePresenceStore = create<PresenceActions>()(() => ({
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

// Helper function to check if user has a shift today
function checkUserHasShiftToday(userId: string, date: Date): boolean {
  const user = useUsersStore.getState().getUserById(userId);
  if (!user) return false;

  // If user has a store assigned, check shifts
  if (user.storeIds.length > 0) {
    const storeId = user.storeIds[0];
    const isWorkDay = useShiftsStore.getState().isWorkDayForUser(userId, storeId, date);
    return isWorkDay;
  }

  // If user has working hours defined, check if today is a work day
  if (user.workingHours) {
    const isWorkDay = useShiftsStore.getState().isWorkDayForUser(userId, null, date);
    return isWorkDay;
  }

  // Fallback: if user has stores assigned, assume they might work today
  return user.storeIds.length > 0;
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
