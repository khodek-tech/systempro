import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User } from '@/types';
import { MOCK_USERS } from '@/lib/mock-data';
import { getRoles } from './store-helpers';
import { STORAGE_KEYS } from '@/lib/constants';

interface UsersState {
  users: User[];
  _hydrated: boolean;
}

interface UsersActions {
  // CRUD
  addUser: (user: Omit<User, 'id'>) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => { success: boolean; error?: string };
  toggleUserActive: (id: string) => void;
  deleteUser: (id: string) => { success: boolean; error?: string };

  // Computed
  getActiveUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  isUsernameAvailable: (username: string, excludeUserId?: string) => boolean;
  validateUser: (user: Partial<User>, excludeUserId?: string) => { valid: boolean; error?: string };
}

export const useUsersStore = create<UsersState & UsersActions>()(
  persist(
    (set, get) => ({
  // Initial state
  users: MOCK_USERS,
  _hydrated: false,

  // CRUD
  addUser: (userData) => {
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

    const newUser: User = {
      ...sanitizedData,
      id: `user-${crypto.randomUUID()}`,
    } as User;

    set((state) => ({
      users: [...state.users, newUser],
    }));

    return { success: true };
  },

  updateUser: (id, updates) => {
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

    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...sanitizedUpdates } : user)),
    }));

    return { success: true };
  },

  toggleUserActive: (id) => {
    set((state) => ({
      users: state.users.map((user) =>
        user.id === id ? { ...user, active: !user.active } : user
      ),
    }));
  },

  deleteUser: (id) => {
    const user = get().getUserById(id);
    if (!user) {
      return { success: false, error: 'Uživatel nenalezen' };
    }

    set((state) => ({
      users: state.users.filter((u) => u.id !== id),
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
    }),
    {
      name: STORAGE_KEYS.USERS,
      partialize: (state) => ({
        users: state.users,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hydrated = true;
        }
      },
    }
  )
);
