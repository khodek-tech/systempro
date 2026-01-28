import { create } from 'zustand';
import { User } from '@/types';
import { MOCK_USERS, MOCK_ROLES } from '@/lib/mock-data';

interface UsersState {
  users: User[];
}

interface UsersActions {
  // CRUD
  addUser: (user: Omit<User, 'id'>) => { success: boolean; error?: string };
  updateUser: (id: string, updates: Partial<Omit<User, 'id'>>) => { success: boolean; error?: string };
  toggleUserActive: (id: string) => void;

  // Computed
  getActiveUsers: () => User[];
  getUserById: (id: string) => User | undefined;
  isUsernameAvailable: (username: string, excludeUserId?: string) => boolean;
  validateUser: (user: Partial<User>, excludeUserId?: string) => { valid: boolean; error?: string };
}

export const useUsersStore = create<UsersState & UsersActions>((set, get) => ({
  // Initial state
  users: MOCK_USERS,

  // CRUD
  addUser: (userData) => {
    const validation = get().validateUser(userData);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
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

    set((state) => ({
      users: state.users.map((user) => (user.id === id ? { ...user, ...updates } : user)),
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
    const prodavacRole = MOCK_ROLES.find((r) => r.type === 'prodavac');
    if (prodavacRole && user.roleIds?.includes(prodavacRole.id)) {
      if (!user.storeIds || user.storeIds.length === 0) {
        return { valid: false, error: 'Prodavač musí mít přiřazenou alespoň jednu prodejnu' };
      }
    }

    return { valid: true };
  },
}));
