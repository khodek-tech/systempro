import { create } from 'zustand';
import { User, Role, Store, RoleType } from '@/types';
import { MOCK_USERS, MOCK_ROLES, MOCK_STORES } from '@/lib/mock-data';

interface AuthState {
  currentUser: User | null;
  activeRoleId: string | null;
  activeStoreId: string | null;
}

interface AuthActions {
  // Actions
  setCurrentUser: (user: User | null) => void;
  setActiveRole: (roleId: string) => void;
  setActiveStore: (storeId: string) => void;

  // Computed
  getActiveRole: () => Role | null;
  getAvailableRoles: () => Role[];
  getAvailableStores: () => Store[];
  needsStoreSelection: () => boolean;
  getActiveRoleType: () => RoleType | null;
  hasAttendance: () => boolean;
  canReportAbsence: () => boolean;
}

// Roles that don't track attendance
const ROLES_WITHOUT_ATTENDANCE: RoleType[] = ['administrator', 'majitel'];

// Roles that cannot report absence
const ROLES_WITHOUT_ABSENCE: RoleType[] = ['administrator', 'majitel'];

export const useAuthStore = create<AuthState & AuthActions>((set, get) => ({
  // Initial state - default to user-1 (admin) for development
  currentUser: MOCK_USERS[0],
  activeRoleId: MOCK_USERS[0].roleIds[0],
  activeStoreId: null,

  // Actions
  setCurrentUser: (user) => {
    if (user) {
      set({
        currentUser: user,
        activeRoleId: user.roleIds[0] || null,
        activeStoreId: user.storeIds[0] || null,
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
      const role = MOCK_ROLES.find((r) => r.id === roleId);
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

  // Computed
  getActiveRole: () => {
    const { activeRoleId } = get();
    if (!activeRoleId) return null;
    return MOCK_ROLES.find((r) => r.id === activeRoleId) || null;
  },

  getAvailableRoles: () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    // Administrator (role-2) can access ALL roles
    const isAdmin = currentUser.roleIds.includes('role-2');
    if (isAdmin) {
      return MOCK_ROLES.filter((r) => r.active);
    }

    // Other users only get their assigned roles
    return MOCK_ROLES.filter((r) => r.active && currentUser.roleIds.includes(r.id));
  },

  getAvailableStores: () => {
    const { currentUser } = get();
    if (!currentUser) return [];

    return MOCK_STORES.filter((s) => s.active && currentUser.storeIds.includes(s.id));
  },

  needsStoreSelection: () => {
    const { currentUser, activeRoleId } = get();
    if (!currentUser || !activeRoleId) return false;

    const role = MOCK_ROLES.find((r) => r.id === activeRoleId);
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

  hasAttendance: () => {
    const roleType = get().getActiveRoleType();
    if (!roleType) return false;
    return !ROLES_WITHOUT_ATTENDANCE.includes(roleType);
  },

  canReportAbsence: () => {
    const roleType = get().getActiveRoleType();
    if (!roleType) return false;
    return !ROLES_WITHOUT_ABSENCE.includes(roleType);
  },
}));
