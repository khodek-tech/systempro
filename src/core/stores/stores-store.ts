import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { Store } from '@/shared/types';
import { MOCK_STORES } from '@/lib/mock-data';
import { useUsersStore } from './users-store';
import { STORAGE_KEYS } from '@/lib/constants';

interface StoresState {
  stores: Store[];
}

interface StoresActions {
  // CRUD
  addStore: (store: Omit<Store, 'id'>) => void;
  updateStore: (id: string, updates: Partial<Omit<Store, 'id'>>) => void;
  toggleStoreActive: (id: string) => void;
  deleteStore: (id: string) => { success: boolean; error?: string };

  // Computed
  getActiveStores: () => Store[];
  getStoreById: (id: string) => Store | undefined;
  canDeleteStore: (id: string) => { canDelete: boolean; reason?: string };
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
      id: `store-${crypto.randomUUID()}`,
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

  deleteStore: (id) => {
    const check = get().canDeleteStore(id);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }
    set((state) => ({
      stores: state.stores.filter((s) => s.id !== id),
    }));
    return { success: true };
  },

  // Computed
  getActiveStores: () => {
    return get().stores.filter((s) => s.active);
  },

  getStoreById: (id) => {
    return get().stores.find((s) => s.id === id);
  },

  canDeleteStore: (id) => {
    const users = useUsersStore.getState().users;
    const usersWithStore = users.filter((u) => u.storeIds.includes(id));
    if (usersWithStore.length > 0) {
      return {
        canDelete: false,
        reason: `Prodejnu používá ${usersWithStore.length} zaměstnanec(ů)`,
      };
    }
    return { canDelete: true };
  },
    }),
    { name: STORAGE_KEYS.STORES }
  )
);
