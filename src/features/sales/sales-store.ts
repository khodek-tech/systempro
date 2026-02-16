import { create } from 'zustand';
import { ExtraRow, SalesFormData } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/core/stores/auth-store';
import { useAttendanceStore } from '@/features/attendance/attendance-store';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatCzechDate } from '@/shared/utils';

const createEmptyRow = (): ExtraRow => ({
  id: crypto.randomUUID(),
  amount: 0,
  note: '',
});

interface SalesState {
  cashToCollect: number;
  formData: SalesFormData;
  _loaded: boolean;
  _loading: boolean;
}

interface SalesActions {
  // Fetch
  fetchCashToCollect: (storeId: string) => Promise<void>;

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
  submitSales: () => Promise<{ valid: boolean; error?: string }>;
  submitCollection: (driverName: string) => Promise<{ success: boolean; error?: string }>;
  resetForm: () => void;
}

export const useSalesStore = create<SalesState & SalesActions>((set, get) => ({
  // Initial state
  cashToCollect: 0,
  formData: {
    cash: 0,
    card: 0,
    partner: 0,
    incomes: [],
    expenses: [],
  },
  _loaded: false,
  _loading: false,

  // Fetch uncollected cash from dochazka table
  fetchCashToCollect: async (storeId: string) => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('dochazka')
      .select('hotovost, pohyby, vybrano')
      .eq('id_pracoviste', storeId)
      .or('vybrano.eq.false,vybrano.is.null');

    if (!error && data) {
      let total = 0;
      data.forEach((row) => {
        total += (row.hotovost ?? 0) + (parseInt(row.pohyby) || 0);
      });
      set({ cashToCollect: total, _loaded: true, _loading: false });
    } else {
      logger.error('Failed to fetch cash to collect');
      set({ _loading: false });
    }
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
      if (row.amount < 0) {
        return {
          valid: false,
          error: 'Částky nesmí být záporné!',
        };
      }
      if (row.amount > 0 && !row.note.trim()) {
        return {
          valid: false,
          error: 'Doplňte povinné poznámky u všech pohybů!',
        };
      }
    }
    return { valid: true };
  },

  submitSales: async () => {
    const { validateForm, formData } = get();
    const validation = validateForm();
    if (!validation.valid) {
      return validation;
    }

    const currentUser = useAuthStore.getState().currentUser;
    const attendance = useAttendanceStore.getState();

    if (!currentUser) {
      return { valid: false, error: 'Uživatel není přihlášen.' };
    }

    // Build net flow from incomes/expenses
    const flows: string[] = [];
    formData.incomes.forEach((i) => {
      if (i.amount > 0) flows.push(`+${i.amount}`);
    });
    formData.expenses.forEach((e) => {
      if (e.amount > 0) flows.push(`-${e.amount}`);
    });
    const pohyby = flows.join(', ') || null;

    // Build notes from income/expense rows
    const notes: string[] = [];
    formData.incomes.forEach((i) => {
      if (i.note.trim()) notes.push(`+${i.amount}: ${i.note.trim()}`);
    });
    formData.expenses.forEach((e) => {
      if (e.note.trim()) notes.push(`-${e.amount}: ${e.note.trim()}`);
    });
    const poznamkaTrzba = notes.join('; ') || null;

    const now = new Date();
    const datum = formatCzechDate(now);

    const supabase = createClient();

    // Check if employee already has an open attendance record today (checked in, not checked out)
    const { data: existing } = await supabase
      .from('dochazka')
      .select('id')
      .eq('datum', datum)
      .eq('zamestnanec', currentUser.fullName)
      .is('odchod', null)
      .limit(1)
      .single();

    const motivaceProcenta = 2.0;
    const motivaceCastka = Math.round((formData.cash + formData.card + formData.partner) * (motivaceProcenta / 100));

    const salesData = {
      hotovost: formData.cash,
      karta: formData.card,
      partner: formData.partner,
      pohyby: pohyby,
      poznamka_trzba: poznamkaTrzba,
      vybrano: null,
      motivace_procenta: motivaceProcenta,
      motivace_castka: motivaceCastka,
    };

    const { error } = existing
      ? // Update existing open attendance record with sales data
        await supabase.from('dochazka').update(salesData).eq('id', existing.id)
      : // No open record — insert a new row
        await supabase.from('dochazka').insert({
          datum,
          prodejna: attendance.workplaceType === 'store' ? attendance.workplaceName : null,
          typ_pracoviste: attendance.workplaceType,
          id_pracoviste: attendance.workplaceId,
          nazev_pracoviste: attendance.workplaceName,
          zamestnanec: currentUser.fullName,
          ...salesData,
        });

    if (error) {
      logger.error('Failed to save sales to DB');
      toast.error('Nepodařilo se uložit tržby do databáze.');
      return { valid: false, error: 'Chyba při ukládání do databáze.' };
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

    toast.success('Tržby uloženy do systému.');
    return { valid: true };
  },

  submitCollection: async (driverName) => {
    if (!driverName.trim()) {
      return { success: false, error: 'Vyplňte jméno řidiče!' };
    }

    const attendance = useAttendanceStore.getState();
    const storeId = attendance.workplaceId;

    if (!storeId) {
      return { success: false, error: 'Pracoviště není nastaveno.' };
    }

    const now = new Date();
    const datum = formatCzechDate(now);
    const vybranoValue = `${driverName.trim()} - ${datum}`;

    const supabase = createClient();
    const { error } = await supabase
      .from('dochazka')
      .update({ vybrano: vybranoValue })
      .eq('id_pracoviste', storeId)
      .or('vybrano.eq.false,vybrano.is.null');

    if (error) {
      logger.error('Failed to update collection in DB');
      toast.error('Nepodařilo se zaznamenat odvod.');
      return { success: false, error: 'Chyba při ukládání do databáze.' };
    }

    set({ cashToCollect: 0 });
    toast.success('Hotovost odevzdána.');
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
