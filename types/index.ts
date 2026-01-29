// Role types - 8 available roles
export type RoleType =
  | 'prodavac'
  | 'skladnik'
  | 'administrator'
  | 'vedouci-sklad'
  | 'obsluha-eshop'
  | 'obchodnik'
  | 'vedouci-velkoobchod'
  | 'majitel';

// Workplace types
export type WorkplaceType = 'store' | 'role';

// Store interface
export interface Store {
  id: string;
  name: string;
  address: string;
  active: boolean;
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
}

// Attendance record with new workplace structure
export interface AttendanceRecord {
  date: string;
  store: string;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  user: string;
  in: string;
  out: string;
  abs: string;
  hrs: string;
  absNote: string;
  cash: number;
  card: number;
  partner: number;
  flows: string;
  saleNote: string;
  collected: string | false;
}

export interface ExtraRow {
  id: string;
  amount: number;
  note: string;
}

export interface SalesFormData {
  cash: number;
  card: number;
  partner: number;
  incomes: ExtraRow[];
  expenses: ExtraRow[];
}

export type AbsenceType = 'Dovolená' | 'Nemoc / Neschopenka' | 'Lékař' | 'Neplacené volno';

export interface AbsenceFormData {
  type: AbsenceType;
  dateFrom: string;
  dateTo: string;
  timeFrom?: string;
  timeTo?: string;
  note: string;
}

export interface CollectionFormData {
  driverName: string;
  amount: number;
  period: string;
}
