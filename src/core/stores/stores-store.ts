import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { Store } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToStore, mapStoreToDb } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { useUsersStore } from './users-store';

interface StoresState {
  stores: Store[];
  _loaded: boolean;
  _loading: boolean;
  _realtimeChannel: RealtimeChannel | null;
}

interface StoresActions {
  // Fetch
  fetchStores: () => Promise<void>;

  // CRUD
  addStore: (store: Omit<Store, 'id'>) => Promise<{ success: boolean; error?: string }>;
  updateStore: (id: string, updates: Partial<Omit<Store, 'id'>>) => Promise<{ success: boolean; error?: string }>;
  toggleStoreActive: (id: string) => Promise<{ success: boolean; error?: string }>;
  deleteStore: (id: string) => Promise<{ success: boolean; error?: string }>;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;

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
  _realtimeChannel: null,

  // Fetch
  fetchStores: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('prodejny').select('*');
    if (!error && data) {
      set({ stores: data.map(mapDbToStore), _loaded: true, _loading: false });
    } else {
      logger.error('Failed to fetch stores');
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
      logger.error('Failed to add store');
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
      logger.error('Failed to update store');
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
      logger.error('Failed to toggle store active');
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

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('stores-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'prodejny',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newStore = mapDbToStore(payload.new);
            const exists = get().stores.some((s) => s.id === newStore.id);
            if (!exists) {
              set({ stores: [...get().stores, newStore] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToStore(payload.new);
            set({
              stores: get().stores.map((s) => (s.id === updated.id ? updated : s)),
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              set({ stores: get().stores.filter((s) => s.id !== oldId) });
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[stores-realtime] ${status}:`, err);
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchStores();
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
