/**
 * Cross-store helper functions
 *
 * This module provides helper functions that need access to multiple stores.
 * It uses dynamic imports to avoid circular dependencies between stores.
 */

import { Role, User } from '@/shared/types';

// Lazy getters to avoid circular dependencies at module load time
export const getUsers = (): User[] => {
  // Dynamic require to break circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useUsersStore } = require('./users-store');
  return useUsersStore.getState().users;
};

export const getRoles = (): Role[] => {
  // Dynamic require to break circular dependency
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { useRolesStore } = require('./roles-store');
  return useRolesStore.getState().roles;
};

// Cross-store validation helpers
export const getUsersWithRole = (roleId: string): User[] => {
  return getUsers().filter((u) => u.roleIds.includes(roleId));
};

export const getRoleByType = (type: string): Role | undefined => {
  return getRoles().find((r) => r.type === type);
};
