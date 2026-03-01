'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Eshop,
  ShopProduct,
  ShopProductVariant,
  ShopCategory,
  Redirect,
  Product,
  ShopShipping,
  ShopPayment,
  AiStatus,
  AiGeneratedProductTexts,
  AiUsage,
} from '@/shared/types';
import {
  mapDbToEshop,
  mapEshopToDb,
  mapDbToShopProduct,
  mapShopProductToDb,
  mapDbToShopProductVariant,
  mapShopProductVariantToDb,
  mapDbToShopCategory,
  mapShopCategoryToDb,
  mapDbToRedirect,
  mapRedirectToDb,
  mapDbToShopShipping,
  mapShopShippingToDb,
  mapDbToShopPayment,
  mapShopPaymentToDb,
} from '@/lib/supabase/mappers';

// =============================================================================
// TYPES
// =============================================================================

type EshopEshopyTab = 'eshopy' | 'produkty' | 'kategorie' | 'presmerovani' | 'doprava-platby' | 'ai';

interface EshopEshopyState {
  // Data
  eshops: Eshop[];
  shopProducts: ShopProduct[];
  shopProductVariants: ShopProductVariant[];
  shopCategories: ShopCategory[];
  redirects: Redirect[];
  shopShippings: ShopShipping[];
  shopPayments: ShopPayment[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // View
  eshopyViewMode: 'card' | 'view';
  activeTab: EshopEshopyTab;

  // Selected e-shop
  selectedShopId: number | null;

  // E-shopy tab UI
  eshopSearchQuery: string;
  isEshopFormOpen: boolean;
  editingEshopId: number | null;

  // Shop Products tab UI
  shopProductSearchQuery: string;
  isProductPickerOpen: boolean;
  isShopProductDetailOpen: boolean;
  editingShopProductId: number | null;

  // Shop Categories tab UI
  isShopCategoryFormOpen: boolean;
  editingShopCategoryId: number | null;

  // Redirects tab UI
  redirectSearchQuery: string;
  isRedirectFormOpen: boolean;
  editingRedirectId: number | null;

  // Shipping/Payment tab UI
  isShippingFormOpen: boolean;
  editingShippingId: number | null;
  isPaymentFormOpen: boolean;
  editingPaymentId: number | null;

  // AI
  aiGenerating: boolean;
  isAiPreviewOpen: boolean;
  aiPreviewData: AiGeneratedProductTexts | null;
  aiPreviewShopProductId: number | null;
  aiPreviewUsage: AiUsage | null;
  aiBulkProgress: { current: number; total: number; errors: string[] } | null;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopEshopyActions {
  // Fetch
  fetchEshopEshopyData: () => Promise<void>;

  // View
  openEshopyView: () => void;
  closeEshopyView: () => void;
  setActiveTab: (tab: EshopEshopyTab) => void;
  selectShop: (shopId: number | null) => void;

  // E-shop CRUD
  createEshop: (data: Omit<Eshop, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; eshopId?: number; error?: string }>;
  updateEshop: (id: number, updates: Partial<Eshop>) => Promise<{ success: boolean; error?: string }>;
  deleteEshop: (id: number) => Promise<{ success: boolean; error?: string }>;
  setEshopSearch: (query: string) => void;
  openEshopForm: (id?: number) => void;
  closeEshopForm: () => void;

  // Shop Products
  assignProductToShop: (shopId: number, productId: number, price: number) => Promise<{ success: boolean; shopProductId?: number; error?: string }>;
  updateShopProduct: (shopProductId: number, updates: Partial<ShopProduct>) => Promise<{ success: boolean; error?: string }>;
  removeProductFromShop: (shopProductId: number) => Promise<{ success: boolean; error?: string }>;
  bulkAssignProducts: (shopId: number, productIds: number[], defaultPrice: number) => Promise<{ success: boolean; count?: number; error?: string }>;
  setShopProductSearch: (query: string) => void;
  openProductPicker: () => void;
  closeProductPicker: () => void;
  openShopProductDetail: (shopProductId: number) => void;
  closeShopProductDetail: () => void;

  // Shop Product Variants
  upsertShopProductVariant: (shopProductId: number, variantId: number, updates: { priceOverride?: number; active?: boolean }) => Promise<{ success: boolean; error?: string }>;

  // Shop Categories
  assignCategoryToShop: (shopId: number, categoryId: number) => Promise<{ success: boolean; shopCategoryId?: number; error?: string }>;
  updateShopCategory: (shopCategoryId: number, updates: Partial<ShopCategory>) => Promise<{ success: boolean; error?: string }>;
  removeCategoryFromShop: (shopCategoryId: number) => Promise<{ success: boolean; error?: string }>;
  openShopCategoryForm: (shopCategoryId?: number) => void;
  closeShopCategoryForm: () => void;

  // Redirects
  createRedirect: (data: Omit<Redirect, 'id' | 'createdAt'>) => Promise<{ success: boolean; redirectId?: number; error?: string }>;
  updateRedirect: (id: number, updates: Partial<Redirect>) => Promise<{ success: boolean; error?: string }>;
  deleteRedirect: (id: number) => Promise<{ success: boolean; error?: string }>;
  setRedirectSearch: (query: string) => void;
  openRedirectForm: (id?: number) => void;
  closeRedirectForm: () => void;

  // Shipping/Payment CRUD
  createShipping: (data: Partial<ShopShipping>) => Promise<{ success: boolean }>;
  updateShipping: (id: number, updates: Partial<ShopShipping>) => Promise<{ success: boolean }>;
  deleteShipping: (id: number) => Promise<{ success: boolean }>;
  createPayment: (data: Partial<ShopPayment>) => Promise<{ success: boolean }>;
  updatePayment: (id: number, updates: Partial<ShopPayment>) => Promise<{ success: boolean }>;
  deletePayment: (id: number) => Promise<{ success: boolean }>;
  openShippingForm: (id?: number) => void;
  closeShippingForm: () => void;
  openPaymentForm: (id?: number) => void;
  closePaymentForm: () => void;
  getShippingsForShop: (shopId: number) => ShopShipping[];
  getPaymentsForShop: (shopId: number) => ShopPayment[];

  // AI
  generateAiText: (shopProductId: number) => Promise<{ success: boolean; data?: AiGeneratedProductTexts; usage?: AiUsage; error?: string }>;
  bulkGenerateAiText: (shopProductIds: number[]) => Promise<void>;
  applyAiTexts: (shopProductId: number, texts: Partial<AiGeneratedProductTexts>) => Promise<{ success: boolean }>;
  rejectAiTexts: () => void;
  openAiPreview: (shopProductId: number, data: AiGeneratedProductTexts, usage?: AiUsage) => void;
  closeAiPreview: () => void;
  closeBulkProgress: () => void;

  // Getters
  getFilteredEshops: () => Eshop[];
  getShopProductsForShop: (shopId: number) => ShopProduct[];
  getFilteredShopProducts: () => ShopProduct[];
  getShopProductVariantsForShopProduct: (shopProductId: number) => ShopProductVariant[];
  getShopCategoriesForShop: (shopId: number) => ShopCategory[];
  getRedirectsForShop: (shopId: number) => Redirect[];
  getFilteredRedirects: () => Redirect[];
  getUnassignedProducts: (shopId: number, allProducts: Product[]) => Product[];

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopEshopyStore = create<EshopEshopyState & EshopEshopyActions>()((set, get) => ({
  // Initial state
  eshops: [],
  shopProducts: [],
  shopProductVariants: [],
  shopCategories: [],
  redirects: [],
  shopShippings: [],
  shopPayments: [],
  _loaded: false,
  _loading: false,
  eshopyViewMode: 'card',
  activeTab: 'eshopy',
  selectedShopId: null,
  eshopSearchQuery: '',
  isEshopFormOpen: false,
  editingEshopId: null,
  shopProductSearchQuery: '',
  isProductPickerOpen: false,
  isShopProductDetailOpen: false,
  editingShopProductId: null,
  isShopCategoryFormOpen: false,
  editingShopCategoryId: null,
  redirectSearchQuery: '',
  isRedirectFormOpen: false,
  editingRedirectId: null,
  isShippingFormOpen: false,
  editingShippingId: null,
  isPaymentFormOpen: false,
  editingPaymentId: null,
  aiGenerating: false,
  isAiPreviewOpen: false,
  aiPreviewData: null,
  aiPreviewShopProductId: null,
  aiPreviewUsage: null,
  aiBulkProgress: null,
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchEshopEshopyData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [eshopsRes, shopProductsRes, shopVariantsRes, shopCatsRes, redirectsRes, shippingsRes, paymentsRes] = await Promise.all([
      supabase.from('eshopy').select('*'),
      supabase.from('eshop_produkty').select('*'),
      supabase.from('eshop_produkty_varianty').select('*'),
      supabase.from('eshop_kategorie').select('*'),
      supabase.from('presmerovani').select('*'),
      supabase.from('eshop_doprava').select('*').order('poradi'),
      supabase.from('eshop_platby').select('*').order('poradi'),
    ]);

    if (eshopsRes.error) {
      logger.error('Failed to fetch eshop eshopy data');
      set({ _loading: false });
      return;
    }

    set({
      eshops: eshopsRes.data?.map(mapDbToEshop) ?? [],
      shopProducts: shopProductsRes.data?.map(mapDbToShopProduct) ?? [],
      shopProductVariants: shopVariantsRes.data?.map(mapDbToShopProductVariant) ?? [],
      shopCategories: shopCatsRes.data?.map(mapDbToShopCategory) ?? [],
      redirects: redirectsRes.data?.map(mapDbToRedirect) ?? [],
      shopShippings: shippingsRes.data?.map(mapDbToShopShipping) ?? [],
      shopPayments: paymentsRes.data?.map(mapDbToShopPayment) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // VIEW
  // ===========================================================================

  openEshopyView: () => set({ eshopyViewMode: 'view' }),
  closeEshopyView: () => set({ eshopyViewMode: 'card', selectedShopId: null, activeTab: 'eshopy' }),
  setActiveTab: (tab) => set({ activeTab: tab }),
  selectShop: (shopId) => set({ selectedShopId: shopId }),

  // ===========================================================================
  // E-SHOP CRUD
  // ===========================================================================

  createEshop: async (data) => {
    const dbData = mapEshopToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshopy').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create eshop');
      toast.error('Nepodařilo se vytvořit e-shop');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const eshop = mapDbToEshop(inserted);
    set((s) => ({ eshops: [...s.eshops, eshop], isEshopFormOpen: false, editingEshopId: null }));
    toast.success('E-shop vytvořen');
    return { success: true, eshopId: eshop.id };
  },

  updateEshop: async (id, updates) => {
    const dbData = mapEshopToDb({ ...updates, id });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('eshopy').update(dbData).eq('id', id);
    if (error) {
      logger.error('Failed to update eshop');
      toast.error('Nepodařilo se uložit e-shop');
      return { success: false, error: error.message };
    }
    set((s) => ({
      eshops: s.eshops.map((e) => (e.id === id ? { ...e, ...updates, updatedAt: new Date().toISOString() } : e)),
      isEshopFormOpen: false,
      editingEshopId: null,
    }));
    toast.success('E-shop uložen');
    return { success: true };
  },

  deleteEshop: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('eshopy').delete().eq('id', id);
    if (error) {
      logger.error('Failed to delete eshop');
      toast.error('Nepodařilo se smazat e-shop');
      return { success: false, error: error.message };
    }
    set((s) => ({
      eshops: s.eshops.filter((e) => e.id !== id),
      shopProducts: s.shopProducts.filter((sp) => sp.shopId !== id),
      shopCategories: s.shopCategories.filter((sc) => sc.shopId !== id),
      redirects: s.redirects.filter((r) => r.shopId !== id),
      selectedShopId: s.selectedShopId === id ? null : s.selectedShopId,
    }));
    toast.success('E-shop smazán');
    return { success: true };
  },

  setEshopSearch: (query) => set({ eshopSearchQuery: query }),
  openEshopForm: (id) => set({ isEshopFormOpen: true, editingEshopId: id ?? null }),
  closeEshopForm: () => set({ isEshopFormOpen: false, editingEshopId: null }),

  // ===========================================================================
  // SHOP PRODUCTS
  // ===========================================================================

  assignProductToShop: async (shopId, productId, price) => {
    const dbData = mapShopProductToDb({ shopId, productId, price, active: true, aiStatus: 'ceka', order: 0 });
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshop_produkty').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to assign product to shop');
      toast.error('Nepodařilo se přiřadit produkt');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const sp = mapDbToShopProduct(inserted);
    set((s) => ({ shopProducts: [...s.shopProducts, sp] }));
    return { success: true, shopProductId: sp.id };
  },

  updateShopProduct: async (shopProductId, updates) => {
    const dbData = mapShopProductToDb({ ...updates, id: shopProductId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('eshop_produkty').update(dbData).eq('id', shopProductId);
    if (error) {
      logger.error('Failed to update shop product');
      toast.error('Nepodařilo se uložit produkt');
      return { success: false, error: error.message };
    }
    set((s) => ({
      shopProducts: s.shopProducts.map((sp) =>
        sp.id === shopProductId ? { ...sp, ...updates, updatedAt: new Date().toISOString() } : sp
      ),
      isShopProductDetailOpen: false,
      editingShopProductId: null,
    }));
    toast.success('Produkt uložen');
    return { success: true };
  },

  removeProductFromShop: async (shopProductId) => {
    const supabase = createClient();
    const { error } = await supabase.from('eshop_produkty').delete().eq('id', shopProductId);
    if (error) {
      logger.error('Failed to remove product from shop');
      toast.error('Nepodařilo se odebrat produkt');
      return { success: false, error: error.message };
    }
    set((s) => ({
      shopProducts: s.shopProducts.filter((sp) => sp.id !== shopProductId),
      shopProductVariants: s.shopProductVariants.filter((spv) => spv.shopProductId !== shopProductId),
    }));
    toast.success('Produkt odebrán z e-shopu');
    return { success: true };
  },

  bulkAssignProducts: async (shopId, productIds, defaultPrice) => {
    if (productIds.length === 0) return { success: true, count: 0 };
    const rows = productIds.map((productId) =>
      mapShopProductToDb({ shopId, productId, price: defaultPrice, active: true, aiStatus: 'ceka', order: 0 })
    );
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshop_produkty').insert(rows).select('*');
    if (error) {
      logger.error('Failed to bulk assign products');
      toast.error('Nepodařilo se přiřadit produkty');
      return { success: false, error: error.message };
    }
    const newItems = (inserted ?? []).map(mapDbToShopProduct);
    set((s) => ({ shopProducts: [...s.shopProducts, ...newItems], isProductPickerOpen: false }));
    toast.success(`Přiřazeno ${newItems.length} produktů`);
    return { success: true, count: newItems.length };
  },

  setShopProductSearch: (query) => set({ shopProductSearchQuery: query }),
  openProductPicker: () => set({ isProductPickerOpen: true }),
  closeProductPicker: () => set({ isProductPickerOpen: false }),
  openShopProductDetail: (shopProductId) => set({ isShopProductDetailOpen: true, editingShopProductId: shopProductId }),
  closeShopProductDetail: () => set({ isShopProductDetailOpen: false, editingShopProductId: null }),

  // ===========================================================================
  // SHOP PRODUCT VARIANTS
  // ===========================================================================

  upsertShopProductVariant: async (shopProductId, variantId, updates) => {
    const { shopProductVariants } = get();
    const existing = shopProductVariants.find((spv) => spv.shopProductId === shopProductId && spv.variantId === variantId);
    const supabase = createClient();

    if (existing) {
      const dbData = mapShopProductVariantToDb(updates);
      const { error } = await supabase.from('eshop_produkty_varianty').update(dbData).eq('id', existing.id);
      if (error) {
        toast.error('Nepodařilo se uložit variantu');
        return { success: false, error: error.message };
      }
      set((s) => ({
        shopProductVariants: s.shopProductVariants.map((spv) =>
          spv.id === existing.id ? { ...spv, ...updates } : spv
        ),
      }));
    } else {
      const dbData = mapShopProductVariantToDb({ shopProductId, variantId, active: true, ...updates });
      const { data: inserted, error } = await supabase.from('eshop_produkty_varianty').insert(dbData).select('*').single();
      if (error || !inserted) {
        toast.error('Nepodařilo se vytvořit variantu');
        return { success: false, error: error?.message ?? 'Unknown error' };
      }
      const spv = mapDbToShopProductVariant(inserted);
      set((s) => ({ shopProductVariants: [...s.shopProductVariants, spv] }));
    }
    return { success: true };
  },

  // ===========================================================================
  // SHOP CATEGORIES
  // ===========================================================================

  assignCategoryToShop: async (shopId, categoryId) => {
    const dbData = mapShopCategoryToDb({ shopId, categoryId, active: true, order: 0 });
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshop_kategorie').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to assign category to shop');
      toast.error('Nepodařilo se přiřadit kategorii');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const sc = mapDbToShopCategory(inserted);
    set((s) => ({ shopCategories: [...s.shopCategories, sc] }));
    toast.success('Kategorie přiřazena');
    return { success: true, shopCategoryId: sc.id };
  },

  updateShopCategory: async (shopCategoryId, updates) => {
    const dbData = mapShopCategoryToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('eshop_kategorie').update(dbData).eq('id', shopCategoryId);
    if (error) {
      logger.error('Failed to update shop category');
      toast.error('Nepodařilo se uložit kategorii');
      return { success: false, error: error.message };
    }
    set((s) => ({
      shopCategories: s.shopCategories.map((sc) =>
        sc.id === shopCategoryId ? { ...sc, ...updates } : sc
      ),
      isShopCategoryFormOpen: false,
      editingShopCategoryId: null,
    }));
    toast.success('Kategorie uložena');
    return { success: true };
  },

  removeCategoryFromShop: async (shopCategoryId) => {
    const supabase = createClient();
    const { error } = await supabase.from('eshop_kategorie').delete().eq('id', shopCategoryId);
    if (error) {
      logger.error('Failed to remove category from shop');
      toast.error('Nepodařilo se odebrat kategorii');
      return { success: false, error: error.message };
    }
    set((s) => ({ shopCategories: s.shopCategories.filter((sc) => sc.id !== shopCategoryId) }));
    toast.success('Kategorie odebrána');
    return { success: true };
  },

  openShopCategoryForm: (shopCategoryId) => set({ isShopCategoryFormOpen: true, editingShopCategoryId: shopCategoryId ?? null }),
  closeShopCategoryForm: () => set({ isShopCategoryFormOpen: false, editingShopCategoryId: null }),

  // ===========================================================================
  // REDIRECTS
  // ===========================================================================

  createRedirect: async (data) => {
    const dbData = mapRedirectToDb(data);
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('presmerovani').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create redirect');
      toast.error('Nepodařilo se vytvořit přesměrování');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const redirect = mapDbToRedirect(inserted);
    set((s) => ({ redirects: [...s.redirects, redirect], isRedirectFormOpen: false, editingRedirectId: null }));
    toast.success('Přesměrování vytvořeno');
    return { success: true, redirectId: redirect.id };
  },

  updateRedirect: async (id, updates) => {
    const dbData = mapRedirectToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('presmerovani').update(dbData).eq('id', id);
    if (error) {
      logger.error('Failed to update redirect');
      toast.error('Nepodařilo se uložit přesměrování');
      return { success: false, error: error.message };
    }
    set((s) => ({
      redirects: s.redirects.map((r) => (r.id === id ? { ...r, ...updates } : r)),
      isRedirectFormOpen: false,
      editingRedirectId: null,
    }));
    toast.success('Přesměrování uloženo');
    return { success: true };
  },

  deleteRedirect: async (id) => {
    const supabase = createClient();
    const { error } = await supabase.from('presmerovani').delete().eq('id', id);
    if (error) {
      logger.error('Failed to delete redirect');
      toast.error('Nepodařilo se smazat přesměrování');
      return { success: false, error: error.message };
    }
    set((s) => ({ redirects: s.redirects.filter((r) => r.id !== id) }));
    toast.success('Přesměrování smazáno');
    return { success: true };
  },

  setRedirectSearch: (query) => set({ redirectSearchQuery: query }),
  openRedirectForm: (id) => set({ isRedirectFormOpen: true, editingRedirectId: id ?? null }),
  closeRedirectForm: () => set({ isRedirectFormOpen: false, editingRedirectId: null }),

  // ===========================================================================
  // AI
  // ===========================================================================

  generateAiText: async (shopProductId) => {
    const { selectedShopId, shopProducts } = get();
    const sp = shopProducts.find((p) => p.id === shopProductId);
    if (!sp || !selectedShopId) return { success: false, error: 'Produkt nenalezen' };

    set({ aiGenerating: true });

    // Optimistic: set status to 'generuje'
    set((s) => ({
      shopProducts: s.shopProducts.map((p) =>
        p.id === shopProductId ? { ...p, aiStatus: 'generuje' as AiStatus } : p
      ),
    }));

    const supabase = createClient();
    const { data, error } = await supabase.functions.invoke('generate-ai-text', {
      body: { type: 'product', targetId: shopProductId, shopId: selectedShopId },
    });

    if (error || !data?.success) {
      // Revert status
      set((s) => ({
        shopProducts: s.shopProducts.map((p) =>
          p.id === shopProductId ? { ...p, aiStatus: 'ceka' as AiStatus } : p
        ),
        aiGenerating: false,
      }));
      const errMsg = data?.error || error?.message || 'AI generování selhalo';
      toast.error(errMsg);
      return { success: false, error: errMsg };
    }

    // Update status to 'vygenerovano'
    set((s) => ({
      shopProducts: s.shopProducts.map((p) =>
        p.id === shopProductId ? { ...p, aiStatus: 'vygenerovano' as AiStatus } : p
      ),
      aiGenerating: false,
    }));

    return { success: true, data: data.generated, usage: data.usage };
  },

  bulkGenerateAiText: async (shopProductIds) => {
    set({ aiBulkProgress: { current: 0, total: shopProductIds.length, errors: [] } });

    for (let i = 0; i < shopProductIds.length; i++) {
      set((s) => ({ aiBulkProgress: s.aiBulkProgress ? { ...s.aiBulkProgress, current: i + 1 } : null }));
      const result = await get().generateAiText(shopProductIds[i]);
      if (!result.success) {
        set((s) => ({
          aiBulkProgress: s.aiBulkProgress
            ? { ...s.aiBulkProgress, errors: [...s.aiBulkProgress.errors, `#${shopProductIds[i]}: ${result.error}`] }
            : null,
        }));
      }
      // Rate limit pause between requests
      if (i < shopProductIds.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    const progress = get().aiBulkProgress;
    const errorCount = progress?.errors.length ?? 0;
    if (errorCount === 0) {
      toast.success(`AI generování dokončeno (${shopProductIds.length} produktů)`);
    } else {
      toast.warning(`Dokončeno s ${errorCount} chybami z ${shopProductIds.length}`);
    }
  },

  applyAiTexts: async (shopProductId, texts) => {
    const result = await get().updateShopProduct(shopProductId, {
      ...texts,
      aiStatus: 'schvaleno' as AiStatus,
    });
    if (result.success) {
      set({ isAiPreviewOpen: false, aiPreviewData: null, aiPreviewShopProductId: null, aiPreviewUsage: null });
    }
    return result;
  },

  rejectAiTexts: () => {
    set({ isAiPreviewOpen: false, aiPreviewData: null, aiPreviewShopProductId: null, aiPreviewUsage: null });
  },

  openAiPreview: (shopProductId, data, usage) => {
    set({ isAiPreviewOpen: true, aiPreviewData: data, aiPreviewShopProductId: shopProductId, aiPreviewUsage: usage ?? null });
  },

  closeAiPreview: () => {
    set({ isAiPreviewOpen: false, aiPreviewData: null, aiPreviewShopProductId: null, aiPreviewUsage: null });
  },

  closeBulkProgress: () => {
    set({ aiBulkProgress: null });
  },

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getFilteredEshops: () => {
    const { eshops, eshopSearchQuery } = get();
    if (!eshopSearchQuery) return eshops;
    const q = eshopSearchQuery.toLowerCase();
    return eshops.filter(
      (e) =>
        e.name.toLowerCase().includes(q) ||
        e.domain.toLowerCase().includes(q) ||
        e.slug.toLowerCase().includes(q)
    );
  },

  getShopProductsForShop: (shopId) => {
    return get().shopProducts.filter((sp) => sp.shopId === shopId);
  },

  getFilteredShopProducts: () => {
    const { shopProducts, selectedShopId, shopProductSearchQuery } = get();
    if (!selectedShopId) return [];
    let filtered = shopProducts.filter((sp) => sp.shopId === selectedShopId);
    if (shopProductSearchQuery) {
      const q = shopProductSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (sp) =>
          sp.nameOverride?.toLowerCase().includes(q) ||
          sp.seoSlug?.toLowerCase().includes(q) ||
          String(sp.productId).includes(q)
      );
    }
    return filtered;
  },

  getShopProductVariantsForShopProduct: (shopProductId) => {
    return get().shopProductVariants.filter((spv) => spv.shopProductId === shopProductId);
  },

  getShopCategoriesForShop: (shopId) => {
    return get().shopCategories.filter((sc) => sc.shopId === shopId);
  },

  getRedirectsForShop: (shopId) => {
    return get().redirects.filter((r) => r.shopId === shopId);
  },

  getFilteredRedirects: () => {
    const { redirects, selectedShopId, redirectSearchQuery } = get();
    if (!selectedShopId) return [];
    let filtered = redirects.filter((r) => r.shopId === selectedShopId);
    if (redirectSearchQuery) {
      const q = redirectSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (r) => r.oldUrl.toLowerCase().includes(q) || r.newUrl.toLowerCase().includes(q)
      );
    }
    return filtered;
  },

  getUnassignedProducts: (shopId, allProducts) => {
    const { shopProducts } = get();
    const assignedProductIds = new Set(
      shopProducts.filter((sp) => sp.shopId === shopId).map((sp) => sp.productId)
    );
    return allProducts.filter((p) => !assignedProductIds.has(p.id));
  },

  getShippingsForShop: (shopId: number) => {
    return get().shopShippings.filter((s) => s.shopId === shopId).sort((a, b) => a.order - b.order);
  },

  getPaymentsForShop: (shopId: number) => {
    return get().shopPayments.filter((p) => p.shopId === shopId).sort((a, b) => a.order - b.order);
  },

  // ===========================================================================
  // SHIPPING/PAYMENT CRUD
  // ===========================================================================

  openShippingForm: (id?: number) => set({ isShippingFormOpen: true, editingShippingId: id ?? null }),
  closeShippingForm: () => set({ isShippingFormOpen: false, editingShippingId: null }),
  openPaymentForm: (id?: number) => set({ isPaymentFormOpen: true, editingPaymentId: id ?? null }),
  closePaymentForm: () => set({ isPaymentFormOpen: false, editingPaymentId: null }),

  createShipping: async (data: Partial<ShopShipping>) => {
    const dbData = mapShopShippingToDb(data);
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshop_doprava').insert(dbData).select('*').single();
    if (error || !inserted) {
      toast.error('Nepodařilo se vytvořit dopravu');
      return { success: false };
    }
    set((s) => ({ shopShippings: [...s.shopShippings, mapDbToShopShipping(inserted)], isShippingFormOpen: false, editingShippingId: null }));
    toast.success('Doprava vytvořena');
    return { success: true };
  },

  updateShipping: async (id: number, updates: Partial<ShopShipping>) => {
    const dbData = mapShopShippingToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('eshop_doprava').update(dbData).eq('id', id);
    if (error) {
      toast.error('Nepodařilo se aktualizovat dopravu');
      return { success: false };
    }
    set((s) => ({ shopShippings: s.shopShippings.map((sh) => sh.id === id ? { ...sh, ...updates } : sh), isShippingFormOpen: false, editingShippingId: null }));
    toast.success('Doprava aktualizována');
    return { success: true };
  },

  deleteShipping: async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase.from('eshop_doprava').delete().eq('id', id);
    if (error) {
      toast.error('Nepodařilo se smazat dopravu');
      return { success: false };
    }
    set((s) => ({ shopShippings: s.shopShippings.filter((sh) => sh.id !== id) }));
    toast.success('Doprava smazána');
    return { success: true };
  },

  createPayment: async (data: Partial<ShopPayment>) => {
    const dbData = mapShopPaymentToDb(data);
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('eshop_platby').insert(dbData).select('*').single();
    if (error || !inserted) {
      toast.error('Nepodařilo se vytvořit platbu');
      return { success: false };
    }
    set((s) => ({ shopPayments: [...s.shopPayments, mapDbToShopPayment(inserted)], isPaymentFormOpen: false, editingPaymentId: null }));
    toast.success('Platba vytvořena');
    return { success: true };
  },

  updatePayment: async (id: number, updates: Partial<ShopPayment>) => {
    const dbData = mapShopPaymentToDb(updates);
    const supabase = createClient();
    const { error } = await supabase.from('eshop_platby').update(dbData).eq('id', id);
    if (error) {
      toast.error('Nepodařilo se aktualizovat platbu');
      return { success: false };
    }
    set((s) => ({ shopPayments: s.shopPayments.map((p) => p.id === id ? { ...p, ...updates } : p), isPaymentFormOpen: false, editingPaymentId: null }));
    toast.success('Platba aktualizována');
    return { success: true };
  },

  deletePayment: async (id: number) => {
    const supabase = createClient();
    const { error } = await supabase.from('eshop_platby').delete().eq('id', id);
    if (error) {
      toast.error('Nepodařilo se smazat platbu');
      return { success: false };
    }
    set((s) => ({ shopPayments: s.shopPayments.filter((p) => p.id !== id) }));
    toast.success('Platba smazána');
    return { success: true };
  },

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    const supabase = createClient();

    const channel = supabase
      .channel('eshop-eshopy-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshopy' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshop_produkty' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshop_produkty_varianty' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshop_kategorie' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presmerovani' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshop_doprava' }, () => {
        get().fetchEshopEshopyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'eshop_platby' }, () => {
        get().fetchEshopEshopyData();
      })
      .subscribe((status, err) => {
        if (err) logger.error(`[eshop-eshopy-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
