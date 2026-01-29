import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Role, Store, RoleType } from '@/types';
import { useUsersStore } from './users-store';
import { useRolesStore } from './roles-store';
import { useStoresStore } from './stores-store';

// Helpers to get data from other stores
const getUsers = () => useUsersStore.getState().users;
const getRoles = () => useRolesStore.getState().roles;
const getStores = () => useStoresStore.getState().stores;

interface AuthState {
  currentUser: User | null;
  activeRoleId: string | null;
  activeStoreId: string | null;
  _hydrated: boolean;
}

interface AuthActions {
  // Actions
  setCurrentUser: (user: User | null) => void;
  setActiveRole: (roleId: string) => void;
  setActiveStore: (storeId: string) => void;
  switchToUser: (userId: string) => void;

  // Computed
  getActiveRole: () => Role | null;
  getAvailableRoles: () => Role[];
  getAvailableStores: () => Store[];
  getAllActiveUsers: () => User[];
  needsStoreSelection: () => boolean;
  getActiveRoleType: () => RoleType | null;
  canReportAbsence: () => boolean;
}

// Roles that cannot report absence
const ROLES_WITHOUT_ABSENCE: RoleType[] = ['administrator', 'majitel'];

export const useAuthStore = create<AuthState & AuthActions>()(
  persist(
    (set, get) => ({
  // Initial state - default to user-1 (admin) for development
  currentUser: getUsers()[0] ?? null,
  activeRoleId: getUsers()[0]?.roleIds[0] ?? null,
  activeStoreId: null,
  _hydrated: false,

  // Actions
  setCurrentUser: (user) => {
    if (user) {
      // Use default values if set, otherwise fallback to first item
      const defaultRoleId = user.defaultRoleId ?? user.roleIds[0] ?? null;
      const defaultStoreId = user.defaultStoreId ?? user.storeIds[0] ?? null;

      set({
        currentUser: user,
        activeRoleId: defaultRoleId,
        activeStoreId: defaultStoreId,
      });
    } else {
      set({
        currentUser: null,
        activeRoleId: null,
        activeStoreId: null,
      });
    }
  },

  setActiveRole: (roleId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Check if the user has this role OR is administrator (can access all)
    const isAdmin = currentUser.roleIds.includes('role-2');
    const hasRole = currentUser.roleIds.includes(roleId);

    if (isAdmin || hasRole) {
      set({ activeRoleId: roleId });

      // If switching to a role that needs a store, set first available store
      const role = getRoles().find((r) => r.id === roleId);
      if (role?.type === 'prodavac' && currentUser.storeIds.length > 0) {
        const { activeStoreId } = get();
        if (!activeStoreId || !currentUser.storeIds.includes(activeStoreId)) {
          set({ activeStoreId: currentUser.storeIds[0] });
        }
      }
    }
  },

  setActiveStore: (storeId) => {
    const { currentUser } = get();
    if (!currentUser) return;

    // Check if user has access to this store
    if (currentUser.storeIds.includes(storeId)) {
      set({ activeStoreId: storeId });
    }
  },

  switchToUser: (userId) => {
    const user = getUsers().find((u) => u.id === userId);
    if (!user || !user.active) return;

    const defaultRoleId = user.defaultRoleId || user.roleIds[0];
    const role = getRoles().find((r) => r.id === defaultRoleId);

    let storeId: string | null = null;
    if (role?.type === 'prodavac' && user.storeIds.length > 0) {
      storeId = user.defaultStoreId || user.storeIds[0];
    }

    set({
      currentUser: user,
      activeRoleId: defaultRoleId,
      activeStoreId: storeId,
    });
  },

  // Computed
  getActiveRole: () => {
    const { activeRoleId } = get();
    if (!activeRoleId) return null;
    return getRoles().find((r) => r.id === activeRoleId) || null;
  },

  getAvailableRoles: () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    // Administrator (role-2) can access ALL roles
    const isAdmin = currentUser.roleIds.includes('role-2');
    if (isAdmin) {
      return getRoles().filter((r) => r.active);
    }

    // Other users only get their assigned roles
    return getRoles().filter((r) => r.active && currentUser.roleIds.includes(r.id));
  },

  getAvailableStores: () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    return getStores().filter((s) => s.active && currentUser.storeIds.includes(s.id));
  },

  getAllActiveUsers: () => {
    return getUsers().filter((u) => u.active).sort((a, b) =>
      a.fullName.localeCompare(b.fullName, 'cs')
    );
  },

  needsStoreSelection: () => {
    const { currentUser, activeRoleId } = get();
    if (!currentUser || !activeRoleId) return false;

    const role = getRoles().find((r) => r.id === activeRoleId);
    if (!role) return false;

    // Only prodavac needs store selection
    if (role.type !== 'prodavac') return false;

    // Check if user has multiple stores
    return currentUser.storeIds.length > 1;
  },

  getActiveRoleType: () => {
    const role = get().getActiveRole();
    return role?.type || null;
  },

  canReportAbsence: () => {
    const roleType = get().getActiveRoleType();
    if (!roleType) return false;
    return !ROLES_WITHOUT_ABSENCE.includes(roleType);
  },
    }),
    {
      name: 'systempro-auth',
      partialize: (state) => ({
        currentUser: state.currentUser,
        activeRoleId: state.activeRoleId,
        activeStoreId: state.activeStoreId,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true;
        }
      },
    }
  )
);
