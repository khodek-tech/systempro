import { create } from 'zustand';
import { WorkplaceType } from '@/shared/types';

interface AttendanceState {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  requiresKasa: boolean;
  // Track all checked-in users globally (user IDs)
  checkedInUsers: Set<string>;
}

interface AttendanceActions {
  // Actions
  toggleAttendance: () => { success: boolean; error?: string };
  confirmKasa: (confirmed: boolean) => void;
  setWorkplace: (type: WorkplaceType, id: string, name: string, requiresKasa: boolean) => void;
  // Global check-in tracking
  checkInUser: (userId: string) => void;
  checkOutUser: (userId: string) => void;
  isUserCheckedIn: (userId: string) => boolean;
  getAllCheckedInUsers: () => string[];
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>((set, get) => ({
  // Initial state - empty values, will be set after auth-store hydration
  isInWork: false,
  kasaConfirmed: false,
  workplaceType: 'role',
  workplaceId: '',
  workplaceName: '',
  requiresKasa: false,
  checkedInUsers: new Set<string>(),

  // Actions
  toggleAttendance: () => {
    const { isInWork, kasaConfirmed, requiresKasa } = get();

    // When checking out, require kasa confirmation only if workplace requires it
    if (isInWork && requiresKasa && !kasaConfirmed) {
      return { success: false, error: 'Před odchodem potvrďte stav kasy!' };
    }

    set((state) => ({
      isInWork: !state.isInWork,
      kasaConfirmed: false,
    }));

    return { success: true };
  },

  confirmKasa: (confirmed) => set({ kasaConfirmed: confirmed }),

  setWorkplace: (type, id, name, requiresKasa) => {
    set({
      workplaceType: type,
      workplaceId: id,
      workplaceName: name,
      requiresKasa,
    });
  },

  // Global check-in tracking actions
  checkInUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.checkedInUsers);
      newSet.add(userId);
      return { checkedInUsers: newSet };
    });
  },

  checkOutUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.checkedInUsers);
      newSet.delete(userId);
      return { checkedInUsers: newSet };
    });
  },

  isUserCheckedIn: (userId) => {
    return get().checkedInUsers.has(userId);
  },

  getAllCheckedInUsers: () => {
    return Array.from(get().checkedInUsers);
  },
}));
