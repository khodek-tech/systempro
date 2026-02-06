import { create } from 'zustand';
import { User, StoreOpeningHours, DayOpeningHours } from '@/shared/types';
import { useUsersStore } from '@/core/stores/users-store';

type DayKey = 'sunday' | 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday';

const DEFAULT_HOURS: DayOpeningHours = { open: '08:00', close: '16:30', closed: false };

function createDefaultWorkingHours(): StoreOpeningHours {
  return {
    sameAllWeek: true,
    default: { ...DEFAULT_HOURS },
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
  startsWithShortWeek: boolean;
  workingHours: StoreOpeningHours | undefined;
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

  // Shift settings
  setStartsWithShortWeek: (value: boolean) => void;

  // Working hours actions
  toggleWorkingHours: () => void;
  toggleSameAllWeek: () => void;
  setDayHours: (
    dayKey: DayKey | 'default',
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => void;

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
  startsWithShortWeek: false,
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
        startsWithShortWeek: user.startsWithShortWeek ?? false,
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

  // Shift settings
  setStartsWithShortWeek: (value) => set({ startsWithShortWeek: value }),

  // Working hours actions
  toggleWorkingHours: () => {
    const { workingHours } = get();
    if (workingHours) {
      set({ workingHours: undefined });
    } else {
      set({ workingHours: createDefaultWorkingHours() });
    }
  },

  toggleSameAllWeek: () => {
    const { workingHours } = get();
    if (!workingHours) return;

    if (workingHours.sameAllWeek) {
      // Switch to per-day mode
      const defaultHrs = workingHours.default || DEFAULT_HOURS;
      set({
        workingHours: {
          sameAllWeek: false,
          monday: { ...defaultHrs },
          tuesday: { ...defaultHrs },
          wednesday: { ...defaultHrs },
          thursday: { ...defaultHrs },
          friday: { ...defaultHrs },
          saturday: { ...defaultHrs, closed: true },
          sunday: { ...defaultHrs, closed: true },
        },
      });
    } else {
      // Switch to same all week mode
      set({
        workingHours: {
          sameAllWeek: true,
          default: workingHours.monday || DEFAULT_HOURS,
        },
      });
    }
  },

  setDayHours: (dayKey, field, value) => {
    const { workingHours } = get();
    if (!workingHours) return;

    const current = workingHours[dayKey] || { ...DEFAULT_HOURS };
    set({
      workingHours: {
        ...workingHours,
        [dayKey]: {
          ...current,
          [field]: value,
        },
      },
    });
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
      startsWithShortWeek: state.selectedStores.length > 0 ? state.startsWithShortWeek : undefined,
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
