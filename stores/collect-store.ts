import { create } from 'zustand';

interface CollectState {
  driverName: string;
}

interface CollectActions {
  setDriverName: (name: string) => void;
  resetForm: () => void;
}

export const useCollectStore = create<CollectState & CollectActions>((set) => ({
  // Initial state
  driverName: '',

  // Actions
  setDriverName: (name) => set({ driverName: name }),
  resetForm: () => set({ driverName: '' }),
}));
