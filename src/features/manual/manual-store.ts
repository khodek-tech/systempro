import { create } from 'zustand';

interface ManualState {
  manualViewMode: 'card' | 'view';
  expandedSections: string[];
  searchQuery: string;
}

interface ManualActions {
  openManualView: () => void;
  closeManualView: () => void;
  toggleSection: (moduleId: string) => void;
  expandAllSections: () => void;
  collapseAllSections: () => void;
  setSearchQuery: (query: string) => void;
}

export const useManualStore = create<ManualState & ManualActions>()((set) => ({
  // Initial state
  manualViewMode: 'card',
  expandedSections: [],
  searchQuery: '',

  // View mode actions
  openManualView: () => set({ manualViewMode: 'view' }),
  closeManualView: () =>
    set({ manualViewMode: 'card', expandedSections: [], searchQuery: '' }),

  // Section actions
  toggleSection: (moduleId) =>
    set((state) => ({
      expandedSections: state.expandedSections.includes(moduleId)
        ? state.expandedSections.filter((id) => id !== moduleId)
        : [...state.expandedSections, moduleId],
    })),

  expandAllSections: () =>
    set((state) => {
      // This will be called with the list of all module IDs
      // For now, we'll handle this in the component
      return state;
    }),

  collapseAllSections: () => set({ expandedSections: [] }),

  setSearchQuery: (query) => set({ searchQuery: query }),
}));
