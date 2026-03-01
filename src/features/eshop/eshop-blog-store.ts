'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type { BlogPost, BlogPostStatus, AiStatus, AiGeneratedBlogTexts, AiUsage } from '@/shared/types';
import { mapDbToBlogPost, mapBlogPostToDb } from '@/lib/supabase/mappers';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';

// =============================================================================
// TYPES
// =============================================================================

type StatusFilter = 'all' | BlogPostStatus;

interface EshopBlogState {
  // Data
  blogPosts: BlogPost[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // View
  blogViewMode: 'card' | 'view';

  // UI state
  selectedShopId: number | null;
  searchQuery: string;
  statusFilter: StatusFilter;
  isFormOpen: boolean;
  editingPostId: number | null;
  isPreviewOpen: boolean;
  previewPostId: number | null;

  // AI
  aiGenerating: boolean;
  isAiBlogPreviewOpen: boolean;
  aiBlogPreviewData: AiGeneratedBlogTexts | null;
  aiBlogPreviewPostId: number | null;
  aiBlogPreviewUsage: AiUsage | null;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopBlogActions {
  // Fetch
  fetchBlogData: () => Promise<void>;

  // View
  openBlogView: () => void;
  closeBlogView: () => void;

  // UI
  selectShop: (shopId: number | null) => void;
  setSearchQuery: (query: string) => void;
  setStatusFilter: (filter: StatusFilter) => void;
  openForm: (postId?: number) => void;
  closeForm: () => void;
  openPreview: (postId: number) => void;
  closePreview: () => void;

  // CRUD
  createPost: (data: Omit<BlogPost, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; postId?: number; error?: string }>;
  updatePost: (postId: number, updates: Partial<BlogPost>) => Promise<{ success: boolean; error?: string }>;
  deletePost: (postId: number) => Promise<{ success: boolean; error?: string }>;
  publishPost: (postId: number) => Promise<{ success: boolean; error?: string }>;
  unpublishPost: (postId: number) => Promise<{ success: boolean; error?: string }>;
  schedulePost: (postId: number, publishAt: string) => Promise<{ success: boolean; error?: string }>;

  // Image upload
  uploadImage: (file: File, postId?: number) => Promise<{ success: boolean; url?: string; error?: string }>;

  // AI
  generateBlogAiText: (postId: number) => Promise<{ success: boolean; data?: AiGeneratedBlogTexts; usage?: AiUsage; error?: string }>;
  openAiBlogPreview: (postId: number, data: AiGeneratedBlogTexts, usage?: AiUsage) => void;
  closeAiBlogPreview: () => void;

  // Getters
  getPostById: (id: number) => BlogPost | undefined;
  getFilteredPosts: () => BlogPost[];
  getPostsForShop: (shopId: number) => BlogPost[];
  getPostCount: () => number;
  getAllTags: () => string[];

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopBlogStore = create<EshopBlogState & EshopBlogActions>()((set, get) => ({
  // Initial state
  blogPosts: [],
  _loaded: false,
  _loading: false,
  blogViewMode: 'card',
  selectedShopId: null,
  searchQuery: '',
  statusFilter: 'all',
  isFormOpen: false,
  editingPostId: null,
  isPreviewOpen: false,
  previewPostId: null,
  aiGenerating: false,
  isAiBlogPreviewOpen: false,
  aiBlogPreviewData: null,
  aiBlogPreviewPostId: null,
  aiBlogPreviewUsage: null,
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchBlogData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const { data, error } = await supabase
      .from('blog_clanky')
      .select('*')
      .order('vytvoreno', { ascending: false });

    if (error) {
      logger.error('Failed to fetch blog data');
      set({ _loading: false });
      return;
    }

    set({
      blogPosts: data?.map(mapDbToBlogPost) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // VIEW
  // ===========================================================================

  openBlogView: () => set({ blogViewMode: 'view' }),
  closeBlogView: () => set({ blogViewMode: 'card' }),

  // ===========================================================================
  // UI
  // ===========================================================================

  selectShop: (shopId) => set({ selectedShopId: shopId }),
  setSearchQuery: (query) => set({ searchQuery: query }),
  setStatusFilter: (filter) => set({ statusFilter: filter }),
  openForm: (postId) => set({ isFormOpen: true, editingPostId: postId ?? null }),
  closeForm: () => set({ isFormOpen: false, editingPostId: null }),
  openPreview: (postId) => set({ isPreviewOpen: true, previewPostId: postId }),
  closePreview: () => set({ isPreviewOpen: false, previewPostId: null }),

  // ===========================================================================
  // CRUD
  // ===========================================================================

  createPost: async (data) => {
    const slug = data.slug || generateSlug(data.title);
    const dbData = mapBlogPostToDb({ ...data, slug });
    delete dbData.id;
    delete dbData.vytvoreno;
    delete dbData.aktualizovano;

    const supabase = createClient();
    const { data: inserted, error } = await supabase
      .from('blog_clanky')
      .insert(dbData)
      .select('*')
      .single();

    if (error || !inserted) {
      const isDuplicate = error?.code === '23505';
      logger.error('Failed to create blog post');
      toast.error(isDuplicate ? 'Článek s tímto slugem již existuje' : 'Nepodařilo se vytvořit článek');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }

    const post = mapDbToBlogPost(inserted);
    set((s) => ({
      blogPosts: [post, ...s.blogPosts],
      isFormOpen: false,
      editingPostId: null,
    }));
    toast.success('Článek vytvořen');
    return { success: true, postId: post.id };
  },

  updatePost: async (postId, updates) => {
    if (updates.title && !updates.slug) {
      updates.slug = generateSlug(updates.title);
    }

    const dbData = mapBlogPostToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('blog_clanky').update(dbData).eq('id', postId);

    if (error) {
      const isDuplicate = error.code === '23505';
      logger.error('Failed to update blog post');
      toast.error(isDuplicate ? 'Článek s tímto slugem již existuje' : 'Nepodařilo se uložit článek');
      return { success: false, error: error.message };
    }

    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p,
      ),
      isFormOpen: false,
      editingPostId: null,
    }));
    toast.success('Článek uložen');
    return { success: true };
  },

  deletePost: async (postId) => {
    const supabase = createClient();
    const { error } = await supabase.from('blog_clanky').delete().eq('id', postId);
    if (error) {
      logger.error('Failed to delete blog post');
      toast.error('Nepodařilo se smazat článek');
      return { success: false, error: error.message };
    }
    set((s) => ({
      blogPosts: s.blogPosts.filter((p) => p.id !== postId),
    }));
    toast.success('Článek smazán');
    return { success: true };
  },

  publishPost: async (postId) => {
    const now = new Date().toISOString();
    const post = get().blogPosts.find((p) => p.id === postId);
    const publishedAt = post?.publishedAt ?? now;

    const supabase = createClient();
    const { error } = await supabase
      .from('blog_clanky')
      .update({ stav: 'publikovano', publikovano_v: publishedAt, aktualizovano: now })
      .eq('id', postId);

    if (error) {
      logger.error('Failed to publish blog post');
      toast.error('Nepodařilo se publikovat článek');
      return { success: false, error: error.message };
    }

    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, status: 'publikovano' as const, publishedAt, updatedAt: now } : p,
      ),
    }));
    toast.success('Článek publikován');
    return { success: true };
  },

  unpublishPost: async (postId) => {
    const now = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase
      .from('blog_clanky')
      .update({ stav: 'koncept', aktualizovano: now })
      .eq('id', postId);

    if (error) {
      logger.error('Failed to unpublish blog post');
      toast.error('Nepodařilo se zrušit publikování');
      return { success: false, error: error.message };
    }

    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, status: 'koncept' as const, updatedAt: now } : p,
      ),
    }));
    toast.success('Článek vrácen do konceptu');
    return { success: true };
  },

  schedulePost: async (postId, publishAt) => {
    const now = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase
      .from('blog_clanky')
      .update({ stav: 'planovany', publikovano_v: publishAt, aktualizovano: now })
      .eq('id', postId);

    if (error) {
      logger.error('Failed to schedule blog post');
      toast.error('Nepodařilo se naplánovat článek');
      return { success: false, error: error.message };
    }

    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, status: 'planovany' as const, publishedAt: publishAt, updatedAt: now } : p,
      ),
    }));
    toast.success('Článek naplánován');
    return { success: true };
  },

  // ===========================================================================
  // IMAGE UPLOAD
  // ===========================================================================

  uploadImage: async (file, postId) => {
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const folder = postId ? `blog/${postId}` : 'blog/temp';
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('eshop-images').upload(path, file);
    if (uploadError) {
      logger.error('Failed to upload blog image');
      toast.error('Nepodařilo se nahrát obrázek');
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from('eshop-images').getPublicUrl(path);
    return { success: true, url: urlData.publicUrl };
  },

  // ===========================================================================
  // AI
  // ===========================================================================

  generateBlogAiText: async (postId) => {
    const post = get().blogPosts.find((p) => p.id === postId);
    if (!post) return { success: false, error: 'Článek nenalezen' };

    set({ aiGenerating: true });

    // Optimistic: set status to 'generuje'
    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, aiStatus: 'generuje' as AiStatus } : p
      ),
    }));

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('generate-ai-text', {
      body: { type: 'blog', targetId: postId, shopId: post.shopId },
    });

    if (error || !data?.success) {
      set((s) => ({
        blogPosts: s.blogPosts.map((p) =>
          p.id === postId ? { ...p, aiStatus: 'ceka' as AiStatus } : p
        ),
        aiGenerating: false,
      }));
      const errMsg = data?.error || error?.message || 'AI generování selhalo';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }

    set((s) => ({
      blogPosts: s.blogPosts.map((p) =>
        p.id === postId ? { ...p, aiStatus: 'vygenerovano' as AiStatus } : p
      ),
      aiGenerating: false,
    }));

    return { success: true, data: data.generated, usage: data.usage };
  },

  openAiBlogPreview: (postId, data, usage) => {
    set({ isAiBlogPreviewOpen: true, aiBlogPreviewData: data, aiBlogPreviewPostId: postId, aiBlogPreviewUsage: usage ?? null });
  },

  closeAiBlogPreview: () => {
    set({ isAiBlogPreviewOpen: false, aiBlogPreviewData: null, aiBlogPreviewPostId: null, aiBlogPreviewUsage: null });
  },

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getPostById: (id) => get().blogPosts.find((p) => p.id === id),

  getFilteredPosts: () => {
    const { blogPosts, selectedShopId, searchQuery, statusFilter } = get();
    let filtered = blogPosts;

    if (selectedShopId) {
      filtered = filtered.filter((p) => p.shopId === selectedShopId);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter((p) => p.status === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.title.toLowerCase().includes(q) ||
          p.shortDescription?.toLowerCase().includes(q) ||
          p.tags.some((t) => t.toLowerCase().includes(q)),
      );
    }

    return filtered;
  },

  getPostsForShop: (shopId) => get().blogPosts.filter((p) => p.shopId === shopId),

  getPostCount: () => get().blogPosts.length,

  getAllTags: () => {
    const tags = new Set<string>();
    for (const post of get().blogPosts) {
      for (const tag of post.tags) {
        tags.add(tag);
      }
    }
    return [...tags].sort((a, b) => a.localeCompare(b, 'cs'));
  },

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    const supabase = createClient();

    const channel = supabase
      .channel('eshop-blog-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'blog_clanky' }, () => {
        get().fetchBlogData();
      })
      .subscribe((status, err) => {
        if (err) logger.error(`[eshop-blog-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
