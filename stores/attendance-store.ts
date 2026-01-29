import { create } from 'zustand';
import { WorkplaceType } from '@/types';

interface AttendanceState {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  requiresKasa: boolean;
}

interface AttendanceActions {
  // Actions
  toggleAttendance: () => { success: boolean; error?: string };
  confirmKasa: (confirmed: boolean) => void;
  setWorkplace: (type: WorkplaceType, id: string, name: string, requiresKasa: boolean) => void;
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>((set, get) => ({
  // Initial state - empty values, will be set after auth-store hydration
  isInWork: false,
  kasaConfirmed: false,
  workplaceType: 'role',
  workplaceId: '',
  workplaceName: '',
  requiresKasa: false,

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
}));
