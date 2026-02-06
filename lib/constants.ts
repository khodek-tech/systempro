/**
 * Application Constants
 *
 * Centralized constants for role IDs, column types, and other magic strings.
 */

import { RoleType } from '@/types';

// ============================================================================
// ROLE IDS
// ============================================================================

/**
 * Role ID constants matching the mock data definitions.
 * Use these instead of hardcoded strings like 'role-1'.
 */
export const ROLE_IDS = {
  PRODAVAC: 'role-1',
  ADMINISTRATOR: 'role-2',
  SKLADNIK: 'role-3',
  VEDOUCI_SKLADU: 'role-4',
  OBSLUHA_ESHOPU: 'role-5',
  OBCHODNIK: 'role-6',
  VEDOUCI_VELKOOBCHODU: 'role-7',
  MAJITEL: 'role-8',
} as const;

/**
 * Role type to ID mapping
 */
export const ROLE_TYPE_TO_ID: Record<RoleType, string> = {
  prodavac: ROLE_IDS.PRODAVAC,
  administrator: ROLE_IDS.ADMINISTRATOR,
  skladnik: ROLE_IDS.SKLADNIK,
  'vedouci-sklad': ROLE_IDS.VEDOUCI_SKLADU,
  'obsluha-eshop': ROLE_IDS.OBSLUHA_ESHOPU,
  obchodnik: ROLE_IDS.OBCHODNIK,
  'vedouci-velkoobchod': ROLE_IDS.VEDOUCI_VELKOOBCHODU,
  majitel: ROLE_IDS.MAJITEL,
};

/**
 * Roles that cannot report absence
 */
export const ROLES_WITHOUT_ABSENCE: RoleType[] = ['administrator', 'majitel'];

/**
 * Protected role types that cannot be deactivated
 */
export const PROTECTED_ROLE_TYPES: RoleType[] = ['administrator'];

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
] as const;
