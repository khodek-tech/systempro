/**
 * Base types - Role, Store, User
 */

// Role types - dynamic, any string slug
export type RoleType = string;

// Workplace types
export type WorkplaceType = 'store' | 'role';

// Opening hours types
export interface DayOpeningHours {
  open: string;    // "09:00"
  close: string;   // "18:00"
  closed: boolean;
}

export interface StoreOpeningHours {
  sameAllWeek: boolean;
  default?: DayOpeningHours;
  monday?: DayOpeningHours;
  tuesday?: DayOpeningHours;
  wednesday?: DayOpeningHours;
  thursday?: DayOpeningHours;
  friday?: DayOpeningHours;
  saturday?: DayOpeningHours;
  sunday?: DayOpeningHours;
}

export interface EmployeeWorkingHours {
  alternating: boolean;                  // true = odd/even week alternation
  oddWeek: StoreOpeningHours;            // Odd week schedule (or only schedule if not alternating)
  evenWeek?: StoreOpeningHours;          // Even week schedule (only if alternating=true)
}

// Store interface
export interface Store {
  id: string;
  name: string;
  address: string;
  active: boolean;
  openingHours?: StoreOpeningHours;
  cashBase?: number;  // Provozní základna kasy (výchozí: 0)
}

// Role interface
export interface Role {
  id: string;
  name: string;
  type: RoleType;
  active: boolean;
}

// User interface
export interface User {
  id: string;
  username: string;
  fullName: string;
  roleIds: string[];
  storeIds: string[];
  defaultRoleId?: string;
  defaultStoreId?: string;
  active: boolean;
  workingHours?: EmployeeWorkingHours;  // Vlastní pracovní doba zaměstnance
  authId?: string;
  mustChangePassword?: boolean;
}
