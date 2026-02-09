import { create } from 'zustand';
import { Store } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToStore, mapStoreToDb } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { useUsersStore } from './users-store';

interface StoresState {
  stores: Store[];
  _loaded: boolean;
  _loading: boolean;
}

interface StoresActions {
  // Fetch
  fetchStores: () => Promise<void>;

  // CRUD
  addStore: (store: Omit<Store, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateStore: (id: string, updates: Partial<Omit<Store, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  toggleStoreActive: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteStore: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Computed
  getActiveStores: () => Store[];
  getStoreById: (id: string) => Store | undefined;
  canDeleteStore: (id: string) => { canDelete: boolean; reason?: string };
}

export const useStoresStore = create<StoresState & StoresActions>()((set, get) => ({
  // Initial state
  stores: [],
  _loaded: false,
  _loading: false,

  // Fetch
  fetchStores: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('prodejny').select('*');
    if (!error && data) {
      set({ stores: data.map(mapDbToStore), _loaded: true, _loading: false });
    } else {
      console.error('Failed to fetch stores:', error);
      set({ _loading: false });
    }
  },

  // CRUD
  addStore: async (storeData) => {
    const newId = `store-${crypto.randomUUID()}`;
    const newStore: Store = { ...storeData, id: newId };
    const dbData = mapStoreToDb(newStore);

    const supabase = createClient();
    const { error } = await supabase.from('prodejny').insert(dbData);
    if (error) {
      console.error('Failed to add store:', error);
      toast.error('Nepodařilo se přidat prodejnu');
      return { success: false, error: error.message };
    }

    set((state) => ({
      stores: [...state.stores, newStore],
    }));
    return { success: true };
  },

  updateStore: async (id, updates) => {
    const dbData = mapStoreToDb({ ...updates, id });
    delete dbData.id;

    const supabase = createClient();
    const { error } = await supabase.from('prodejny').update(dbData).eq('id', id);
    if (error) {
      console.error('Failed to update store:', error);
      toast.error('Nepodařilo se upravit prodejnu');
      return { success: false, error: error.message };
    }

    set((state) => ({
      stores: state.stores.map((store) => (store.id === id ? { ...store, ...updates } : store)),
    }));
    return { success: true };
  },

  toggleStoreActive: async (id) => {
    const store = get().getStoreById(id);
    if (!store) return { success: false, error: 'Prodejna nenalezena' };

    const newActive = !store.active;
    const supabase = createClient();
    const { error } = await supabase.from('prodejny').update({ aktivni: newActive }).eq('id', id);
    if (error) {
      console.error('Failed to toggle store active:', error);
      toast.error('Nepodařilo se změnit stav prodejny');
      return { success: false, error: error.message };
    }

    set((state) => ({
      stores: state.stores.map((s) =>
        s.id === id ? { ...s, active: newActive } : s
      ),
    }));
    return { success: true };
  },

  deleteStore: async (id) => {
    const check = get().canDeleteStore(id);
    if (!check.canDelete) {
      return { success: false, error: check.reason };
    }

    const supabase = createClient();
    const { error } = await supabase.from('prodejny').delete().eq('id', id);
    if (error) {
      return { success: false, error: error.message };
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
}));
