import { create } from 'zustand';
import { User, StoreOpeningHours, DayOpeningHours, EmployeeWorkingHours } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';
import { useStoresStore } from '@/core/stores/stores-store';

type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const DEFAULT_HOURS: DayOpeningHours = { open: '08:00', close: '16:30', closed: false };

function createDefaultSchedule(): StoreOpeningHours {
  return {
    sameAllWeek: true,
    default: { ...DEFAULT_HOURS },
  };
}

function createDefaultWorkingHours(): EmployeeWorkingHours {
  return {
    alternating: false,
    oddWeek: createDefaultSchedule(),
  };
}

interface EmployeeFormState {
  // Form data
  username: string;
  fullName: string;
  selectedRoles: string[];
  selectedStores: string[];
  defaultRoleId: string | undefined;
  defaultStoreId: string | undefined;
  workingHours: EmployeeWorkingHours | undefined;
  error: string | null;

  // Edit mode
  editingUser: User | null;
}

interface EmployeeFormActions {
  // Initialize form
  initForm: (user: User | null) => void;
  resetForm: () => void;

  // Field setters
  setUsername: (value: string) => void;
  setFullName: (value: string) => void;
  setError: (error: string | null) => void;

  // Role actions
  toggleRole: (roleId: string) => void;
  setDefaultRole: (roleId: string) => void;

  // Store actions
  toggleStore: (storeId: string) => void;
  setDefaultStore: (storeId: string) => void;

  // Working hours actions
  toggleWorkingHours: () => void;
  toggleAlternating: () => void;
  toggleWeekSameAllWeek: (week: 'odd' | 'even') => void;
  setWeekDayHours: (
    week: 'odd' | 'even',
    dayKey: DayKey | 'default',
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => void;
  copyFromStore: (week: 'odd' | 'even', storeId: string) => void;

  // Submit
  submitForm: (onSuccess: () => void) => Promise<void>;

  // Computed
  isEditing: () => boolean;
}

const initialState: EmployeeFormState = {
  username: '',
  fullName: '',
  selectedRoles: [],
  selectedStores: [],
  defaultRoleId: undefined,
  defaultStoreId: undefined,
  workingHours: undefined,
  error: null,
  editingUser: null,
};

export const useEmployeeFormStore = create<EmployeeFormState & EmployeeFormActions>((set, get) => ({
  ...initialState,

  // Initialize form with user data (for editing) or empty (for new)
  initForm: (user) => {
    if (user) {
      set({
        username: user.username,
        fullName: user.fullName,
        selectedRoles: user.roleIds,
        selectedStores: user.storeIds,
        defaultRoleId: user.defaultRoleId,
        defaultStoreId: user.defaultStoreId,
        workingHours: user.workingHours,
        error: null,
        editingUser: user,
      });
    } else {
      set({ ...initialState });
    }
  },

  resetForm: () => set({ ...initialState }),

  // Field setters
  setUsername: (value) => set({ username: value }),
  setFullName: (value) => set({ fullName: value }),
  setError: (error) => set({ error }),

  // Role actions
  toggleRole: (roleId) => {
    const { selectedRoles, defaultRoleId } = get();
    const isSelected = selectedRoles.includes(roleId);

    if (isSelected) {
      const newRoles = selectedRoles.filter((id) => id !== roleId);
      set({
        selectedRoles: newRoles,
        defaultRoleId: newRoles.includes(defaultRoleId ?? '') ? defaultRoleId : newRoles[0],
      });
    } else {
      set({ selectedRoles: [...selectedRoles, roleId] });
    }
  },

  setDefaultRole: (roleId) => set({ defaultRoleId: roleId }),

  // Store actions
  toggleStore: (storeId) => {
    const { selectedStores, defaultStoreId } = get();
    const isSelected = selectedStores.includes(storeId);

    if (isSelected) {
      const newStores = selectedStores.filter((id) => id !== storeId);
      set({
        selectedStores: newStores,
        defaultStoreId: newStores.includes(defaultStoreId ?? '') ? defaultStoreId : newStores[0],
      });
    } else {
      set({ selectedStores: [...selectedStores, storeId] });
    }
  },

  setDefaultStore: (storeId) => set({ defaultStoreId: storeId }),

  // Working hours actions
  toggleWorkingHours: () => {
    const { workingHours } = get();
    if (workingHours) {
      set({ workingHours: undefined });
    } else {
      set({ workingHours: createDefaultWorkingHours() });
    }
  },

  toggleAlternating: () => {
    const { workingHours } = get();
    if (!workingHours) return;

    if (workingHours.alternating) {
      // Turn off alternating — keep oddWeek only
      set({
        workingHours: {
          alternating: false,
          oddWeek: workingHours.oddWeek,
        },
      });
    } else {
      // Turn on alternating — create per-day evenWeek
      const defaultPerDay: StoreOpeningHours = {
        sameAllWeek: false,
        monday: { ...DEFAULT_HOURS },
        tuesday: { ...DEFAULT_HOURS },
        wednesday: { ...DEFAULT_HOURS },
        thursday: { ...DEFAULT_HOURS },
        friday: { ...DEFAULT_HOURS },
        saturday: { ...DEFAULT_HOURS, closed: true },
        sunday: { ...DEFAULT_HOURS, closed: true },
      };

      // Force oddWeek to per-day mode too
      let oddWeek = workingHours.oddWeek;
      if (oddWeek.sameAllWeek) {
        const hrs = oddWeek.default || DEFAULT_HOURS;
        oddWeek = {
          sameAllWeek: false,
          monday: { ...hrs },
          tuesday: { ...hrs },
          wednesday: { ...hrs },
          thursday: { ...hrs },
          friday: { ...hrs },
          saturday: { ...hrs, closed: true },
          sunday: { ...hrs, closed: true },
        };
      }

      set({
        workingHours: {
          alternating: true,
          oddWeek,
          evenWeek: defaultPerDay,
        },
      });
    }
  },

  toggleWeekSameAllWeek: (week) => {
    const { workingHours } = get();
    if (!workingHours) return;

    const schedule = week === 'odd' ? workingHours.oddWeek : workingHours.evenWeek;
    if (!schedule) return;

    let newSchedule: StoreOpeningHours;
    if (schedule.sameAllWeek) {
      const defaultHrs = schedule.default || DEFAULT_HOURS;
      newSchedule = {
        sameAllWeek: false,
        monday: { ...defaultHrs },
        tuesday: { ...defaultHrs },
        wednesday: { ...defaultHrs },
        thursday: { ...defaultHrs },
        friday: { ...defaultHrs },
        saturday: { ...defaultHrs, closed: true },
        sunday: { ...defaultHrs, closed: true },
      };
    } else {
      newSchedule = {
        sameAllWeek: true,
        default: schedule.monday || DEFAULT_HOURS,
      };
    }

    if (week === 'odd') {
      set({ workingHours: { ...workingHours, oddWeek: newSchedule } });
    } else {
      set({ workingHours: { ...workingHours, evenWeek: newSchedule } });
    }
  },

  setWeekDayHours: (week, dayKey, field, value) => {
    const { workingHours } = get();
    if (!workingHours) return;

    const schedule = week === 'odd' ? workingHours.oddWeek : workingHours.evenWeek;
    if (!schedule) return;

    const current = schedule[dayKey] || { ...DEFAULT_HOURS };
    const newSchedule = {
      ...schedule,
      [dayKey]: {
        ...current,
        [field]: value,
      },
    };

    if (week === 'odd') {
      set({ workingHours: { ...workingHours, oddWeek: newSchedule } });
    } else {
      set({ workingHours: { ...workingHours, evenWeek: newSchedule } });
    }
  },

  copyFromStore: (week, storeId) => {
    const { workingHours } = get();
    if (!workingHours) return;

    const store = useStoresStore.getState().getStoreById(storeId);
    if (!store?.openingHours) return;

    const schedule: StoreOpeningHours = JSON.parse(JSON.stringify(store.openingHours));

    // Expand sameAllWeek to per-day format so alternating mode shows all days
    if (schedule.sameAllWeek) {
      const def = schedule.default || { open: '08:00', close: '16:30', closed: false };
      schedule.sameAllWeek = false;
      schedule.monday = { ...def };
      schedule.tuesday = { ...def };
      schedule.wednesday = { ...def };
      schedule.thursday = { ...def };
      schedule.friday = { ...def };
      schedule.saturday = { ...def };
      schedule.sunday = { ...def };
      delete schedule.default;
    }

    if (week === 'odd') {
      set({ workingHours: { ...workingHours, oddWeek: schedule } });
    } else {
      set({ workingHours: { ...workingHours, evenWeek: schedule } });
    }
  },

  // Submit form
  submitForm: async (onSuccess) => {
    const state = get();
    set({ error: null });

    const userData = {
      username: state.username.trim(),
      fullName: state.fullName.trim(),
      roleIds: state.selectedRoles,
      storeIds: state.selectedStores,
      defaultRoleId: state.selectedRoles.length > 1 ? state.defaultRoleId : undefined,
      defaultStoreId: state.selectedStores.length > 1 ? state.defaultStoreId : undefined,
      active: state.editingUser?.active ?? true,
      workingHours: state.workingHours,
    };

    const { addUser, updateUser } = useUsersStore.getState();

    if (state.editingUser) {
      const result = await updateUser(state.editingUser.id, userData);
      if (!result.success) {
        set({ error: result.error || 'Nepodařilo se aktualizovat zaměstnance' });
        return;
      }
    } else {
      const result = await addUser(userData);
      if (!result.success) {
        set({ error: result.error || 'Nepodařilo se přidat zaměstnance' });
        return;
      }
    }

    onSuccess();
  },

  // Computed
  isEditing: () => !!get().editingUser,
}));
