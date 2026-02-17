/**
 * Application Constants
 *
 * Centralized constants for role IDs, column types, and other magic strings.
 */

// ============================================================================
// ROLE IDS
// ============================================================================

/**
 * Kept only for backward compatibility — use getAdminRoleId() from store-helpers
 * for dynamic lookup whenever possible.
 */
export const ROLE_IDS = {
  ADMINISTRATOR: 'role-2',
} as const;

/**
 * Protected role types that cannot be deactivated or deleted
 */
export const PROTECTED_ROLE_TYPES: string[] = ['administrator'];

// ============================================================================
// MODULE COLUMNS
// ============================================================================

/**
 * Module column positions
 */
export const MODULE_COLUMNS = {
  LEFT: 'left',
  RIGHT: 'right',
  TOP: 'top',
  FULL: 'full',
  HEADER: 'header',
} as const;

export type ModuleColumn = (typeof MODULE_COLUMNS)[keyof typeof MODULE_COLUMNS];

// ============================================================================
// FILTER VALUES
// ============================================================================

/**
 * Default filter value for "all" options
 */
export const FILTER_ALL = 'all';

// ============================================================================
// LOCAL STORAGE KEYS
// ============================================================================

/**
 * Zustand persist storage keys (only auth still uses localStorage persist)
 */
export const STORAGE_KEYS = {
  AUTH: 'systempro-auth',
} as const;

/**
 * Legacy localStorage keys to clean up on first load.
 * These stores no longer use persist - data comes from Supabase.
 */
export const LEGACY_STORAGE_KEYS = [
  'systempro-users',
  'systempro-roles',
  'systempro-stores',
  'systempro-modules',
  'systempro-absence',
  'systempro-shifts',
  'systempro-tasks',
  'systempro-chat',
  'pohoda-credentials',
] as const;
