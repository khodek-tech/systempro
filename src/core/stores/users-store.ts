import { create } from 'zustand';
import { User } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToUser, mapUserToDb } from '@/lib/supabase/mappers';
import { getRoles } from './store-helpers';

interface UsersState {
  users: User[];
  _loaded: boolean;
  _loading: boolean;
}

interface UsersActions {
  // Fetch
  fetchUsers: () => Promise<void>;

  // CRUD
  addUser: (user: Omit<User, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  toggleUserActive: (id: string) => Promise<void>;
  deleteUser: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Password
  resetPassword: (userId: string) => Promise<{ success: boolean; error?: string }>;

  // Computed
  getActiveUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  getUserByAuthId: (authId: string) => User | undefined;
  isUsernameAvailable: (username: string, excludeUserId?: string) => boolean;
  validateUser: (user: Partial<User>, excludeUserId?: string) => { valid: boolean; error?: string };
}

export const useUsersStore = create<UsersState & UsersActions>()((set, get) => ({
  // Initial state
  users: [],
  _loaded: false,
  _loading: false,

  // Fetch
  fetchUsers: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('zamestnanci').select('*');
    if (!error && data) {
      set({ users: data.map(mapDbToUser), _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch users:', error);
      set({ _loading: false });
    }
  },

  // CRUD
  addUser: async (userData) => {
    const validation = get().validateUser(userData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Sanitize default values
    const sanitizedData = { ...userData };

    // Reset defaultRoleId if not in roleIds
    if (sanitizedData.defaultRoleId !== undefined) {
      if (!sanitizedData.roleIds.includes(sanitizedData.defaultRoleId)) {
        sanitizedData.defaultRoleId = sanitizedData.roleIds[0];
      }
    }

    // Reset defaultStoreId if not in storeIds
    if (sanitizedData.defaultStoreId !== undefined) {
      if (!sanitizedData.storeIds.includes(sanitizedData.defaultStoreId)) {
        sanitizedData.defaultStoreId = sanitizedData.storeIds[0];
      }
    }

    const newId = `user-${crypto.randomUUID()}`;
    const newUser: User = { ...sanitizedData, id: newId } as User;
    const dbData = mapUserToDb(newUser);

    const supabase = createClient();
    const { error } = await supabase.from('zamestnanci').insert(dbData);
    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      users: [...state.users, newUser],
    }));

    return { success: true };
  },

  updateUser: async (id, updates) => {
    const currentUser = get().getUserById(id);
    if (!currentUser) {
      return { success: false, error: 'Uživatel nenalezen' };
    }

    const updatedUser = { ...currentUser, ...updates };
    const validation = get().validateUser(updatedUser, id);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Sanitize default values
    const sanitizedUpdates = { ...updates };
    const finalRoleIds = updates.roleIds ?? currentUser.roleIds;
    const finalStoreIds = updates.storeIds ?? currentUser.storeIds;

    // Reset defaultRoleId if not in roleIds
    if (sanitizedUpdates.defaultRoleId !== undefined) {
      if (!finalRoleIds.includes(sanitizedUpdates.defaultRoleId)) {
        sanitizedUpdates.defaultRoleId = finalRoleIds[0];
      }
    }

    // Reset defaultStoreId if not in storeIds
    if (sanitizedUpdates.defaultStoreId !== undefined) {
      if (!finalStoreIds.includes(sanitizedUpdates.defaultStoreId)) {
        sanitizedUpdates.defaultStoreId = finalStoreIds[0];
      }
    }

    const dbData = mapUserToDb({ ...sanitizedUpdates, id });
    delete dbData.id;

    const supabase = createClient();
    const { error } = await supabase.from('zamestnanci').update(dbData).eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...sanitizedUpdates } : user)),
    }));

    return { success: true };
  },

  toggleUserActive: async (id) => {
    const user = get().getUserById(id);
    if (!user) return;

    const newActive = !user.active;
    const supabase = createClient();
    const { error } = await supabase.from('zamestnanci').update({ aktivni: newActive }).eq('id', id);
    if (error) {
      console.error('Failed to toggle user active:', error);
      return;
    }

    set((state) => ({
      users: state.users.map((u) =>
        u.id === id ? { ...u, active: newActive } : u
      ),
    }));
  },

  deleteUser: async (id) => {
    const user = get().getUserById(id);
    if (!user) {
      return { success: false, error: 'Uživatel nenalezen' };
    }

    const supabase = createClient();
    const { error } = await supabase.from('zamestnanci').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
    }));
    return { success: true };
  },

  // Password
  resetPassword: async (userId) => {
    const supabase = createClient();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) {
      return { success: false, error: 'Není přihlášen žádný uživatel' };
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const response = await fetch(`${supabaseUrl}/functions/v1/reset-password`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ userId }),
    });

    const result = await response.json();
    if (!response.ok || !result.success) {
      return { success: false, error: result.error || 'Nepodařilo se resetovat heslo' };
    }

    set((state) => ({
      users: state.users.map((u) =>
        u.id === userId ? { ...u, mustChangePassword: true } : u
      ),
    }));

    return { success: true };
  },

  // Computed
  getActiveUsers: () => {
    return get().users.filter((u) => u.active);
  },

  getUserById: (id) => {
    return get().users.find((u) => u.id === id);
  },

  getUserByAuthId: (authId) => {
    return get().users.find((u) => u.authId === authId);
  },

  isUsernameAvailable: (username, excludeUserId) => {
    const { users } = get();
    const normalizedUsername = username.toLowerCase().trim();
    return !users.some(
      (u) => u.id !== excludeUserId && u.username.toLowerCase() === normalizedUsername
    );
  },

  validateUser: (user, excludeUserId) => {
    // Check username is provided
    if (!user.username || user.username.trim() === '') {
      return { valid: false, error: 'Uživatelské jméno je povinné' };
    }

    // Check username is unique
    if (!get().isUsernameAvailable(user.username, excludeUserId)) {
      return { valid: false, error: 'Uživatelské jméno již existuje' };
    }

    // Check fullName is provided
    if (!user.fullName || user.fullName.trim() === '') {
      return { valid: false, error: 'Celé jméno je povinné' };
    }

    // Check at least one role is assigned
    if (!user.roleIds || user.roleIds.length === 0) {
      return { valid: false, error: 'Musí být přiřazena alespoň jedna role' };
    }

    // Check: if user has Prodavač role, they must have at least one store
    const prodavacRole = getRoles().find((r) => r.type === 'prodavac');
    if (prodavacRole && user.roleIds?.includes(prodavacRole.id)) {
      if (!user.storeIds || user.storeIds.length === 0) {
        return { valid: false, error: 'Prodavač musí mít přiřazenou alespoň jednu prodejnu' };
      }
    }

    return { valid: true };
  },
}));
