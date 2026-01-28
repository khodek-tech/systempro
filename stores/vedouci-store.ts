import { create } from 'zustand';
import { AttendanceRecord } from '@/types';
import { mockData } from '@/lib/mock-data';

type AdminSubView = 'main' | 'reports';

interface VedouciState {
  subView: AdminSubView;
  storeFilter: string;
  monthFilter: string;
  yearFilter: string;
}

interface KpiData {
  totalSales: number;
  totalCash: number;
  pendingAbsence: number;
}

interface VedouciActions {
  // Navigation
  setSubView: (view: AdminSubView) => void;
  goToMain: () => void;
  goToReports: () => void;

  // Filters
  setStoreFilter: (filter: string) => void;
  setMonthFilter: (filter: string) => void;
  setYearFilter: (filter: string) => void;
  resetFilters: () => void;

  // Computed data
  getFilteredData: () => AttendanceRecord[];
  getKpiData: () => KpiData;
  getVisibleStores: () => string[];
}

export const useVedouciStore = create<VedouciState & VedouciActions>((set, get) => ({
  // Initial state
  subView: 'main',
  storeFilter: 'all',
  monthFilter: 'all',
  yearFilter: 'all',

  // Navigation
  setSubView: (view) => set({ subView: view }),
  goToMain: () => set({ subView: 'main' }),
  goToReports: () => set({ subView: 'reports' }),

  // Filters
  setStoreFilter: (filter) => set({ storeFilter: filter }),
  setMonthFilter: (filter) => set({ monthFilter: filter }),
  setYearFilter: (filter) => set({ yearFilter: filter }),
  resetFilters: () =>
    set({
      storeFilter: 'all',
      monthFilter: 'all',
      yearFilter: 'all',
    }),

  // Computed data
  getFilteredData: () => {
    const { storeFilter, monthFilter, yearFilter } = get();

    return mockData.filter((d) => {
      const parts = d.date.split('. ');
      const m = parts[1];
      const y = parts[2];
      const matchStore =
        storeFilter === 'all' || d.store.toLowerCase().includes(storeFilter);
      const matchMonth = monthFilter === 'all' || m === monthFilter;
      const matchYear = yearFilter === 'all' || y === yearFilter;
      return matchStore && matchMonth && matchYear;
    });
  },

  getKpiData: () => {
    const filteredData = get().getFilteredData();

    let totalSales = 0;
    let totalCash = 0;
    let pendingAbsence = 0;

    filteredData.forEach((r) => {
      totalSales += r.cash + r.card + r.partner;
      if (!r.collected) {
        totalCash += r.cash + (parseInt(r.flows) || 0);
      }
      if (r.abs && r.abs !== '-') {
        pendingAbsence++;
      }
    });

    return { totalSales, totalCash, pendingAbsence };
  },

  getVisibleStores: () => {
    const { storeFilter } = get();
    const allStores = ['Praha 1', 'Brno', 'Ostrava'];

    if (storeFilter === 'all') return allStores;
    return allStores.filter((s) => s.toLowerCase().includes(storeFilter));
  },
}));
