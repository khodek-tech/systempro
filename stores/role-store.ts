import { create } from 'zustand';
import { Role } from '@/types';

interface RoleState {
  role: Role;
}

interface RoleActions {
  switchRole: (role: Role) => void;
  isProdavac: () => boolean;
  isVedouci: () => boolean;
}

export const useRoleStore = create<RoleState & RoleActions>((set, get) => ({
  // Initial state
  role: 'prodavac',

  // Actions
  switchRole: (role) => set({ role }),

  // Computed
  isProdavac: () => get().role === 'prodavac',
  isVedouci: () => get().role === 'vedouci',
}));
