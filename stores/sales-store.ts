import { create } from 'zustand';
import { ExtraRow, SalesFormData } from '@/types';

const createEmptyRow = (): ExtraRow => ({
  id: crypto.randomUUID(),
  amount: 0,
  note: '',
});

interface SalesState {
  cashToCollect: number;
  formData: SalesFormData;
}

interface SalesActions {
  // Computed
  calculateTotal: () => number;
  getCollectionPeriod: () => string;

  // Form field actions
  updateField: (field: 'cash' | 'card' | 'partner', value: number) => void;

  // Income row actions
  addIncomeRow: () => void;
  updateIncomeRow: (id: string, field: 'amount' | 'note', value: number | string) => void;
  removeIncomeRow: (id: string) => void;

  // Expense row actions
  addExpenseRow: () => void;
  updateExpenseRow: (id: string, field: 'amount' | 'note', value: number | string) => void;
  removeExpenseRow: (id: string) => void;

  // Submit actions
  validateForm: () => { valid: boolean; error?: string };
  submitSales: () => { valid: boolean; error?: string };
  submitCollection: (driverName: string) => { success: boolean; error?: string };
  resetForm: () => void;
}

export const useSalesStore = create<SalesState & SalesActions>((set, get) => ({
  // Initial state
  cashToCollect: 28500,
  formData: {
    cash: 0,
    card: 0,
    partner: 0,
    incomes: [],
    expenses: [],
  },

  // Computed
  calculateTotal: () => {
    const { formData } = get();
    let total = formData.cash + formData.card + formData.partner;
    formData.incomes.forEach((i) => {
      total += i.amount || 0;
    });
    formData.expenses.forEach((e) => {
      total -= e.amount || 0;
    });
    return total;
  },

  getCollectionPeriod: () => {
    const now = new Date();
    const monthNames = [
      'ledna',
      'února',
      'března',
      'dubna',
      'května',
      'června',
      'července',
      'srpna',
      'září',
      'října',
      'listopadu',
      'prosince',
    ];
    if (now.getDate() >= 16) {
      return `1. - 15. ${monthNames[now.getMonth()]}`;
    }
    return `16. - Konec min. měsíce`;
  },

  // Form field actions
  updateField: (field, value) =>
    set((state) => ({
      formData: { ...state.formData, [field]: value },
    })),

  // Income row actions
  addIncomeRow: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        incomes: [...state.formData.incomes, createEmptyRow()],
      },
    })),

  updateIncomeRow: (id, field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        incomes: state.formData.incomes.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        ),
      },
    })),

  removeIncomeRow: (id) =>
    set((state) => ({
      formData: {
        ...state.formData,
        incomes: state.formData.incomes.filter((row) => row.id !== id),
      },
    })),

  // Expense row actions
  addExpenseRow: () =>
    set((state) => ({
      formData: {
        ...state.formData,
        expenses: [...state.formData.expenses, createEmptyRow()],
      },
    })),

  updateExpenseRow: (id, field, value) =>
    set((state) => ({
      formData: {
        ...state.formData,
        expenses: state.formData.expenses.map((row) =>
          row.id === id ? { ...row, [field]: value } : row
        ),
      },
    })),

  removeExpenseRow: (id) =>
    set((state) => ({
      formData: {
        ...state.formData,
        expenses: state.formData.expenses.filter((row) => row.id !== id),
      },
    })),

  // Submit actions
  validateForm: () => {
    const { formData } = get();
    const allRows = [...formData.incomes, ...formData.expenses];
    for (const row of allRows) {
      if (row.amount > 0 && !row.note.trim()) {
        return {
          valid: false,
          error: 'Doplňte povinné poznámky u všech pohybů!',
        };
      }
    }
    return { valid: true };
  },

  submitSales: () => {
    const { validateForm, formData } = get();
    const validation = validateForm();
    if (!validation.valid) {
      return validation;
    }

    set((state) => ({
      cashToCollect: state.cashToCollect + formData.cash,
      formData: {
        cash: 0,
        card: 0,
        partner: 0,
        incomes: [],
        expenses: [],
      },
    }));

    return { valid: true };
  },

  submitCollection: (driverName) => {
    if (!driverName.trim()) {
      return { success: false, error: 'Vyplňte jméno řidiče!' };
    }
    set({ cashToCollect: 0 });
    return { success: true };
  },

  resetForm: () =>
    set({
      formData: {
        cash: 0,
        card: 0,
        partner: 0,
        incomes: [],
        expenses: [],
      },
    }),
}));
