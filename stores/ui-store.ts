import { create } from 'zustand';

type AdminSubView = 'main' | 'reports';

interface UIState {
  // Prodavac modals
  salesModalOpen: boolean;
  collectModalOpen: boolean;
  absenceModalOpen: boolean;

  // Vedouci view
  subView: AdminSubView;
  storeFilter: string;
  monthFilter: string;
  yearFilter: string;
}

interface UIActions {
  // Modal actions
  openSalesModal: () => void;
  closeSalesModal: () => void;
  openCollectModal: () => void;
  closeCollectModal: () => void;
  openAbsenceModal: () => void;
  closeAbsenceModal: () => void;
  setSalesModalOpen: (open: boolean) => void;
  setCollectModalOpen: (open: boolean) => void;
  setAbsenceModalOpen: (open: boolean) => void;

  // Vedouci view actions
  setSubView: (view: AdminSubView) => void;
  setStoreFilter: (filter: string) => void;
  setMonthFilter: (filter: string) => void;
  setYearFilter: (filter: string) => void;
  resetFilters: () => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // Initial state - modals
  salesModalOpen: false,
  collectModalOpen: false,
  absenceModalOpen: false,

  // Initial state - vedouci
  subView: 'main',
  storeFilter: 'all',
  monthFilter: 'all',
  yearFilter: 'all',

  // Modal actions
  openSalesModal: () => set({ salesModalOpen: true }),
  closeSalesModal: () => set({ salesModalOpen: false }),
  openCollectModal: () => set({ collectModalOpen: true }),
  closeCollectModal: () => set({ collectModalOpen: false }),
  openAbsenceModal: () => set({ absenceModalOpen: true }),
  closeAbsenceModal: () => set({ absenceModalOpen: false }),
  setSalesModalOpen: (open) => set({ salesModalOpen: open }),
  setCollectModalOpen: (open) => set({ collectModalOpen: open }),
  setAbsenceModalOpen: (open) => set({ absenceModalOpen: open }),

  // Vedouci view actions
  setSubView: (view) => set({ subView: view }),
  setStoreFilter: (filter) => set({ storeFilter: filter }),
  setMonthFilter: (filter) => set({ monthFilter: filter }),
  setYearFilter: (filter) => set({ yearFilter: filter }),
  resetFilters: () => set({ storeFilter: 'all', monthFilter: 'all', yearFilter: 'all' }),
}));
