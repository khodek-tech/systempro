'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { FeedConfig, FeedLog } from '@/shared/types';
import {
  mapDbToFeedConfig,
  mapFeedConfigToDb,
  mapDbToFeedLog,
  mapFeedLogToDb,
} from '@/lib/supabase/mappers';

// =============================================================================
// TYPES
// =============================================================================

interface EshopFeedState {
  // Data
  feedConfigs: FeedConfig[];
  feedLogs: FeedLog[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // Feed config UI
  feedSearchQuery: string;
  isFeedFormOpen: boolean;
  editingFeedId: number | null;

  // Import UI
  isImportModalOpen: boolean;
  importingFeedId: number | null;

  // Log detail UI
  isLogDetailOpen: boolean;
  viewingLogId: number | null;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopFeedActions {
  // Fetch
  fetchFeedData: () => Promise<void>;

  // Feed config CRUD
  createFeedConfig: (data: Omit<FeedConfig, 'id' | 'createdAt'>) => Promise<{ success: boolean; feedId?: number; error?: string }>;
  updateFeedConfig: (id: number, updates: Partial<FeedConfig>) => Promise<{ success: boolean; error?: string }>;
  deleteFeedConfig: (id: number) => Promise<{ success: boolean; error?: string }>;

  // Feed log
  createFeedLog: (data: Omit<FeedLog, 'id'>) => Promise<{ success: boolean; logId?: number; error?: string }>;

  // UI
  setFeedSearch: (query: string) => void;
  openFeedForm: (id?: number) => void;
  closeFeedForm: () => void;
  openImportModal: (feedId: number) => void;
  closeImportModal: () => void;
  openLogDetail: (logId: number) => void;
  closeLogDetail: () => void;

  // Getters
  getFilteredFeedConfigs: () => FeedConfig[];
  getLogsForFeed: (feedId: number) => FeedLog[];

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopFeedStore = create<EshopFeedState & EshopFeedActions>()((set, get) => ({
  // Initial state
  feedConfigs: [],
  feedLogs: [],
  _loaded: false,
  _loading: false,
  feedSearchQuery: '',
  isFeedFormOpen: false,
  editingFeedId: null,
  isImportModalOpen: false,
  importingFeedId: null,
  isLogDetailOpen: false,
  viewingLogId: null,
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchFeedData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [configsRes, logsRes] = await Promise.all([
      supabase.from('feed_konfigurace').select('*').order('id', { ascending: false }),
      supabase.from('feed_log').select('*').order('spusteno', { ascending: false }).limit(200),
    ]);

    if (configsRes.error) {
      logger.error('Failed to fetch feed data');
      set({ _loading: false });
      return;
    }

    set({
      feedConfigs: configsRes.data?.map(mapDbToFeedConfig) ?? [],
      feedLogs: logsRes.data?.map(mapDbToFeedLog) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // FEED CONFIG CRUD
  // ===========================================================================

  createFeedConfig: async (data) => {
    const supabase = createClient();
    const dbData = mapFeedConfigToDb(data);

    const { data: inserted, error } = await supabase
      .from('feed_konfigurace')
      .insert(dbData)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create feed config', error);
      toast.error('Nepodařilo se vytvořit feed konfiguraci');
      return { success: false, error: error.message };
    }

    const mapped = mapDbToFeedConfig(inserted);
    set((s) => ({ feedConfigs: [mapped, ...s.feedConfigs] }));
    toast.success('Feed konfigurace vytvořena');
    return { success: true, feedId: mapped.id };
  },

  updateFeedConfig: async (id, updates) => {
    const supabase = createClient();
    const dbData = mapFeedConfigToDb(updates);

    const { error } = await supabase
      .from('feed_konfigurace')
      .update(dbData)
      .eq('id', id);

    if (error) {
      logger.error('Failed to update feed config', error);
      toast.error('Nepodařilo se aktualizovat feed konfiguraci');
      return { success: false, error: error.message };
    }

    set((s) => ({
      feedConfigs: s.feedConfigs.map((fc) =>
        fc.id === id ? { ...fc, ...updates } : fc
      ),
    }));
    toast.success('Feed konfigurace aktualizována');
    return { success: true };
  },

  deleteFeedConfig: async (id) => {
    const supabase = createClient();

    const { error } = await supabase
      .from('feed_konfigurace')
      .delete()
      .eq('id', id);

    if (error) {
      logger.error('Failed to delete feed config', error);
      toast.error('Nepodařilo se smazat feed konfiguraci');
      return { success: false, error: error.message };
    }

    set((s) => ({
      feedConfigs: s.feedConfigs.filter((fc) => fc.id !== id),
      feedLogs: s.feedLogs.filter((fl) => fl.feedId !== id),
    }));
    toast.success('Feed konfigurace smazána');
    return { success: true };
  },

  // ===========================================================================
  // FEED LOG
  // ===========================================================================

  createFeedLog: async (data) => {
    const supabase = createClient();
    const dbData = mapFeedLogToDb(data);

    const { data: inserted, error } = await supabase
      .from('feed_log')
      .insert(dbData)
      .select('*')
      .single();

    if (error) {
      logger.error('Failed to create feed log', error);
      return { success: false, error: error.message };
    }

    const mapped = mapDbToFeedLog(inserted);
    set((s) => ({ feedLogs: [mapped, ...s.feedLogs] }));
    return { success: true, logId: mapped.id };
  },

  // ===========================================================================
  // UI
  // ===========================================================================

  setFeedSearch: (query) => set({ feedSearchQuery: query }),

  openFeedForm: (id) => set({
    isFeedFormOpen: true,
    editingFeedId: id ?? null,
  }),

  closeFeedForm: () => set({
    isFeedFormOpen: false,
    editingFeedId: null,
  }),

  openImportModal: (feedId) => set({
    isImportModalOpen: true,
    importingFeedId: feedId,
  }),

  closeImportModal: () => set({
    isImportModalOpen: false,
    importingFeedId: null,
  }),

  openLogDetail: (logId) => set({
    isLogDetailOpen: true,
    viewingLogId: logId,
  }),

  closeLogDetail: () => set({
    isLogDetailOpen: false,
    viewingLogId: null,
  }),

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getFilteredFeedConfigs: () => {
    const { feedConfigs, feedSearchQuery } = get();
    if (!feedSearchQuery.trim()) return feedConfigs;
    const q = feedSearchQuery.toLowerCase();
    return feedConfigs.filter((fc) =>
      fc.name.toLowerCase().includes(q)
    );
  },

  getLogsForFeed: (feedId) => {
    return get().feedLogs.filter((fl) => fl.feedId === feedId);
  },

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    const existing = get()._realtimeChannel;
    if (existing) return;

    const supabase = createClient();
    const channel = supabase
      .channel('eshop-feed-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_konfigurace' }, () => {
        get().fetchFeedData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'feed_log' }, () => {
        get().fetchFeedData();
      })
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    const channel = get()._realtimeChannel;
    if (channel) {
      const supabase = createClient();
      supabase.removeChannel(channel);
      set({ _realtimeChannel: null });
    }
  },
}));
