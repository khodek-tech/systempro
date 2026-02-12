import { create } from 'zustand';
import { PresenceRecord, PresenceStatus } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';
import { useStoresStore } from '@/core/stores/stores-store';
import { useRolesStore } from '@/core/stores/roles-store';
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

    const attendanceStore = useAttendanceStore.getState();
    const records: PresenceRecord[] = [];

    for (const user of visibleUsers) {
      const hasShiftNow = checkUserHasShiftNow(user.id, today);
      const isCheckedIn = attendanceStore.checkedInUsers.has(user.fullName);

      // Show user if: has shift NOW or is still checked-in
      if (!hasShiftNow && !isCheckedIn) {
        // Check for approved absence on today — show excused even outside shift
        const hasApprovedAbsence = checkHasApprovedAbsence(user.id, todayStr);
        const hasShiftToday = checkUserHasShiftToday(user.id, today);
        if (hasApprovedAbsence && hasShiftToday) {
          const absenceType = getAbsenceType(user.id, todayStr);
          const { storeName, roleName } = getSubtitle(user);
          records.push({
            userId: user.id,
            userName: user.fullName,
            status: 'excused',
            absenceType,
            storeName,
            roleName,
          });
        }
        continue;
      }

      // Get presence status using fullName for check-in lookup
      const status = getPresenceStatusForUser(user.fullName, todayStr, user.id);

      // Get subtitle info
      const { storeName, roleName } = getSubtitle(user);

      // Get arrival time if present
      let arrivalTime: string | undefined;
      if (status === 'present') {
        arrivalTime = attendanceStore.getArrivalTime(user.fullName) ?? undefined;
      }

      // Get absence type if excused
      let absenceType: PresenceRecord['absenceType'];
      if (status === 'excused') {
        absenceType = getAbsenceType(user.id, todayStr);
      }

      records.push({
        userId: user.id,
        userName: user.fullName,
        status,
        absenceType,
        storeName,
        roleName,
        arrivalTime,
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
    const user = useUsersStore.getState().getUserById(userId);
    const fullName = user?.fullName ?? '';
    return getPresenceStatusForUser(fullName, todayStr, userId);
  },
}));

// Helper: check if user has a shift RIGHT NOW
function checkUserHasShiftNow(userId: string, date: Date): boolean {
  const user = useUsersStore.getState().getUserById(userId);
  if (!user?.workingHours) return false;

  const isWorkDay = useShiftsStore.getState().isWorkDayForUser(userId, date);
  if (!isWorkDay) return false;

  const openingHours = useShiftsStore.getState().getEffectiveWorkingHours(
    userId,
    date.getDay(),
    date
  );

  if (!openingHours || openingHours.closed) return false;

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  return currentTime >= openingHours.open && currentTime <= openingHours.close;
}

// Helper: check if user has any shift today (regardless of current time)
function checkUserHasShiftToday(userId: string, date: Date): boolean {
  const user = useUsersStore.getState().getUserById(userId);
  if (!user?.workingHours) return false;

  const isWorkDay = useShiftsStore.getState().isWorkDayForUser(userId, date);
  if (!isWorkDay) return false;

  const openingHours = useShiftsStore.getState().getEffectiveWorkingHours(
    userId,
    date.getDay(),
    date
  );

  return !!openingHours && !openingHours.closed;
}

// Helper: get subtitle (store name or role name)
function getSubtitle(user: { storeIds: string[]; roleIds: string[] }): {
  storeName?: string;
  roleName?: string;
} {
  if (user.storeIds.length > 0) {
    const store = useStoresStore.getState().getStoreById(user.storeIds[0]);
    return { storeName: store?.name };
  }
  if (user.roleIds.length > 0) {
    const role = useRolesStore.getState().getRoleById(user.roleIds[0]);
    return { roleName: role?.name };
  }
  return {};
}

// Helper: check approved absence
function checkHasApprovedAbsence(userId: string, dateStr: string): boolean {
  const absenceRequests = useAbsenceStore.getState().absenceRequests;
  return absenceRequests.some(
    (req) =>
      req.userId === userId &&
      req.status === 'approved' &&
      req.dateFrom <= dateStr &&
      req.dateTo >= dateStr
  );
}

// Helper: get absence type
function getAbsenceType(userId: string, dateStr: string): PresenceRecord['absenceType'] {
  const absenceRequests = useAbsenceStore.getState().absenceRequests;
  const todayAbsence = absenceRequests.find(
    (req) =>
      req.userId === userId &&
      req.status === 'approved' &&
      req.dateFrom <= dateStr &&
      req.dateTo >= dateStr
  );
  return todayAbsence?.type;
}

// Helper: determine presence status for a user (uses fullName for check-in lookup)
function getPresenceStatusForUser(fullName: string, dateStr: string, userId: string): PresenceStatus {
  // Check if user is checked in — checkedInUsers contains fullName strings
  const isCheckedIn = useAttendanceStore.getState().checkedInUsers.has(fullName);
  if (isCheckedIn) {
    return 'present';
  }

  // Check if user has an approved absence for today
  if (checkHasApprovedAbsence(userId, dateStr)) {
    return 'excused';
  }

  // Otherwise, they should be at work but aren't
  return 'absent';
}
