import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Store } from '@/types';
import { MOCK_STORES } from '@/lib/mock-data';

interface StoresState {
  stores: Store[];
}

interface StoresActions {
  // CRUD
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, updates: Partial<Omit<Store, 'id'>>) => void;
  toggleStoreActive: (id: string) => void;

  // Computed
  getActiveStores: () => Store[];
  getStoreById: (id: string) => Store | undefined;
}

export const useStoresStore = create<StoresState & StoresActions>()(
  persist(
    (set, get) => ({
  // Initial state
  stores: MOCK_STORES,

  // CRUD
  addStore: (storeData) => {
    const newStore: Store = {
      ...storeData,
      id: `store-${Date.now()}`,
    };
    set((state) => ({
      stores: [...state.stores, newStore],
    }));
  },

  updateStore: (id, updates) => {
    set((state) => ({
      stores: state.stores.map((store) => (store.id === id ? { ...store, ...updates } : store)),
    }));
  },

  toggleStoreActive: (id) => {
    set((state) => ({
      stores: state.stores.map((store) =>
        store.id === id ? { ...store, active: !store.active } : store
      ),
    }));
  },

  // Computed
  getActiveStores: () => {
    return get().stores.filter((s) => s.active);
  },

  getStoreById: (id) => {
    return get().stores.find((s) => s.id === id);
  },
    }),
    { name: 'systempro-stores' }
  )
);
