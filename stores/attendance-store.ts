import { create } from 'zustand';
import { WorkplaceType } from '@/types';

interface AttendanceState {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplace: WorkplaceType;
}

interface AttendanceActions {
  // Computed
  isWarehouse: () => boolean;

  // Actions
  toggleAttendance: () => { success: boolean; error?: string };
  confirmKasa: (confirmed: boolean) => void;
  changeWorkplace: (workplace: WorkplaceType) => void;
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>((set, get) => ({
  // Initial state
  isInWork: false,
  kasaConfirmed: false,
  workplace: 'praha 1',

  // Computed
  isWarehouse: () => get().workplace === 'sklad',

  // Actions
  toggleAttendance: () => {
    const { isInWork, kasaConfirmed } = get();

    if (isInWork && !kasaConfirmed) {
      return { success: false, error: 'Před odchodem potvrďte stav kasy!' };
    }

    set((state) => ({
      isInWork: !state.isInWork,
      kasaConfirmed: false,
    }));

    return { success: true };
  },

  confirmKasa: (confirmed) => set({ kasaConfirmed: confirmed }),

  changeWorkplace: (newWorkplace) => {
    const { isInWork } = get();
    if (!isInWork) {
      set({ workplace: newWorkplace });
    }
  },
}));
