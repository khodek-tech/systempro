'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { BlockType, PageBlock } from '@/shared/types';
import { mapDbToBlockType, mapDbToPageBlock, mapPageBlockToDb } from '@/lib/supabase/mappers';

// =============================================================================
// TYPES
// =============================================================================

interface EshopPageBuilderState {
  // Data
  blockTypes: BlockType[];
  pageBlocks: PageBlock[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // View
  pageBuilderViewMode: 'card' | 'view';

  // UI state
  selectedShopId: number | null;
  selectedPage: string;
  isBlockEditorOpen: boolean;
  editingBlockId: number | null;
  isBlockTypePickerOpen: boolean;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopPageBuilderActions {
  // Fetch
  fetchPageBuilderData: () => Promise<void>;

  // View
  openPageBuilderView: () => void;
  closePageBuilderView: () => void;

  // UI
  selectShop: (shopId: number | null) => void;
  selectPage: (page: string) => void;
  openBlockEditor: (blockId?: number) => void;
  closeBlockEditor: () => void;
  openBlockTypePicker: () => void;
  closeBlockTypePicker: () => void;

  // CRUD
  createPageBlock: (data: { shopId: number; page: string; blockTypeId: number; config: Record<string, unknown> }) => Promise<{ success: boolean; blockId?: number; error?: string }>;
  updatePageBlock: (blockId: number, updates: Partial<PageBlock>) => Promise<{ success: boolean; error?: string }>;
  deletePageBlock: (blockId: number) => Promise<{ success: boolean; error?: string }>;
  toggleBlockActive: (blockId: number) => Promise<{ success: boolean; error?: string }>;
  reorderBlocks: (blockIds: number[]) => Promise<{ success: boolean; error?: string }>;
  duplicateBlock: (blockId: number) => Promise<{ success: boolean; blockId?: number; error?: string }>;

  // Getters
  getBlocksForCurrentPage: () => PageBlock[];
  getBlockTypeById: (id: number) => BlockType | undefined;
  getBlockTypeBySlug: (slug: string) => BlockType | undefined;
  getBlockCount: () => number;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopPageBuilderStore = create<EshopPageBuilderState & EshopPageBuilderActions>()((set, get) => ({
  // Initial state
  blockTypes: [],
  pageBlocks: [],
  _loaded: false,
  _loading: false,
  pageBuilderViewMode: 'card',
  selectedShopId: null,
  selectedPage: 'homepage',
  isBlockEditorOpen: false,
  editingBlockId: null,
  isBlockTypePickerOpen: false,
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchPageBuilderData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [typesRes, blocksRes] = await Promise.all([
      supabase.from('bloky_typy').select('*').order('id'),
      supabase.from('stranky_bloky').select('*').order('poradi'),
    ]);

    if (typesRes.error) {
      logger.error('Failed to fetch page builder data');
      set({ _loading: false });
      return;
    }

    set({
      blockTypes: typesRes.data?.map(mapDbToBlockType) ?? [],
      pageBlocks: blocksRes.data?.map(mapDbToPageBlock) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // VIEW
  // ===========================================================================

  openPageBuilderView: () => set({ pageBuilderViewMode: 'view' }),
  closePageBuilderView: () => set({ pageBuilderViewMode: 'card' }),

  // ===========================================================================
  // UI
  // ===========================================================================

  selectShop: (shopId) => set({ selectedShopId: shopId }),
  selectPage: (page) => set({ selectedPage: page }),
  openBlockEditor: (blockId) => set({ isBlockEditorOpen: true, editingBlockId: blockId ?? null }),
  closeBlockEditor: () => set({ isBlockEditorOpen: false, editingBlockId: null }),
  openBlockTypePicker: () => set({ isBlockTypePickerOpen: true }),
  closeBlockTypePicker: () => set({ isBlockTypePickerOpen: false }),

  // ===========================================================================
  // CRUD
  // ===========================================================================

  createPageBlock: async (data) => {
    const { pageBlocks } = get();
    const maxOrder = pageBlocks
      .filter((b) => b.shopId === data.shopId && b.page === data.page)
      .reduce((max, b) => Math.max(max, b.order), -1);

    const dbData = mapPageBlockToDb({
      shopId: data.shopId,
      page: data.page,
      blockTypeId: data.blockTypeId,
      config: data.config,
      order: maxOrder + 1,
      active: true,
    });

    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('stranky_bloky').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create page block');
      toast.error('Nepodařilo se vytvořit blok');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const block = mapDbToPageBlock(inserted);
    set((s) => ({
      pageBlocks: [...s.pageBlocks, block],
      isBlockTypePickerOpen: false,
    }));
    toast.success('Blok vytvořen');
    return { success: true, blockId: block.id };
  },

  updatePageBlock: async (blockId, updates) => {
    const dbData = mapPageBlockToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('stranky_bloky').update(dbData).eq('id', blockId);
    if (error) {
      logger.error('Failed to update page block');
      toast.error('Nepodařilo se uložit blok');
      return { success: false, error: error.message };
    }
    set((s) => ({
      pageBlocks: s.pageBlocks.map((b) =>
        b.id === blockId ? { ...b, ...updates, updatedAt: new Date().toISOString() } : b,
      ),
      isBlockEditorOpen: false,
      editingBlockId: null,
    }));
    toast.success('Blok uložen');
    return { success: true };
  },

  deletePageBlock: async (blockId) => {
    const supabase = createClient();
    const { error } = await supabase.from('stranky_bloky').delete().eq('id', blockId);
    if (error) {
      logger.error('Failed to delete page block');
      toast.error('Nepodařilo se smazat blok');
      return { success: false, error: error.message };
    }
    set((s) => ({
      pageBlocks: s.pageBlocks.filter((b) => b.id !== blockId),
    }));
    toast.success('Blok smazán');
    return { success: true };
  },

  toggleBlockActive: async (blockId) => {
    const block = get().pageBlocks.find((b) => b.id === blockId);
    if (!block) return { success: false, error: 'Blok nenalezen' };

    const newActive = !block.active;
    const supabase = createClient();
    const { error } = await supabase.from('stranky_bloky').update({ aktivni: newActive, aktualizovano: new Date().toISOString() }).eq('id', blockId);
    if (error) {
      logger.error('Failed to toggle block active');
      toast.error('Nepodařilo se změnit stav bloku');
      return { success: false, error: error.message };
    }
    set((s) => ({
      pageBlocks: s.pageBlocks.map((b) =>
        b.id === blockId ? { ...b, active: newActive, updatedAt: new Date().toISOString() } : b,
      ),
    }));
    toast.success(newActive ? 'Blok aktivován' : 'Blok deaktivován');
    return { success: true };
  },

  reorderBlocks: async (blockIds) => {
    const supabase = createClient();
    const updates = blockIds.map((id, index) =>
      supabase.from('stranky_bloky').update({ poradi: index, aktualizovano: new Date().toISOString() }).eq('id', id),
    );
    await Promise.all(updates);
    set((s) => ({
      pageBlocks: s.pageBlocks.map((b) => {
        const idx = blockIds.indexOf(b.id);
        return idx >= 0 ? { ...b, order: idx } : b;
      }),
    }));
    return { success: true };
  },

  duplicateBlock: async (blockId) => {
    const block = get().pageBlocks.find((b) => b.id === blockId);
    if (!block) return { success: false, error: 'Blok nenalezen' };

    const { pageBlocks } = get();
    const maxOrder = pageBlocks
      .filter((b) => b.shopId === block.shopId && b.page === block.page)
      .reduce((max, b) => Math.max(max, b.order), -1);

    const dbData = mapPageBlockToDb({
      shopId: block.shopId,
      page: block.page,
      blockTypeId: block.blockTypeId,
      config: block.config,
      order: maxOrder + 1,
      active: block.active,
    });

    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('stranky_bloky').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to duplicate page block');
      toast.error('Nepodařilo se duplikovat blok');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const newBlock = mapDbToPageBlock(inserted);
    set((s) => ({ pageBlocks: [...s.pageBlocks, newBlock] }));
    toast.success('Blok duplikován');
    return { success: true, blockId: newBlock.id };
  },

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getBlocksForCurrentPage: () => {
    const { pageBlocks, selectedShopId, selectedPage } = get();
    if (!selectedShopId) return [];
    return pageBlocks
      .filter((b) => b.shopId === selectedShopId && b.page === selectedPage)
      .sort((a, b) => a.order - b.order);
  },

  getBlockTypeById: (id) => get().blockTypes.find((t) => t.id === id),

  getBlockTypeBySlug: (slug) => get().blockTypes.find((t) => t.slug === slug),

  getBlockCount: () => get().pageBlocks.length,

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    const supabase = createClient();

    const channel = supabase
      .channel('eshop-page-builder-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stranky_bloky' }, () => {
        get().fetchPageBuilderData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bloky_typy' }, () => {
        get().fetchPageBuilderData();
      })
      .subscribe((status, err) => {
        if (err) logger.error(`[eshop-page-builder-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
