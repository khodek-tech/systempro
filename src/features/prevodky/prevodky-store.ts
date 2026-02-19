import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { Prevodka, PrevodkaStav } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import {
  mapDbToPrevodka,
  mapDbToPrevodkaPolozka,
} from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';

export interface GenerateAssignment {
  store: string;
  userId: string;
}

interface PrevodkyState {
  prevodky: Prevodka[];
  _loaded: boolean;
  _loading: boolean;

  // Generate flow
  isGenerating: boolean;
  generateProgress: string | null;
  generateError: string | null;

  // Picking flow
  pickingPrevodkaId: string | null;

  // Admin detail
  selectedPrevodkaId: string | null;

  // Filter
  stavFilter: PrevodkaStav | 'aktivni' | 'all';

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface PrevodkyActions {
  // Fetch
  fetchPrevodky: () => Promise<void>;

  // Generate
  generatePrevodky: (assignments: GenerateAssignment[]) => Promise<{ success: boolean; error?: string }>;

  // State transitions
  startPicking: (prevodkaId: string) => Promise<{ success: boolean; error?: string }>;
  confirmItem: (prevodkaId: string, polozkaId: string, skutecneMnozstvi: number) => Promise<{ success: boolean; error?: string }>;
  finishPicking: (prevodkaId: string, poznamka?: string) => Promise<{ success: boolean; error?: string }>;
  markAsSent: (prevodkaId: string) => Promise<{ success: boolean; error?: string }>;
  cancelPrevodka: (prevodkaId: string) => Promise<{ success: boolean; error?: string }>;

  // UI
  openPicking: (prevodkaId: string) => void;
  closePicking: () => void;
  openDetail: (prevodkaId: string) => void;
  closeDetail: () => void;
  setStavFilter: (filter: PrevodkaStav | 'aktivni' | 'all') => void;

  // Getters
  getPrevodkaById: (id: string) => Prevodka | undefined;
  getPrevodkaByTaskId: (taskId: string) => Prevodka | undefined;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

export const usePrevodkyStore = create<PrevodkyState & PrevodkyActions>()((set, get) => ({
  // Initial state
  prevodky: [],
  _loaded: false,
  _loading: false,
  isGenerating: false,
  generateProgress: null,
  generateError: null,
  pickingPrevodkaId: null,
  selectedPrevodkaId: null,
  stavFilter: 'aktivni',
  _realtimeChannel: null,

  // ---------------------------------------------------------------------------
  // Fetch
  // ---------------------------------------------------------------------------
  fetchPrevodky: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const { data: rows, error } = await supabase
      .from('prevodky')
      .select('*, prevodky_polozky(*)')
      .order('vytvoreno', { ascending: false });

    if (error) {
      logger.error('[prevodky] fetchPrevodky failed:', error);
      set({ _loading: false });
      return;
    }

    const prevodky = (rows ?? []).map((row) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const polozkyRows = (row as any).prevodky_polozky ?? [];
      const polozky = polozkyRows
        .map(mapDbToPrevodkaPolozka)
        .sort((a: { poradi: number }, b: { poradi: number }) => a.poradi - b.poradi);
      return mapDbToPrevodka(row, polozky);
    });

    set({ prevodky, _loaded: true, _loading: false });
  },

  // ---------------------------------------------------------------------------
  // Generate
  // ---------------------------------------------------------------------------
  generatePrevodky: async (assignments) => {
    set({ isGenerating: true, generateProgress: 'Generuji převodky...', generateError: null });

    try {
      const response = await fetch('/api/automatizace/prevodky/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ assignments }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Chyba ${response.status}`);
      }

      set({ generateProgress: 'Načítám data...' });

      // Refetch to get complete data
      await get().fetchPrevodky();

      set({ generateProgress: null, generateError: null });
      toast.success(`Vytvořeno ${data.count} převodek`);
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Neznámá chyba';
      set({ generateError: msg, generateProgress: null });
      toast.error(`Generování selhalo: ${msg}`);
      return { success: false, error: msg };
    } finally {
      set({ isGenerating: false });
    }
  },

  // ---------------------------------------------------------------------------
  // State transitions
  // ---------------------------------------------------------------------------
  startPicking: async (prevodkaId) => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('prevodky')
      .update({ stav: 'picking', zahajeno: now })
      .eq('id', prevodkaId)
      .eq('stav', 'nova');

    if (error) {
      logger.error('[prevodky] startPicking failed:', error);
      toast.error('Nepodařilo se zahájit picking');
      return { success: false, error: error.message };
    }

    set({
      prevodky: get().prevodky.map((p) =>
        p.id === prevodkaId ? { ...p, stav: 'picking' as PrevodkaStav, zahajeno: now } : p
      ),
    });

    return { success: true };
  },

  confirmItem: async (prevodkaId, polozkaId, skutecneMnozstvi) => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('prevodky_polozky')
      .update({
        skutecne_mnozstvi: skutecneMnozstvi,
        vychystano: true,
        cas_vychystani: now,
      })
      .eq('id', polozkaId);

    if (error) {
      logger.error('[prevodky] confirmItem failed:', error);
      toast.error('Nepodařilo se potvrdit položku');
      return { success: false, error: error.message };
    }

    set({
      prevodky: get().prevodky.map((p) => {
        if (p.id !== prevodkaId) return p;
        return {
          ...p,
          polozky: p.polozky.map((item) =>
            item.id === polozkaId
              ? { ...item, skutecneMnozstvi: skutecneMnozstvi, vychystano: true, casVychystani: now }
              : item
          ),
        };
      }),
    });

    return { success: true };
  },

  finishPicking: async (prevodkaId, poznamka?) => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const updateData: Record<string, unknown> = {
      stav: 'vychystano',
      vychystano: now,
    };
    if (poznamka) {
      updateData.poznamka = poznamka;
    }

    const { error } = await supabase
      .from('prevodky')
      .update(updateData)
      .eq('id', prevodkaId);

    if (error) {
      logger.error('[prevodky] finishPicking failed:', error);
      toast.error('Nepodařilo se dokončit picking');
      return { success: false, error: error.message };
    }

    set({
      prevodky: get().prevodky.map((p) =>
        p.id === prevodkaId
          ? { ...p, stav: 'vychystano' as PrevodkaStav, vychystano: now, poznamka: poznamka ?? p.poznamka }
          : p
      ),
      pickingPrevodkaId: null,
    });

    toast.success('Picking dokončen');
    return { success: true };
  },

  markAsSent: async (prevodkaId) => {
    const supabase = createClient();
    const now = new Date().toISOString();

    const { error } = await supabase
      .from('prevodky')
      .update({ stav: 'odeslano', odeslano: now })
      .eq('id', prevodkaId);

    if (error) {
      logger.error('[prevodky] markAsSent failed:', error);
      toast.error('Nepodařilo se označit jako odesláno');
      return { success: false, error: error.message };
    }

    set({
      prevodky: get().prevodky.map((p) =>
        p.id === prevodkaId ? { ...p, stav: 'odeslano' as PrevodkaStav, odeslano: now } : p
      ),
    });

    toast.success('Převodka označena jako odeslaná');
    return { success: true };
  },

  cancelPrevodka: async (prevodkaId) => {
    try {
      const response = await fetch(`/api/automatizace/prevodky/${prevodkaId}/cancel`, {
        method: 'POST',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || `Chyba ${response.status}`);
      }

      set({
        prevodky: get().prevodky.map((p) =>
          p.id === prevodkaId
            ? { ...p, stav: 'zrusena' as PrevodkaStav, zruseno: new Date().toISOString() }
            : p
        ),
      });

      toast.success('Převodka zrušena');
      return { success: true };
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Zrušení selhalo: ${msg}`);
      return { success: false, error: msg };
    }
  },

  // ---------------------------------------------------------------------------
  // UI
  // ---------------------------------------------------------------------------
  openPicking: (prevodkaId) => set({ pickingPrevodkaId: prevodkaId }),
  closePicking: () => set({ pickingPrevodkaId: null }),
  openDetail: (prevodkaId) => set({ selectedPrevodkaId: prevodkaId }),
  closeDetail: () => set({ selectedPrevodkaId: null }),
  setStavFilter: (filter) => set({ stavFilter: filter }),

  // ---------------------------------------------------------------------------
  // Getters
  // ---------------------------------------------------------------------------
  getPrevodkaById: (id) => get().prevodky.find((p) => p.id === id),
  getPrevodkaByTaskId: (taskId) => get().prevodky.find((p) => p.ukolId === taskId),

  // ---------------------------------------------------------------------------
  // Realtime
  // ---------------------------------------------------------------------------
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('prevodky-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prevodky' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newPrevodka = mapDbToPrevodka(payload.new, []);
            const exists = get().prevodky.some((p) => p.id === newPrevodka.id);
            if (!exists) {
              set({ prevodky: [newPrevodka, ...get().prevodky] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const existing = get().prevodky.find((p) => p.id === payload.new.id);
            const updated = mapDbToPrevodka(payload.new, existing?.polozky ?? []);
            set({
              prevodky: get().prevodky.map((p) => (p.id === updated.id ? updated : p)),
            });
          } else if (payload.eventType === 'DELETE') {
            set({ prevodky: get().prevodky.filter((p) => p.id !== payload.old.id) });
          }
        },
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'prevodky_polozky' },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'UPDATE') {
            const updatedItem = mapDbToPrevodkaPolozka(payload.new);
            set({
              prevodky: get().prevodky.map((p) => {
                if (p.id !== updatedItem.prevodkaId) return p;
                return {
                  ...p,
                  polozky: p.polozky.map((item) =>
                    item.id === updatedItem.id ? updatedItem : item,
                  ),
                };
              }),
            });
          } else if (payload.eventType === 'INSERT') {
            const newItem = mapDbToPrevodkaPolozka(payload.new);
            set({
              prevodky: get().prevodky.map((p) => {
                if (p.id !== newItem.prevodkaId) return p;
                const exists = p.polozky.some((item) => item.id === newItem.id);
                if (exists) return p;
                return {
                  ...p,
                  polozky: [...p.polozky, newItem].sort((a, b) => a.poradi - b.poradi),
                };
              }),
            });
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[prevodky-realtime] ${status}:`, err);
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchPrevodky();
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
