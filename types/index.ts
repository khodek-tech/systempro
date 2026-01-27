export type Role = 'prodavac' | 'vedouci';

export type WorkplaceType = 'praha 1' | 'brno' | 'ostrava' | 'sklad';

export interface AttendanceRecord {
  date: string;
  store: string;
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
