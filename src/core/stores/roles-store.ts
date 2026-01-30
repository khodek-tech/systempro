import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Role, RoleType } from '@/shared/types';
import { MOCK_ROLES } from '@/lib/mock-data';
import { getUsersWithRole } from './store-helpers';
import { PROTECTED_ROLE_TYPES, STORAGE_KEYS } from '@/lib/constants';

interface RolesState {
  roles: Role[];
}

interface RolesActions {
  // CRUD
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Omit<Role, 'id'>>) => void;
  toggleRoleActive: (id: string) => boolean;
  deleteRole: (id: string) => { success: boolean; error?: string };

  // Computed
  canDeactivateRole: (id: string) => boolean;
  canDeleteRole: (id: string) => { canDelete: boolean; reason?: string };
  getActiveRoles: () => Role[];
  getRoleById: (id: string) => Role | undefined;
  getRoleByType: (type: RoleType) => Role | undefined;
}

export const useRolesStore = create<RolesState & RolesActions>()(
  persist(
    (set, get) => ({
  // Initial state
  roles: MOCK_ROLES,

  // CRUD
  addRole: (roleData) => {
    const newRole: Role = {
      ...roleData,
      id: `role-${crypto.randomUUID()}`,
    };
    set((state) => ({
      roles: [...state.roles, newRole],
    }));
  },

  updateRole: (id, updates) => {
    set((state) => ({
      roles: state.roles.map((role) => (role.id === id ? { ...role, ...updates } : role)),
    }));
  },

  toggleRoleActive: (id) => {
    const { canDeactivateRole } = get();

    if (!canDeactivateRole(id)) {
      return false;
    }

    set((state) => ({
      roles: state.roles.map((role) =>
        role.id === id ? { ...role, active: !role.active } : role
      ),
    }));

    return true;
  },

  deleteRole: (id) => {
    const check = get().canDeleteRole(id);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }
    set((state) => ({
      roles: state.roles.filter((r) => r.id !== id),
    }));
    return { success: true };
  },

  // Computed
  canDeactivateRole: (id) => {
    const role = get().roles.find((r) => r.id === id);
    if (!role) return false;
    return !PROTECTED_ROLE_TYPES.includes(role.type);
  },

  canDeleteRole: (id) => {
    const role = get().getRoleById(id);
    if (!role) return { canDelete: false, reason: 'Role nenalezena' };

    // Administrator nelze smazat
    if (role.type === 'administrator') {
      return { canDelete: false, reason: 'Roli Administrátor nelze smazat' };
    }

    // Zkontrolovat, zda někdo roli používá
    const usersWithThisRole = getUsersWithRole(id);
    if (usersWithThisRole.length > 0) {
      return {
        canDelete: false,
        reason: `Roli používá ${usersWithThisRole.length} zaměstnanec(ů)`,
      };
    }
    return { canDelete: true };
  },

  getActiveRoles: () => {
    return get().roles.filter((r) => r.active);
  },

  getRoleById: (id) => {
    return get().roles.find((r) => r.id === id);
  },

  getRoleByType: (type) => {
    return get().roles.find((r) => r.type === type);
  },
    }),
    { name: STORAGE_KEYS.ROLES }
  )
);
