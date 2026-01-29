import { create } from 'zustand';
import { DayOpeningHours, Store, User } from '@/types';
import { useStoresStore } from './stores-store';
import { useUsersStore } from './users-store';

export interface ShiftDay {
  date: Date;
  dayOfWeek: number; // 0 = Sunday, 1 = Monday, ...
  isWorkDay: boolean;
  isShortWeek: boolean;
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
  isShortWeekForUser: (userId: string, date: Date) => boolean;
  getShiftsForMonth: (
    userId: string,
    month: number,
    year: number
  ) => ShiftDay[];
  getOpeningHoursForDay: (store: Store, dayOfWeek: number) => DayOpeningHours | undefined;
  getUsersForStore: (storeId: string) => User[];
  isWorkDayForUser: (userId: string, storeId: string | null, date: Date) => boolean;
  getEffectiveWorkingHours: (userId: string, storeId: string | null, dayOfWeek: number) => DayOpeningHours | undefined;
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

    // Get ISO week number (1.1.2024 is in week 1)
    getWeekNumber: (date: Date) => {
      const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
      const dayNum = d.getUTCDay() || 7;
      d.setUTCDate(d.getUTCDate() + 4 - dayNum);
      const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
      return Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
    },

    // Determine if it's a short week for the user
    isShortWeekForUser: (userId: string, date: Date) => {
      const { getWeekNumber } = get();
      const user = useUsersStore.getState().getUserById(userId);
      if (!user) return false;

      const weekNum = getWeekNumber(date);
      const isOddWeek = weekNum % 2 === 1;

      // If startsWithShortWeek is true:
      //   - Odd weeks = short week
      //   - Even weeks = long week
      // If startsWithShortWeek is false:
      //   - Odd weeks = long week
      //   - Even weeks = short week
      if (user.startsWithShortWeek) {
        return isOddWeek;
      }
      return !isOddWeek;
    },

    // Get opening hours for a specific day of week
    getOpeningHoursForDay: (store: Store, dayOfWeek: number): DayOpeningHours | undefined => {
      if (!store.openingHours) return undefined;

      if (store.openingHours.sameAllWeek) {
        return store.openingHours.default;
      }

      const dayMap: Record<number, keyof typeof store.openingHours> = {
        0: 'sunday',
        1: 'monday',
        2: 'tuesday',
        3: 'wednesday',
        4: 'thursday',
        5: 'friday',
        6: 'saturday',
      };

      const dayKey = dayMap[dayOfWeek];
      return store.openingHours[dayKey] as DayOpeningHours | undefined;
    },

    // Get effective working hours for a user (priority: store > user)
    getEffectiveWorkingHours: (userId: string, storeId: string | null, dayOfWeek: number): DayOpeningHours | undefined => {
      const { getOpeningHoursForDay } = get();
      const user = useUsersStore.getState().getUserById(userId);
      if (!user) return undefined;

      // Priority 1: If store is assigned and has opening hours, use store hours
      if (storeId) {
        const store = useStoresStore.getState().getStoreById(storeId);
        if (store?.openingHours) {
          return getOpeningHoursForDay(store, dayOfWeek);
        }
      }

      // Priority 2: Use user's own working hours
      if (user.workingHours) {
        if (user.workingHours.sameAllWeek) {
          return user.workingHours.default;
        }

        const dayMap: Record<number, keyof typeof user.workingHours> = {
          0: 'sunday',
          1: 'monday',
          2: 'tuesday',
          3: 'wednesday',
          4: 'thursday',
          5: 'friday',
          6: 'saturday',
        };

        const dayKey = dayMap[dayOfWeek];
        return user.workingHours[dayKey] as DayOpeningHours | undefined;
      }

      return undefined;
    },

    // Get users assigned to a specific store
    getUsersForStore: (storeId: string): User[] => {
      const users = useUsersStore.getState().getActiveUsers();
      return users.filter((user) => user.storeIds.includes(storeId));
    },

    // Determine if a user works on a specific day
    isWorkDayForUser: (userId: string, storeId: string | null, date: Date): boolean => {
      const { isShortWeekForUser, getEffectiveWorkingHours, getUsersForStore } = get();
      const dayOfWeek = date.getDay();

      // If user has a store assigned
      if (storeId) {
        const store = useStoresStore.getState().getStoreById(storeId);
        if (!store) return false;

        const openingHours = getEffectiveWorkingHours(userId, storeId, dayOfWeek);

        // If closed that day, no one works
        if (!openingHours || openingHours.closed) return false;

        const storeUsers = getUsersForStore(storeId);

        // If only 1 employee on the store, they work all open days
        if (storeUsers.length === 1) {
          return storeUsers[0].id === userId;
        }

        // If 2 employees, alternate short/long weeks
        if (storeUsers.length >= 2) {
          const isShortWeek = isShortWeekForUser(userId, date);

          // Short week: Wednesday (3), Thursday (4) = 2 days
          // Long week: Monday (1), Tuesday (2), Friday (5), Saturday (6), Sunday (0) = 5 days
          const shortWeekDays = [3, 4]; // St, Čt
          const longWeekDays = [1, 2, 5, 6, 0]; // Po, Út, Pá, So, Ne

          if (isShortWeek) {
            return shortWeekDays.includes(dayOfWeek);
          }
          return longWeekDays.includes(dayOfWeek);
        }

        return false;
      }

      // User without store - use their own working hours
      const workingHours = getEffectiveWorkingHours(userId, null, dayOfWeek);
      if (!workingHours || workingHours.closed) return false;

      return true;
    },

    // Get all shifts for a user in a specific month
    getShiftsForMonth: (userId: string, month: number, year: number): ShiftDay[] => {
      const { isShortWeekForUser, getEffectiveWorkingHours, isWorkDayForUser } = get();
      const user = useUsersStore.getState().getUserById(userId);
      if (!user) return [];

      // Determine the store to use (if any)
      const storeId = user.storeIds.length > 0 ? user.storeIds[0] : null;

      // User must have either a store or working hours
      if (!storeId && !user.workingHours) return [];

      const shifts: ShiftDay[] = [];
      const daysInMonth = new Date(year, month + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day++) {
        const date = new Date(year, month, day);
        const dayOfWeek = date.getDay();
        const openingHours = getEffectiveWorkingHours(userId, storeId, dayOfWeek);
        const isWorkDay = isWorkDayForUser(userId, storeId, date);
        const isShortWeek = isShortWeekForUser(userId, date);

        shifts.push({
          date,
          dayOfWeek,
          isWorkDay,
          isShortWeek,
          openingHours: openingHours?.closed ? undefined : openingHours,
        });
      }

      return shifts;
    },
  };
});
