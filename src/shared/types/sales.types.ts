/**
 * Sales types
 */

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

export interface CollectionFormData {
  driverName: string;
  amount: number;
  period: string;
}
