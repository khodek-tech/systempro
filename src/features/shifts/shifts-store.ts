import { create } from 'zustand';
import { DayOpeningHours, EmployeeWorkingHours, Store, StoreOpeningHours, User } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';

export interface ShiftDay {
  date: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  isWorkDay: boolean;
  isOddWeek: boolean;
  openingHours?: DayOpeningHours;
}

interface ShiftsState {
  shiftsViewMode: 'card' | 'view';
  selectedStoreId: string | null;
  selectedMonth: number;
  selectedYear: number;
}

interface ShiftsActions {
  openShiftsView: () => void;
  closeShiftsView: () => void;
  setSelectedStore: (storeId: string | null) => void;
  setSelectedMonth: (month: number) => void;
  setSelectedYear: (year: number) => void;
  navigateMonth: (direction: 'prev' | 'next') => void;

  // Calculation functions
  getWeekNumber: (date: Date) => number;
  isOddWeek: (date: Date) => boolean;
  getShiftsForMonth: (
    userId: string,
    month: number,
    year: number
  ) => ShiftDay[];
  getOpeningHoursForDay: (store: Store, dayOfWeek: number) => DayOpeningHours | undefined;
  getUsersForStore: (storeId: string) => User[];
  isWorkDayForUser: (userId: string, date: Date) => boolean;
  getEffectiveWorkingHours: (userId: string, dayOfWeek: number, date: Date) => DayOpeningHours | undefined;
}

/**
 * Helper: get DayOpeningHours from a StoreOpeningHours schedule for a given day of week.
 */
function getDayFromSchedule(schedule: StoreOpeningHours, dayOfWeek: number): DayOpeningHours | undefined {
  if (schedule.sameAllWeek) {
    return schedule.default;
  }

  const dayMap: Record<number, keyof StoreOpeningHours> = {
    0: 'sunday',
    1: 'monday',
    2: 'tuesday',
    3: 'wednesday',
    4: 'thursday',
    5: 'friday',
    6: 'saturday',
  };

  const dayKey = dayMap[dayOfWeek];
  return schedule[dayKey] as DayOpeningHours | undefined;
}

/**
 * Helper: get the active week schedule from EmployeeWorkingHours based on odd/even week.
 */
function getActiveWeekSchedule(wh: EmployeeWorkingHours, oddWeek: boolean): StoreOpeningHours {
  if (!wh.alternating) {
    return wh.oddWeek;
  }
  return oddWeek ? wh.oddWeek : (wh.evenWeek ?? wh.oddWeek);
}

export const useShiftsStore = create<ShiftsState & ShiftsActions>()((set, get) => {
  const currentDate = new Date();

  return {
    // Initial state
    shiftsViewMode: 'card',
    selectedStoreId: null,
    selectedMonth: currentDate.getMonth(),
    selectedYear: currentDate.getFullYear(),

    // View mode actions
    openShiftsView: () => set({ shiftsViewMode: 'view' }),
    closeShiftsView: () => set({ shiftsViewMode: 'card' }),

    // Selection actions
    setSelectedStore: (storeId) => set({ selectedStoreId: storeId }),
    setSelectedMonth: (month) => set({ selectedMonth: month }),
    setSelectedYear: (year) => set({ selectedYear: year }),

    navigateMonth: (direction) => {
      const { selectedMonth, selectedYear } = get();
      if (direction === 'prev') {
        if (selectedMonth === 0) {
          set({ selectedMonth: 11, selectedYear: selectedYear - 1 });
        } else {
          set({ selectedMonth: selectedMonth - 1 });
        }
      } else {
        if (selectedMonth === 11) {
          set({ selectedMonth: 0, selectedYear: selectedYear + 1 });
        } else {
          set({ selectedMonth: selectedMonth + 1 });
        }
      }
    },

    // Get ISO week number
    getWeekNumber: (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    },

    // Determine if the ISO week number is odd
    isOddWeek: (date: Date) => {
      const { getWeekNumber } = get();
      return getWeekNumber(date) % 2 === 1;
    },

    // Get opening hours for a specific day of week from a store
    getOpeningHoursForDay: (store: Store, dayOfWeek: number): DayOpeningHours | undefined => {
      if (!store.openingHours) return undefined;
      return getDayFromSchedule(store.openingHours, dayOfWeek);
    },

    // Get effective working hours for a user on a specific day
    getEffectiveWorkingHours: (userId: string, dayOfWeek: number, date: Date): DayOpeningHours | undefined => {
      const user = useUsersStore.getState().getUserById(userId);
      if (!user?.workingHours) return undefined;

      const { isOddWeek: isOdd } = get();
      const schedule = getActiveWeekSchedule(user.workingHours, isOdd(date));
      return getDayFromSchedule(schedule, dayOfWeek);
    },

    // Get users assigned to a specific store
    getUsersForStore: (storeId: string): User[] => {
      const users = useUsersStore.getState().getActiveUsers();
      return users.filter((user) => user.storeIds.includes(storeId));
    },

    // Determine if a user works on a specific day
    isWorkDayForUser: (userId: string, date: Date): boolean => {
      const user = useUsersStore.getState().getUserById(userId);
      if (!user?.workingHours) return false;

      const { isOddWeek: isOdd } = get();
      const schedule = getActiveWeekSchedule(user.workingHours, isOdd(date));
      const dayHours = getDayFromSchedule(schedule, date.getDay());

      if (!dayHours || dayHours.closed) return false;
      return true;
    },

    // Get all shifts for a user in a specific month
    getShiftsForMonth: (userId: string, month: number, year: number): ShiftDay[] => {
      const { isOddWeek: isOdd, isWorkDayForUser, getEffectiveWorkingHours } = get();
      const user = useUsersStore.getState().getUserById(userId);
      if (!user?.workingHours) return [];

      const shifts: ShiftDay[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const isWorkDay = isWorkDayForUser(userId, date);
        const oddWeek = isOdd(date);
        const openingHours = getEffectiveWorkingHours(userId, dayOfWeek, date);

        shifts.push({
          date,
          dayOfWeek,
          isWorkDay,
          isOddWeek: oddWeek,
          openingHours: openingHours?.closed ? undefined : openingHours,
        });
      }

      return shifts;
    },
  };
});
