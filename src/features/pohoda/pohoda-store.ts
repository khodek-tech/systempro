import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { mapDbToPohodaCredentials, mapPohodaCredentialsToDb, mapDbToPohodaSyncLog } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import type { PohodaSyncLog } from '@/shared/types';

export interface PohodaCredentials {
  url: string;
  username: string;
  password: string;
  ico: string;
}

export interface PohodaConnectionStatus {
  isConnected: boolean;
  lastCheck: string | null;
  companyName: string | null;
  error: string | null;
}

export interface PohodaSklad {
  id: string;
  ids: string;
  name: string;
  text?: string;
}

interface PohodaState {
  // Credentials (DB-persisted)
  credentials: PohodaCredentials;

  // Loading flags for DB fetch
  _loaded: boolean;
  _loading: boolean;

  // Connection status
  connectionStatus: PohodaConnectionStatus;

  // Data
  sklady: PohodaSklad[];

  // Loading states
  isTestingConnection: boolean;
  isLoadingSklady: boolean;
  isExporting: boolean;
  isUploading: boolean;
  isGenerating: boolean;
  isGeneratingVsechnySklady: boolean;

  // Progress
  generateProgress: string | null;
  generateError: string | null;
  generateVsechnySkladyProgress: string | null;
  generateVsechnySkladyError: string | null;

  // Upload
  lastUploadedFile: string | null;

  // Sync zásoby
  syncZasobyColumns: string[];
  syncZasobySklad: string | null;
  isSyncingZasoby: boolean;
  syncZasobyProgress: string | null;
  syncZasobyLog: PohodaSyncLog[];

  // Navigation
  pohodaView: 'settings' | 'detail';
}

interface PohodaActions {
  fetchPohodaConfig: () => Promise<void>;
  savePohodaConfig: () => Promise<void>;
  setCredentials: (credentials: Partial<PohodaCredentials>) => void;
  setConnectionStatus: (status: Partial<PohodaConnectionStatus>) => void;
  setSklady: (sklady: PohodaSklad[]) => void;
  setIsTestingConnection: (loading: boolean) => void;
  setIsLoadingSklady: (loading: boolean) => void;
  setIsExporting: (loading: boolean) => void;
  setIsUploading: (loading: boolean) => void;
  setIsGenerating: (loading: boolean) => void;
  setGenerateProgress: (progress: string | null) => void;
  setGenerateError: (error: string | null) => void;
  setIsGeneratingVsechnySklady: (loading: boolean) => void;
  setGenerateVsechnySkladyProgress: (progress: string | null) => void;
  setGenerateVsechnySkladyError: (error: string | null) => void;
  setLastUploadedFile: (filename: string | null) => void;
  clearCredentials: () => void;
  setPohodaView: (view: 'settings' | 'detail') => void;
  setSyncZasobyColumns: (cols: string[]) => void;
  setSyncZasobySklad: (sklad: string | null) => void;
  saveSyncZasobyConfig: () => Promise<void>;
  fetchSyncLog: (typ: string) => Promise<void>;
  syncZasoby: () => Promise<void>;
}

const defaultCredentials: PohodaCredentials = {
  url: process.env.NEXT_PUBLIC_POHODA_URL || '',
  username: '',
  password: '',
  ico: '',
};

const defaultConnectionStatus: PohodaConnectionStatus = {
  isConnected: false,
  lastCheck: null,
  companyName: null,
  error: null,
};

export const usePohodaStore = create<PohodaState & PohodaActions>()((set, get) => ({
  // Initial state
  credentials: defaultCredentials,
  _loaded: false,
  _loading: false,
  connectionStatus: defaultConnectionStatus,
  sklady: [],
  isTestingConnection: false,
  isLoadingSklady: false,
  isExporting: false,
  isUploading: false,
  isGenerating: false,
  generateProgress: null,
  generateError: null,
  isGeneratingVsechnySklady: false,
  generateVsechnySkladyProgress: null,
  generateVsechnySkladyError: null,
  lastUploadedFile: null,
  syncZasobyColumns: [],
  syncZasobySklad: null,
  isSyncingZasoby: false,
  syncZasobyProgress: null,
  syncZasobyLog: [],
  pohodaView: 'settings',

  // DB fetch
  fetchPohodaConfig: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data } = await supabase.from('pohoda_konfigurace').select('*').eq('id', 1).single();
    if (data) {
      set({
        credentials: mapDbToPohodaCredentials(data),
        syncZasobyColumns: (data.sync_zasoby_sloupce as string[]) ?? [],
        syncZasobySklad: (data.sync_zasoby_sklad as string) ?? null,
        _loaded: true,
        _loading: false,
      });
    } else {
      set({ _loaded: true, _loading: false });
    }
  },

  // DB save (upsert)
  savePohodaConfig: async () => {
    const { credentials } = get();
    const supabase = createClient();
    const dbData = mapPohodaCredentialsToDb(credentials);
    const { error } = await supabase.from('pohoda_konfigurace').upsert(dbData, { onConflict: 'id' });
    if (error) {
      toast.error('Nepodařilo se uložit Pohoda konfiguraci');
    }
  },

  // Actions
  setCredentials: (credentials) =>
    set((state) => ({
      credentials: { ...state.credentials, ...credentials },
    })),

  setConnectionStatus: (status) =>
    set((state) => ({
      connectionStatus: { ...state.connectionStatus, ...status },
    })),

  setSklady: (sklady) => set({ sklady }),

  setIsTestingConnection: (isTestingConnection) =>
    set({ isTestingConnection }),
  setIsLoadingSklady: (isLoadingSklady) => set({ isLoadingSklady }),
  setIsExporting: (isExporting) => set({ isExporting }),
  setIsUploading: (isUploading) => set({ isUploading }),
  setIsGenerating: (isGenerating) => set({ isGenerating }),
  setGenerateProgress: (generateProgress) => set({ generateProgress }),
  setGenerateError: (generateError) => set({ generateError }),
  setIsGeneratingVsechnySklady: (isGeneratingVsechnySklady) =>
    set({ isGeneratingVsechnySklady }),
  setGenerateVsechnySkladyProgress: (generateVsechnySkladyProgress) =>
    set({ generateVsechnySkladyProgress }),
  setGenerateVsechnySkladyError: (generateVsechnySkladyError) =>
    set({ generateVsechnySkladyError }),
  setLastUploadedFile: (lastUploadedFile) => set({ lastUploadedFile }),

  clearCredentials: () =>
    set({
      credentials: defaultCredentials,
      connectionStatus: defaultConnectionStatus,
      sklady: [],
    }),

  setPohodaView: (pohodaView) => set({ pohodaView }),

  setSyncZasobyColumns: (syncZasobyColumns) => set({ syncZasobyColumns }),
  setSyncZasobySklad: (syncZasobySklad) => set({ syncZasobySklad }),

  saveSyncZasobyConfig: async () => {
    const { syncZasobyColumns, syncZasobySklad } = get();
    const supabase = createClient();
    const { error } = await supabase
      .from('pohoda_konfigurace')
      .update({
        sync_zasoby_sloupce: syncZasobyColumns,
        sync_zasoby_sklad: syncZasobySklad,
        aktualizovano: new Date().toISOString(),
      })
      .eq('id', 1);
    if (error) {
      toast.error('Nepodařilo se uložit nastavení synchronizace');
    }
  },

  fetchSyncLog: async (typ: string) => {
    const supabase = createClient();
    const { data } = await supabase
      .from('pohoda_sync_log')
      .select('*')
      .eq('typ', typ)
      .order('vytvoreno', { ascending: false })
      .limit(5);
    if (data) {
      set({ syncZasobyLog: data.map(mapDbToPohodaSyncLog) });
    }
  },

  syncZasoby: async () => {
    const { credentials, syncZasobyColumns, syncZasobySklad } = get();
    if (syncZasobyColumns.length === 0) {
      toast.error('Vyberte alespon jeden sloupec');
      return;
    }

    set({ isSyncingZasoby: true, syncZasobyProgress: 'Stahování dat z mServeru...' });

    try {
      const response = await fetch('/api/pohoda/sklady/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...credentials,
          skladId: syncZasobySklad,
          columns: syncZasobyColumns,
        }),
      });

      const text = await response.text();
      let data;
      try {
        data = JSON.parse(text);
      } catch {
        throw new Error(text || `Server vrátil chybu ${response.status}`);
      }

      if (data.success) {
        set({ syncZasobyProgress: null });
        toast.success(`Synchronizace dokončena: ${data.pocetZaznamu} záznamů (${data.pocetNovych} nových, ${data.pocetAktualizovanych} aktualizovaných) za ${(data.trvaniMs / 1000).toFixed(1)}s`);
      } else {
        throw new Error(data.error || 'Synchronizace selhala');
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Neznámá chyba';
      toast.error(`Synchronizace selhala: ${msg}`);
      set({ syncZasobyProgress: null });
    } finally {
      set({ isSyncingZasoby: false });
      // Refresh log
      get().fetchSyncLog('zasoby');
    }
  },
}));
