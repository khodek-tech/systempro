import { create } from 'zustand';
import { Role, RoleType } from '@/types';
import { MOCK_ROLES } from '@/lib/mock-data';

interface RolesState {
  roles: Role[];
}

interface RolesActions {
  // CRUD
  addRole: (role: Omit<Role, 'id'>) => void;
  updateRole: (id: string, updates: Partial<Omit<Role, 'id'>>) => void;
  toggleRoleActive: (id: string) => boolean;

  // Computed
  canDeactivateRole: (id: string) => boolean;
  getActiveRoles: () => Role[];
  getRoleById: (id: string) => Role | undefined;
  getRoleByType: (type: RoleType) => Role | undefined;
}

// Administrator role cannot be deactivated
const PROTECTED_ROLE_TYPES: RoleType[] = ['administrator'];

export const useRolesStore = create<RolesState & RolesActions>((set, get) => ({
  // Initial state
  roles: MOCK_ROLES,

  // CRUD
  addRole: (roleData) => {
    const newRole: Role = {
      ...roleData,
      id: `role-${Date.now()}`,
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

  // Computed
  canDeactivateRole: (id) => {
    const role = get().roles.find((r) => r.id === id);
    if (!role) return false;
    return !PROTECTED_ROLE_TYPES.includes(role.type);
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
}));
