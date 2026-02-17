import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { MotivationProduct, MotivationSettings } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToMotivationSettings, mapMotivationSettingsToDb } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

interface MotivationState {
  products: MotivationProduct[];
  settings: MotivationSettings | null;
  pendingChanges: Map<string, boolean>;
  _loaded: boolean;
  _loading: boolean;
  _saving: boolean;
  _realtimeChannel: RealtimeChannel | null;
}

interface MotivationActions {
  fetchSettings: () => Promise<void>;
  fetchProducts: () => Promise<void>;
  toggleProduct: (kod: string) => void;
  markAllFiltered: (kods: string[], value: boolean) => void;
  saveChanges: (userId: string) => Promise<void>;
  saveSettings: (settings: Partial<MotivationSettings>) => Promise<void>;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const useMotivationStore = create<MotivationState & MotivationActions>((set, get) => ({
  products: [],
  settings: null,
  pendingChanges: new Map(),
  _loaded: false,
  _loading: false,
  _saving: false,
  _realtimeChannel: null,

  fetchSettings: async () => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from('motivace_nastaveni')
      .select('*')
      .eq('id', 1)
      .single();

    if (!error && data) {
      set({ settings: mapDbToMotivationSettings(data) });
    } else {
      logger.error('Failed to fetch motivation settings');
    }
  },

  fetchProducts: async () => {
    const { settings } = get();
    if (!settings?.warehouseId) {
      set({ products: [], _loaded: true, _loading: false });
      return;
    }

    set({ _loading: true });
    const supabase = createClient();
    const PAGE_SIZE = 1000;

    // Paginated fetch to get all rows (Supabase default limit is 1000)
    /* eslint-disable @typescript-eslint/no-explicit-any */
    async function fetchAllPages(buildQuery: () => any): Promise<{ data: any[]; error: boolean }> {
      const allRows: any[] = [];
      let offset = 0;
      while (true) {
        const { data, error } = await buildQuery().range(offset, offset + PAGE_SIZE - 1);
        if (error) return { data: [], error: true };
        if (!data || data.length === 0) break;
        allRows.push(...data);
        if (data.length < PAGE_SIZE) break;
        offset += PAGE_SIZE;
      }
      return { data: allRows, error: false };
    }
    /* eslint-enable @typescript-eslint/no-explicit-any */

    // Fetch products from pohoda_zasoby for the selected warehouse
    const { data: zasoby, error: zasobyError } = await fetchAllPages(
      () => supabase.from('pohoda_zasoby').select('kod, nazev, ean, prodejni_cena').eq('cleneni_skladu_nazev', settings.warehouseId!)
    );

    if (zasobyError) {
      logger.error('Failed to fetch pohoda_zasoby');
      set({ _loading: false });
      return;
    }

    // Fetch motivation flags
    const { data: motivace, error: motivaceError } = await fetchAllPages(
      () => supabase.from('motivace_produkty').select('kod, motivace, zmenil, zmeneno')
    );

    if (motivaceError) {
      logger.error('Failed to fetch motivace_produkty');
      set({ _loading: false });
      return;
    }

    const motivaceMap = new Map(
      motivace.map((m) => [
        m.kod,
        { motivation: m.motivace, changedBy: m.zmenil, changedAt: m.zmeneno },
      ])
    );

    const products: MotivationProduct[] = zasoby.map((z) => {
      const m = motivaceMap.get(z.kod);
      return {
        kod: z.kod,
        nazev: z.nazev,
        ean: z.ean ?? null,
        prodejniCena: z.prodejni_cena ?? 0,
        motivation: m?.motivation ?? false,
        changedBy: m?.changedBy ?? null,
        changedAt: m?.changedAt ?? null,
      };
    });

    set({ products, pendingChanges: new Map(), _loaded: true, _loading: false });
  },

  toggleProduct: (kod: string) => {
    const { products, pendingChanges } = get();
    const product = products.find((p) => p.kod === kod);
    if (!product) return;

    const newValue = !product.motivation;
    const newPending = new Map(pendingChanges);
    newPending.set(kod, newValue);

    set({
      products: products.map((p) =>
        p.kod === kod ? { ...p, motivation: newValue } : p
      ),
      pendingChanges: newPending,
    });
  },

  markAllFiltered: (kods: string[], value: boolean) => {
    const { products, pendingChanges } = get();
    const kodSet = new Set(kods);
    const newPending = new Map(pendingChanges);

    const newProducts = products.map((p) => {
      if (kodSet.has(p.kod) && p.motivation !== value) {
        newPending.set(p.kod, value);
        return { ...p, motivation: value };
      }
      return p;
    });

    set({ products: newProducts, pendingChanges: newPending });
  },

  saveChanges: async (userId: string) => {
    const { pendingChanges } = get();
    if (pendingChanges.size === 0) return;

    set({ _saving: true });
    const supabase = createClient();
    const now = new Date().toISOString();

    const rows = Array.from(pendingChanges.entries()).map(([kod, motivace]) => ({
      kod,
      motivace,
      zmenil: userId,
      zmeneno: now,
    }));

    const { error } = await supabase
      .from('motivace_produkty')
      .upsert(rows, { onConflict: 'kod' });

    if (error) {
      logger.error('Failed to save motivation products');
      toast.error('Nepodařilo se uložit změny.');
      set({ _saving: false });
      return;
    }

    set({ pendingChanges: new Map(), _saving: false });
    toast.success(`Uloženo ${rows.length} změn.`);
  },

  saveSettings: async (settings: Partial<MotivationSettings>) => {
    const supabase = createClient();
    const dbData = mapMotivationSettingsToDb(settings);

    const { error } = await supabase
      .from('motivace_nastaveni')
      .upsert(dbData, { onConflict: 'id' });

    if (error) {
      logger.error('Failed to save motivation settings');
      toast.error('Nepodařilo se uložit nastavení.');
      return;
    }

    set((state) => ({
      settings: state.settings
        ? { ...state.settings, ...settings, updatedAt: new Date().toISOString() }
        : null,
    }));
    toast.success('Nastavení motivace uloženo.');
  },

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('motivation-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motivace_nastaveni',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            set({ settings: mapDbToMotivationSettings(payload.new) });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'motivace_produkty',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const { products } = get();
          if (products.length === 0) return;

          if (payload.eventType === 'INSERT' || payload.eventType === 'UPDATE') {
            const kod = payload.new.kod;
            const motivation = payload.new.motivace ?? false;
            const changedBy = payload.new.zmenil ?? null;
            const changedAt = payload.new.zmeneno ?? null;
            set({
              products: products.map((p) =>
                p.kod === kod ? { ...p, motivation, changedBy, changedAt } : p
              ),
            });
          } else if (payload.eventType === 'DELETE') {
            const kod = payload.old?.kod;
            if (kod) {
              set({
                products: products.map((p) =>
                  p.kod === kod ? { ...p, motivation: false, changedBy: null, changedAt: null } : p
                ),
              });
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[motivation-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
