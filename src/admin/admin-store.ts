import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AttendanceRecord } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToAttendanceRecord } from '@/lib/supabase/mappers';
import { getStorageUsage } from '@/lib/supabase/storage';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

type AdminSubView = 'main' | 'reports' | 'settings';
type SettingsTab = 'stores' | 'roles' | 'employees' | 'modules' | 'pohoda' | 'email';

interface AdminState {
  subView: AdminSubView;
  settingsTab: SettingsTab;
  selectedModuleId: string | null;
  storeFilter: string;
  employeeFilter: string;
  monthFilter: string;
  yearFilter: string;
  attendanceRecords: AttendanceRecord[];
  storageUsageBytes: number;
  _loaded: boolean;
  _loading: boolean;
  _realtimeChannel: RealtimeChannel | null;
}

interface KpiData {
  totalSales: number;
  totalCash: number;
  pendingAbsence: number;
}

interface AdminActions {
  // Fetch
  fetchAttendanceRecords: () => Promise<void>;
  fetchStorageUsage: () => Promise<void>;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

  // Navigation
  setSubView: (view: AdminSubView) => void;
  goToMain: () => void;
  goToReports: () => void;
  goToSettings: () => void;
  setSettingsTab: (tab: SettingsTab) => void;
  selectModule: (moduleId: string | null) => void;

  // Filters
  setStoreFilter: (filter: string) => void;
  setEmployeeFilter: (filter: string) => void;
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
  employeeFilter: 'all',
  monthFilter: 'all',
  yearFilter: 'all',
  attendanceRecords: [],
  storageUsageBytes: 0,
  _loaded: false,
  _loading: false,
  _realtimeChannel: null,

  // Fetch
  fetchAttendanceRecords: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('dochazka').select('*');
    if (!error && data) {
      set({ attendanceRecords: data.map(mapDbToAttendanceRecord), _loaded: true, _loading: false });
    } else {
      logger.error('Failed to fetch attendance records');
      toast.error('Nepodařilo se načíst docházku');
      set({ _loading: false });
    }
  },

  fetchStorageUsage: async () => {
    const bytes = await getStorageUsage();
    set({ storageUsageBytes: bytes });
  },

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('admin-attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dochazka',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const record = mapDbToAttendanceRecord(payload.new);
          set({ attendanceRecords: [...get().attendanceRecords, record] });
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dochazka',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = mapDbToAttendanceRecord(payload.new);
          set({
            attendanceRecords: get().attendanceRecords.map((r) =>
              r.id === updated.id ? updated : r
            ),
          });
        },
      )
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
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
  setEmployeeFilter: (filter) => set({ employeeFilter: filter }),
  setMonthFilter: (filter) => set({ monthFilter: filter }),
  setYearFilter: (filter) => set({ yearFilter: filter }),
  resetFilters: () =>
    set({
      storeFilter: 'all',
      employeeFilter: 'all',
      monthFilter: 'all',
      yearFilter: 'all',
    }),

  // Computed data
  getFilteredData: () => {
    const { storeFilter, employeeFilter, monthFilter, yearFilter, attendanceRecords } = get();

    return attendanceRecords.filter((d) => {
      const parts = d.date.split('. ');
      const m = parts[1];
      const y = parts[2];
      const matchStore =
        storeFilter === 'all' || d.store.toLowerCase().includes(storeFilter);
      const matchEmployee = employeeFilter === 'all' || d.user === employeeFilter;
      const matchMonth = monthFilter === 'all' || m === monthFilter;
      const matchYear = yearFilter === 'all' || y === yearFilter;
      return matchStore && matchEmployee && matchMonth && matchYear;
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
