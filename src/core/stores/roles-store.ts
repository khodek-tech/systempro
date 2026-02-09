import { create } from 'zustand';
import { Role, RoleType } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToRole, mapRoleToDb } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { getUsersWithRole } from './store-helpers';
import { PROTECTED_ROLE_TYPES } from '@/lib/constants';

interface RolesState {
  roles: Role[];
  _loaded: boolean;
  _loading: boolean;
}

interface RolesActions {
  // Fetch
  fetchRoles: () => Promise<void>;

  // CRUD
  addRole: (role: Omit<Role, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateRole: (id: string, updates: Partial<Omit<Role, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  toggleRoleActive: (id: string) => Promise<boolean>;
  deleteRole: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Computed
  canDeactivateRole: (id: string) => boolean;
  canDeleteRole: (id: string) => { canDelete: boolean; reason?: string };
  getActiveRoles: () => Role[];
  getRoleById: (id: string) => Role | undefined;
  getRoleByType: (type: RoleType) => Role | undefined;
}

export const useRolesStore = create<RolesState & RolesActions>()((set, get) => ({
  // Initial state
  roles: [],
  _loaded: false,
  _loading: false,

  // Fetch
  fetchRoles: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('role').select('*');
    if (!error && data) {
      set({ roles: data.map(mapDbToRole), _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch roles:', error);
      set({ _loading: false });
    }
  },

  // CRUD
  addRole: async (roleData) => {
    const newId = `role-${crypto.randomUUID()}`;
    const newRole: Role = { ...roleData, id: newId };
    const dbData = mapRoleToDb(newRole);

    const supabase = createClient();
    const { error } = await supabase.from('role').insert(dbData);
    if (error) {
      console.error('Failed to add role:', error);
      toast.error('Nepodařilo se přidat roli');
      return { success: false, error: error.message };
    }

    set((state) => ({
      roles: [...state.roles, newRole],
    }));
    return { success: true };
  },

  updateRole: async (id, updates) => {
    const dbData = mapRoleToDb({ ...updates, id });
    delete dbData.id;

    const supabase = createClient();
    const { error } = await supabase.from('role').update(dbData).eq('id', id);
    if (error) {
      console.error('Failed to update role:', error);
      toast.error('Nepodařilo se upravit roli');
      return { success: false, error: error.message };
    }

    set((state) => ({
      roles: state.roles.map((role) => (role.id === id ? { ...role, ...updates } : role)),
    }));
    return { success: true };
  },

  toggleRoleActive: async (id) => {
    const { canDeactivateRole } = get();

    if (!canDeactivateRole(id)) {
      return false;
    }

    const role = get().getRoleById(id);
    if (!role) return false;

    const newActive = !role.active;
    const supabase = createClient();
    const { error } = await supabase.from('role').update({ aktivni: newActive }).eq('id', id);
    if (error) {
      console.error('Failed to toggle role active:', error);
      toast.error('Nepodařilo se změnit stav role');
      return false;
    }

    set((state) => ({
      roles: state.roles.map((r) =>
        r.id === id ? { ...r, active: newActive } : r
      ),
    }));

    return true;
  },

  deleteRole: async (id) => {
    const check = get().canDeleteRole(id);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }

    const supabase = createClient();
    const { error } = await supabase.from('role').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
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
}));
