import { create } from 'zustand';
import { AttendanceRecord } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToAttendanceRecord } from '@/lib/supabase/mappers';

type AdminSubView = 'main' | 'reports' | 'settings';
type SettingsTab = 'stores' | 'roles' | 'employees' | 'modules' | 'pohoda';

interface AdminState {
  subView: AdminSubView;
  settingsTab: SettingsTab;
  selectedModuleId: string | null;
  storeFilter: string;
  monthFilter: string;
  yearFilter: string;
  attendanceRecords: AttendanceRecord[];
  _loaded: boolean;
  _loading: boolean;
}

interface KpiData {
  totalSales: number;
  totalCash: number;
  pendingAbsence: number;
}

interface AdminActions {
  // Fetch
  fetchAttendanceRecords: () => Promise<void>;

  // Navigation
  setSubView: (view: AdminSubView) => void;
  goToMain: () => void;
  goToReports: () => void;
  goToSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  selectModule: (moduleId: string | null) => void;

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

export const useAdminStore = create<AdminState & AdminActions>((set, get) => ({
  // Initial state
  subView: 'main',
  settingsTab: 'stores',
  selectedModuleId: null,
  storeFilter: 'all',
  monthFilter: 'all',
  yearFilter: 'all',
  attendanceRecords: [],
  _loaded: false,
  _loading: false,

  // Fetch
  fetchAttendanceRecords: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('dochazka').select('*');
    if (!error && data) {
      set({ attendanceRecords: data.map(mapDbToAttendanceRecord), _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch attendance records:', error);
      set({ _loading: false });
    }
  },

  // Navigation
  setSubView: (view) => set({ subView: view }),
  goToMain: () => set({ subView: 'main' }),
  goToReports: () => set({ subView: 'reports' }),
  goToSettings: () => set({ subView: 'settings', settingsTab: 'stores' }),
  setSettingsTab: (tab) => set({ settingsTab: tab, selectedModuleId: null }),
  selectModule: (moduleId) => set({ selectedModuleId: moduleId }),

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
    const { storeFilter, monthFilter, yearFilter, attendanceRecords } = get();

    return attendanceRecords.filter((d) => {
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
    const { storeFilter, attendanceRecords } = get();
    // Get unique store names from actual data
    const allStores = [...new Set(attendanceRecords.map((r) => r.store).filter(Boolean))];

    if (storeFilter === 'all') return allStores;
    return allStores.filter((s) => s.toLowerCase().includes(storeFilter));
  },
}));
