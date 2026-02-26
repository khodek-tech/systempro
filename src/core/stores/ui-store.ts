import { create } from 'zustand';

interface UIState {
  // Modal states
  salesModalOpen: boolean;
  collectModalOpen: boolean;
  absenceModalOpen: boolean;
  motivationModalOpen: boolean;
  motivationProductsModalOpen: boolean;
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
  setMotivationModalOpen: (open: boolean) => void;
  setMotivationProductsModalOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState & UIActions>((set) => ({
  // Initial state
  salesModalOpen: false,
  collectModalOpen: false,
  absenceModalOpen: false,
  motivationModalOpen: false,
  motivationProductsModalOpen: false,

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
  setMotivationModalOpen: (open) => set({ motivationModalOpen: open }),
  setMotivationProductsModalOpen: (open) => set({ motivationProductsModalOpen: open }),
}));
