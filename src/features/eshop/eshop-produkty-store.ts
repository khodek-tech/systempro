'use client';

import { create } from 'zustand';
import { createClient } from '@/lib/supabase/client';
import { logger } from '@/lib/logger';
import { toast } from 'sonner';
import type { RealtimeChannel } from '@supabase/supabase-js';
import type {
  Product,
  ProductVariant,
  VariantAttribute,
  ProductImage,
  Category,
  ProductCategory,
  AttributeType,
  AttributeValue,
  Review,
} from '@/shared/types';
import {
  mapDbToProduct,
  mapProductToDb,
  mapDbToProductVariant,
  mapProductVariantToDb,
  mapDbToVariantAttribute,
  mapDbToProductImage,
  mapProductImageToDb,
  mapDbToCategory,
  mapCategoryToDb,
  mapDbToProductCategory,
  mapProductCategoryToDb,
  mapDbToAttributeType,
  mapAttributeTypeToDb,
  mapDbToAttributeValue,
  mapAttributeValueToDb,
  mapDbToReview,
} from '@/lib/supabase/mappers';
import { buildCategoryTree, type CategoryTreeNode } from './eshop-produkty-helpers';

// =============================================================================
// TYPES
// =============================================================================

type ActiveTab = 'products' | 'categories' | 'attributes' | 'feeds' | 'reviews';
type ProductFilter = 'all' | 'active' | 'inactive';

interface EshopProduktyState {
  // Data
  products: Product[];
  productVariants: ProductVariant[];
  variantAttributes: VariantAttribute[];
  productImages: ProductImage[];
  categories: Category[];
  productCategories: ProductCategory[];
  attributeTypes: AttributeType[];
  attributeValues: AttributeValue[];

  // Loading
  _loaded: boolean;
  _loading: boolean;

  // View
  produktyViewMode: 'card' | 'view';
  activeTab: ActiveTab;

  // Products tab UI
  productSearchQuery: string;
  productActiveFilter: ProductFilter;
  selectedProductId: number | null;
  isProductFormOpen: boolean;
  editingProductId: number | null;

  // Categories tab UI
  isCategoryFormOpen: boolean;
  editingCategoryId: number | null;

  // Attributes tab UI
  isAttributeTypeFormOpen: boolean;
  editingAttributeTypeId: number | null;

  // Reviews
  reviews: Review[];
  reviewsLoading: boolean;

  // Realtime
  _realtimeChannel: RealtimeChannel | null;
}

interface EshopProduktyActions {
  // Fetch
  fetchEshopProduktyData: () => Promise<void>;

  // View
  openProduktyView: () => void;
  closeProduktyView: () => void;
  setActiveTab: (tab: ActiveTab) => void;

  // Products
  createProduct: (data: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; productId?: number; error?: string }>;
  updateProduct: (productId: number, updates: Partial<Product>) => Promise<{ success: boolean; error?: string }>;
  deleteProduct: (productId: number) => Promise<{ success: boolean; error?: string }>;
  setProductSearch: (query: string) => void;
  setProductActiveFilter: (filter: ProductFilter) => void;
  openProductForm: (productId?: number) => void;
  closeProductForm: () => void;

  // Product Variants
  createVariant: (data: Omit<ProductVariant, 'id' | 'createdAt' | 'updatedAt'>) => Promise<{ success: boolean; variantId?: number; error?: string }>;
  updateVariant: (variantId: number, updates: Partial<ProductVariant>) => Promise<{ success: boolean; error?: string }>;
  deleteVariant: (variantId: number) => Promise<{ success: boolean; error?: string }>;

  // Variant Attributes
  setVariantAttribute: (variantId: number, attributeValueId: number) => Promise<{ success: boolean; error?: string }>;
  removeVariantAttribute: (variantId: number, attributeValueId: number) => Promise<{ success: boolean; error?: string }>;

  // Product Images
  uploadProductImage: (productId: number, file: File, variantId?: number) => Promise<{ success: boolean; error?: string }>;
  deleteProductImage: (imageId: number) => Promise<{ success: boolean; error?: string }>;
  setMainImage: (imageId: number, productId: number) => Promise<{ success: boolean; error?: string }>;
  reorderImages: (productId: number, imageIds: number[]) => Promise<{ success: boolean; error?: string }>;

  // Categories
  createCategory: (data: Omit<Category, 'id'>) => Promise<{ success: boolean; categoryId?: number; error?: string }>;
  updateCategory: (categoryId: number, updates: Partial<Category>) => Promise<{ success: boolean; error?: string }>;
  deleteCategory: (categoryId: number) => Promise<{ success: boolean; error?: string }>;
  openCategoryForm: (categoryId?: number) => void;
  closeCategoryForm: () => void;

  // Product-Category
  assignProductToCategory: (productId: number, categoryId: number) => Promise<{ success: boolean; error?: string }>;
  removeProductFromCategory: (productId: number, categoryId: number) => Promise<{ success: boolean; error?: string }>;

  // Attribute Types
  createAttributeType: (data: Omit<AttributeType, 'id' | 'createdAt'>) => Promise<{ success: boolean; attrTypeId?: number; error?: string }>;
  updateAttributeType: (attrTypeId: number, updates: Partial<AttributeType>) => Promise<{ success: boolean; error?: string }>;
  deleteAttributeType: (attrTypeId: number) => Promise<{ success: boolean; error?: string }>;
  openAttributeTypeForm: (attrTypeId?: number) => void;
  closeAttributeTypeForm: () => void;

  // Attribute Values
  createAttributeValue: (data: Omit<AttributeValue, 'id'>) => Promise<{ success: boolean; valueId?: number; error?: string }>;
  updateAttributeValue: (valueId: number, updates: Partial<AttributeValue>) => Promise<{ success: boolean; error?: string }>;
  deleteAttributeValue: (valueId: number) => Promise<{ success: boolean; error?: string }>;

  // Getters
  getProductById: (id: number) => Product | undefined;
  getVariantsForProduct: (productId: number) => ProductVariant[];
  getAttributesForVariant: (variantId: number) => { attribute: AttributeType; value: AttributeValue }[];
  getImagesForProduct: (productId: number) => ProductImage[];
  getCategoriesForProduct: (productId: number) => Category[];
  getCategoryTree: () => CategoryTreeNode[];
  getValuesForAttributeType: (attrTypeId: number) => AttributeValue[];
  getFilteredProducts: () => Product[];

  // Reviews
  fetchReviews: () => Promise<void>;
  approveReview: (reviewId: number) => Promise<{ success: boolean; error?: string }>;
  deleteReview: (reviewId: number) => Promise<{ success: boolean; error?: string }>;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

// =============================================================================
// STORE
// =============================================================================

export const useEshopProduktyStore = create<EshopProduktyState & EshopProduktyActions>()((set, get) => ({
  // Initial state
  products: [],
  productVariants: [],
  variantAttributes: [],
  productImages: [],
  categories: [],
  productCategories: [],
  attributeTypes: [],
  attributeValues: [],
  _loaded: false,
  _loading: false,
  produktyViewMode: 'card',
  activeTab: 'products',
  productSearchQuery: '',
  productActiveFilter: 'all',
  selectedProductId: null,
  isProductFormOpen: false,
  editingProductId: null,
  isCategoryFormOpen: false,
  editingCategoryId: null,
  isAttributeTypeFormOpen: false,
  editingAttributeTypeId: null,
  reviews: [],
  reviewsLoading: false,
  _realtimeChannel: null,

  // ===========================================================================
  // FETCH
  // ===========================================================================

  fetchEshopProduktyData: async () => {
    set({ _loading: true });
    const supabase = createClient();

    const [
      productsRes,
      variantsRes,
      variantAttrsRes,
      imagesRes,
      categoriesRes,
      productCatsRes,
      attrTypesRes,
      attrValuesRes,
    ] = await Promise.all([
      supabase.from('produkty').select('*'),
      supabase.from('produkty_varianty').select('*'),
      supabase.from('varianty_atributy').select('*'),
      supabase.from('produkty_obrazky').select('*'),
      supabase.from('kategorie').select('*'),
      supabase.from('produkty_kategorie').select('*'),
      supabase.from('atributy_typy').select('*').order('poradi'),
      supabase.from('atributy_hodnoty').select('*').order('poradi'),
    ]);

    if (productsRes.error) {
      logger.error('Failed to fetch eshop produkty data');
      set({ _loading: false });
      return;
    }

    set({
      products: productsRes.data?.map(mapDbToProduct) ?? [],
      productVariants: variantsRes.data?.map(mapDbToProductVariant) ?? [],
      variantAttributes: variantAttrsRes.data?.map(mapDbToVariantAttribute) ?? [],
      productImages: imagesRes.data?.map(mapDbToProductImage) ?? [],
      categories: categoriesRes.data?.map(mapDbToCategory) ?? [],
      productCategories: productCatsRes.data?.map(mapDbToProductCategory) ?? [],
      attributeTypes: attrTypesRes.data?.map(mapDbToAttributeType) ?? [],
      attributeValues: attrValuesRes.data?.map(mapDbToAttributeValue) ?? [],
      _loaded: true,
      _loading: false,
    });
  },

  // ===========================================================================
  // VIEW
  // ===========================================================================

  openProduktyView: () => set({ produktyViewMode: 'view' }),
  closeProduktyView: () => set({ produktyViewMode: 'card' }),
  setActiveTab: (tab) => set({ activeTab: tab }),

  // ===========================================================================
  // PRODUCTS CRUD
  // ===========================================================================

  createProduct: async (data) => {
    const dbData = mapProductToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('produkty').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create product');
      toast.error('Nepodařilo se vytvořit produkt');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const product = mapDbToProduct(inserted);
    set((s) => ({ products: [...s.products, product], isProductFormOpen: false, editingProductId: null }));
    toast.success('Produkt vytvořen');
    return { success: true, productId: product.id };
  },

  updateProduct: async (productId, updates) => {
    const dbData = mapProductToDb({ ...updates, id: productId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('produkty').update(dbData).eq('id', productId);
    if (error) {
      logger.error('Failed to update product');
      toast.error('Nepodařilo se uložit produkt');
      return { success: false, error: error.message };
    }
    set((s) => ({
      products: s.products.map((p) => (p.id === productId ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p)),
    }));
    toast.success('Produkt uložen');
    return { success: true };
  },

  deleteProduct: async (productId) => {
    const supabase = createClient();
    const { error } = await supabase.from('produkty').delete().eq('id', productId);
    if (error) {
      logger.error('Failed to delete product');
      toast.error('Nepodařilo se smazat produkt');
      return { success: false, error: error.message };
    }
    set((s) => ({
      products: s.products.filter((p) => p.id !== productId),
      productVariants: s.productVariants.filter((v) => v.productId !== productId),
      productImages: s.productImages.filter((i) => i.productId !== productId),
      productCategories: s.productCategories.filter((pc) => pc.productId !== productId),
      selectedProductId: s.selectedProductId === productId ? null : s.selectedProductId,
    }));
    toast.success('Produkt smazán');
    return { success: true };
  },

  setProductSearch: (query) => set({ productSearchQuery: query }),
  setProductActiveFilter: (filter) => set({ productActiveFilter: filter }),
  openProductForm: (productId) => set({ isProductFormOpen: true, editingProductId: productId ?? null }),
  closeProductForm: () => set({ isProductFormOpen: false, editingProductId: null }),

  // ===========================================================================
  // PRODUCT VARIANTS CRUD
  // ===========================================================================

  createVariant: async (data) => {
    const dbData = mapProductVariantToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('produkty_varianty').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create variant');
      toast.error('Nepodařilo se vytvořit variantu');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const variant = mapDbToProductVariant(inserted);
    set((s) => ({ productVariants: [...s.productVariants, variant] }));
    toast.success('Varianta vytvořena');
    return { success: true, variantId: variant.id };
  },

  updateVariant: async (variantId, updates) => {
    const dbData = mapProductVariantToDb({ ...updates, id: variantId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('produkty_varianty').update(dbData).eq('id', variantId);
    if (error) {
      logger.error('Failed to update variant');
      toast.error('Nepodařilo se uložit variantu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      productVariants: s.productVariants.map((v) => (v.id === variantId ? { ...v, ...updates, updatedAt: new Date().toISOString() } : v)),
    }));
    return { success: true };
  },

  deleteVariant: async (variantId) => {
    const supabase = createClient();
    const { error } = await supabase.from('produkty_varianty').delete().eq('id', variantId);
    if (error) {
      logger.error('Failed to delete variant');
      toast.error('Nepodařilo se smazat variantu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      productVariants: s.productVariants.filter((v) => v.id !== variantId),
      variantAttributes: s.variantAttributes.filter((va) => va.variantId !== variantId),
    }));
    toast.success('Varianta smazána');
    return { success: true };
  },

  // ===========================================================================
  // VARIANT ATTRIBUTES
  // ===========================================================================

  setVariantAttribute: async (variantId, attributeValueId) => {
    // Remove existing attribute of the same type for this variant
    const { attributeValues, variantAttributes } = get();
    const newValue = attributeValues.find((v) => v.id === attributeValueId);
    if (!newValue) return { success: false, error: 'Hodnota atributu nenalezena' };

    const existingOfSameType = variantAttributes.filter((va) => {
      if (va.variantId !== variantId) return false;
      const val = attributeValues.find((v) => v.id === va.attributeValueId);
      return val && val.attributeTypeId === newValue.attributeTypeId;
    });

    const supabase = createClient();

    // Remove old values of same attribute type
    if (existingOfSameType.length > 0) {
      const ids = existingOfSameType.map((va) => va.attributeValueId);
      await supabase.from('varianty_atributy').delete().eq('varianta_id', variantId).in('atribut_hodnota_id', ids);
    }

    const { data: inserted, error } = await supabase
      .from('varianty_atributy')
      .insert({ varianta_id: variantId, atribut_hodnota_id: attributeValueId })
      .select('*')
      .single();
    if (error || !inserted) {
      logger.error('Failed to set variant attribute');
      toast.error('Nepodařilo se nastavit atribut varianty');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const va = mapDbToVariantAttribute(inserted);
    set((s) => ({
      variantAttributes: [
        ...s.variantAttributes.filter((x) => {
          if (x.variantId !== variantId) return true;
          const val = attributeValues.find((v) => v.id === x.attributeValueId);
          return !(val && val.attributeTypeId === newValue.attributeTypeId);
        }),
        va,
      ],
    }));
    return { success: true };
  },

  removeVariantAttribute: async (variantId, attributeValueId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('varianty_atributy')
      .delete()
      .eq('varianta_id', variantId)
      .eq('atribut_hodnota_id', attributeValueId);
    if (error) {
      logger.error('Failed to remove variant attribute');
      return { success: false, error: error.message };
    }
    set((s) => ({
      variantAttributes: s.variantAttributes.filter(
        (va) => !(va.variantId === variantId && va.attributeValueId === attributeValueId),
      ),
    }));
    return { success: true };
  },

  // ===========================================================================
  // PRODUCT IMAGES
  // ===========================================================================

  uploadProductImage: async (productId, file, variantId) => {
    const supabase = createClient();
    const ext = file.name.split('.').pop() ?? 'jpg';
    const path = `products/${productId}/${crypto.randomUUID()}.${ext}`;

    const { error: uploadError } = await supabase.storage.from('eshop-images').upload(path, file);
    if (uploadError) {
      logger.error('Failed to upload image');
      toast.error('Nepodařilo se nahrát obrázek');
      return { success: false, error: uploadError.message };
    }

    const { data: urlData } = supabase.storage.from('eshop-images').getPublicUrl(path);
    const url = urlData.publicUrl;

    const { productImages } = get();
    const existingImages = productImages.filter((i) => i.productId === productId);
    const isMain = existingImages.length === 0;

    const dbData = mapProductImageToDb({
      productId,
      variantId,
      url,
      order: existingImages.length,
      isMain,
    });

    const { data: inserted, error } = await supabase.from('produkty_obrazky').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to save image record');
      toast.error('Nepodařilo se uložit obrázek');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const image = mapDbToProductImage(inserted);
    set((s) => ({ productImages: [...s.productImages, image] }));
    toast.success('Obrázek nahrán');
    return { success: true };
  },

  deleteProductImage: async (imageId) => {
    const { productImages } = get();
    const image = productImages.find((i) => i.id === imageId);
    if (!image) return { success: false, error: 'Obrázek nenalezen' };

    const supabase = createClient();

    // Try to delete from storage (extract path from URL)
    try {
      const url = new URL(image.url);
      const pathMatch = url.pathname.match(/\/object\/public\/eshop-images\/(.+)/);
      if (pathMatch) {
        await supabase.storage.from('eshop-images').remove([pathMatch[1]]);
      }
    } catch {
      // Ignore storage deletion errors
    }

    const { error } = await supabase.from('produkty_obrazky').delete().eq('id', imageId);
    if (error) {
      logger.error('Failed to delete image');
      toast.error('Nepodařilo se smazat obrázek');
      return { success: false, error: error.message };
    }
    set((s) => ({ productImages: s.productImages.filter((i) => i.id !== imageId) }));
    toast.success('Obrázek smazán');
    return { success: true };
  },

  setMainImage: async (imageId, productId) => {
    const supabase = createClient();
    // Unset all main for this product
    await supabase.from('produkty_obrazky').update({ hlavni: false }).eq('produkt_id', productId);
    // Set new main
    const { error } = await supabase.from('produkty_obrazky').update({ hlavni: true }).eq('id', imageId);
    if (error) {
      logger.error('Failed to set main image');
      return { success: false, error: error.message };
    }
    set((s) => ({
      productImages: s.productImages.map((i) => ({
        ...i,
        isMain: i.productId === productId ? i.id === imageId : i.isMain,
      })),
    }));
    return { success: true };
  },

  reorderImages: async (productId, imageIds) => {
    const supabase = createClient();
    const updates = imageIds.map((id, index) =>
      supabase.from('produkty_obrazky').update({ poradi: index }).eq('id', id),
    );
    await Promise.all(updates);
    set((s) => ({
      productImages: s.productImages.map((i) => {
        if (i.productId !== productId) return i;
        const idx = imageIds.indexOf(i.id);
        return idx >= 0 ? { ...i, order: idx } : i;
      }),
    }));
    return { success: true };
  },

  // ===========================================================================
  // CATEGORIES CRUD
  // ===========================================================================

  createCategory: async (data) => {
    const dbData = mapCategoryToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('kategorie').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create category');
      toast.error('Nepodařilo se vytvořit kategorii');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const category = mapDbToCategory(inserted);
    set((s) => ({ categories: [...s.categories, category], isCategoryFormOpen: false, editingCategoryId: null }));
    toast.success('Kategorie vytvořena');
    return { success: true, categoryId: category.id };
  },

  updateCategory: async (categoryId, updates) => {
    const dbData = mapCategoryToDb({ ...updates, id: categoryId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('kategorie').update(dbData).eq('id', categoryId);
    if (error) {
      logger.error('Failed to update category');
      toast.error('Nepodařilo se uložit kategorii');
      return { success: false, error: error.message };
    }
    set((s) => ({
      categories: s.categories.map((c) => (c.id === categoryId ? { ...c, ...updates } : c)),
    }));
    toast.success('Kategorie uložena');
    return { success: true };
  },

  deleteCategory: async (categoryId) => {
    // Check for children
    const { categories } = get();
    const hasChildren = categories.some((c) => c.parentId === categoryId);
    if (hasChildren) {
      toast.error('Nelze smazat kategorii s podkategoriemi');
      return { success: false, error: 'Kategorie má podkategorie' };
    }

    const supabase = createClient();
    const { error } = await supabase.from('kategorie').delete().eq('id', categoryId);
    if (error) {
      logger.error('Failed to delete category');
      toast.error('Nepodařilo se smazat kategorii');
      return { success: false, error: error.message };
    }
    set((s) => ({
      categories: s.categories.filter((c) => c.id !== categoryId),
      productCategories: s.productCategories.filter((pc) => pc.categoryId !== categoryId),
    }));
    toast.success('Kategorie smazána');
    return { success: true };
  },

  openCategoryForm: (categoryId) => set({ isCategoryFormOpen: true, editingCategoryId: categoryId ?? null }),
  closeCategoryForm: () => set({ isCategoryFormOpen: false, editingCategoryId: null }),

  // ===========================================================================
  // PRODUCT-CATEGORY
  // ===========================================================================

  assignProductToCategory: async (productId, categoryId) => {
    const existing = get().productCategories.find((pc) => pc.productId === productId && pc.categoryId === categoryId);
    if (existing) return { success: true };

    const dbData = mapProductCategoryToDb({ productId, categoryId, order: 0 });
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('produkty_kategorie').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to assign product to category');
      toast.error('Nepodařilo se přiřadit kategorii');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const pc = mapDbToProductCategory(inserted);
    set((s) => ({ productCategories: [...s.productCategories, pc] }));
    return { success: true };
  },

  removeProductFromCategory: async (productId, categoryId) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('produkty_kategorie')
      .delete()
      .eq('produkt_id', productId)
      .eq('kategorie_id', categoryId);
    if (error) {
      logger.error('Failed to remove product from category');
      return { success: false, error: error.message };
    }
    set((s) => ({
      productCategories: s.productCategories.filter(
        (pc) => !(pc.productId === productId && pc.categoryId === categoryId),
      ),
    }));
    return { success: true };
  },

  // ===========================================================================
  // ATTRIBUTE TYPES CRUD
  // ===========================================================================

  createAttributeType: async (data) => {
    const dbData = mapAttributeTypeToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('atributy_typy').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create attribute type');
      toast.error('Nepodařilo se vytvořit typ atributu');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const attrType = mapDbToAttributeType(inserted);
    set((s) => ({
      attributeTypes: [...s.attributeTypes, attrType],
      isAttributeTypeFormOpen: false,
      editingAttributeTypeId: null,
    }));
    toast.success('Typ atributu vytvořen');
    return { success: true, attrTypeId: attrType.id };
  },

  updateAttributeType: async (attrTypeId, updates) => {
    const dbData = mapAttributeTypeToDb({ ...updates, id: attrTypeId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('atributy_typy').update(dbData).eq('id', attrTypeId);
    if (error) {
      logger.error('Failed to update attribute type');
      toast.error('Nepodařilo se uložit typ atributu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      attributeTypes: s.attributeTypes.map((at) => (at.id === attrTypeId ? { ...at, ...updates } : at)),
    }));
    toast.success('Typ atributu uložen');
    return { success: true };
  },

  deleteAttributeType: async (attrTypeId) => {
    const supabase = createClient();
    // Delete values first (FK cascade should handle it, but be explicit)
    await supabase.from('atributy_hodnoty').delete().eq('atribut_typ_id', attrTypeId);
    const { error } = await supabase.from('atributy_typy').delete().eq('id', attrTypeId);
    if (error) {
      logger.error('Failed to delete attribute type');
      toast.error('Nepodařilo se smazat typ atributu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      attributeTypes: s.attributeTypes.filter((at) => at.id !== attrTypeId),
      attributeValues: s.attributeValues.filter((av) => av.attributeTypeId !== attrTypeId),
    }));
    toast.success('Typ atributu smazán');
    return { success: true };
  },

  openAttributeTypeForm: (attrTypeId) => set({ isAttributeTypeFormOpen: true, editingAttributeTypeId: attrTypeId ?? null }),
  closeAttributeTypeForm: () => set({ isAttributeTypeFormOpen: false, editingAttributeTypeId: null }),

  // ===========================================================================
  // ATTRIBUTE VALUES CRUD
  // ===========================================================================

  createAttributeValue: async (data) => {
    const dbData = mapAttributeValueToDb({ ...data, id: 0 });
    delete dbData.id;
    const supabase = createClient();
    const { data: inserted, error } = await supabase.from('atributy_hodnoty').insert(dbData).select('*').single();
    if (error || !inserted) {
      logger.error('Failed to create attribute value');
      toast.error('Nepodařilo se vytvořit hodnotu atributu');
      return { success: false, error: error?.message ?? 'Unknown error' };
    }
    const value = mapDbToAttributeValue(inserted);
    set((s) => ({ attributeValues: [...s.attributeValues, value] }));
    return { success: true, valueId: value.id };
  },

  updateAttributeValue: async (valueId, updates) => {
    const dbData = mapAttributeValueToDb({ ...updates, id: valueId });
    delete dbData.id;
    const supabase = createClient();
    const { error } = await supabase.from('atributy_hodnoty').update(dbData).eq('id', valueId);
    if (error) {
      logger.error('Failed to update attribute value');
      toast.error('Nepodařilo se uložit hodnotu atributu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      attributeValues: s.attributeValues.map((av) => (av.id === valueId ? { ...av, ...updates } : av)),
    }));
    return { success: true };
  },

  deleteAttributeValue: async (valueId) => {
    const supabase = createClient();
    const { error } = await supabase.from('atributy_hodnoty').delete().eq('id', valueId);
    if (error) {
      logger.error('Failed to delete attribute value');
      toast.error('Nepodařilo se smazat hodnotu atributu');
      return { success: false, error: error.message };
    }
    set((s) => ({
      attributeValues: s.attributeValues.filter((av) => av.id !== valueId),
      variantAttributes: s.variantAttributes.filter((va) => va.attributeValueId !== valueId),
    }));
    toast.success('Hodnota smazána');
    return { success: true };
  },

  // ===========================================================================
  // GETTERS
  // ===========================================================================

  getProductById: (id) => get().products.find((p) => p.id === id),

  getVariantsForProduct: (productId) =>
    get().productVariants.filter((v) => v.productId === productId),

  getAttributesForVariant: (variantId) => {
    const { variantAttributes, attributeValues, attributeTypes } = get();
    return variantAttributes
      .filter((va) => va.variantId === variantId)
      .map((va) => {
        const value = attributeValues.find((v) => v.id === va.attributeValueId);
        const attribute = value ? attributeTypes.find((t) => t.id === value.attributeTypeId) : undefined;
        return attribute && value ? { attribute, value } : null;
      })
      .filter((x): x is { attribute: AttributeType; value: AttributeValue } => x !== null);
  },

  getImagesForProduct: (productId) =>
    get()
      .productImages.filter((i) => i.productId === productId)
      .sort((a, b) => a.order - b.order),

  getCategoriesForProduct: (productId) => {
    const { productCategories, categories } = get();
    const catIds = productCategories.filter((pc) => pc.productId === productId).map((pc) => pc.categoryId);
    return categories.filter((c) => catIds.includes(c.id));
  },

  getCategoryTree: () => buildCategoryTree(get().categories),

  getValuesForAttributeType: (attrTypeId) =>
    get()
      .attributeValues.filter((v) => v.attributeTypeId === attrTypeId)
      .sort((a, b) => a.order - b.order),

  getFilteredProducts: () => {
    const { products, productSearchQuery, productActiveFilter } = get();
    let filtered = products;

    if (productActiveFilter === 'active') {
      filtered = filtered.filter((p) => p.active);
    } else if (productActiveFilter === 'inactive') {
      filtered = filtered.filter((p) => !p.active);
    }

    if (productSearchQuery.trim()) {
      const q = productSearchQuery.toLowerCase();
      filtered = filtered.filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (p.sku && p.sku.toLowerCase().includes(q)) ||
          (p.brand && p.brand.toLowerCase().includes(q)) ||
          (p.ean && p.ean.includes(q)),
      );
    }

    return filtered.sort((a, b) => a.name.localeCompare(b.name, 'cs'));
  },

  // ===========================================================================
  // REVIEWS
  // ===========================================================================

  fetchReviews: async () => {
    set({ reviewsLoading: true });
    const supabase = createClient();
    const { data, error } = await supabase
      .from('recenze')
      .select('*')
      .order('vytvoreno', { ascending: false });

    if (error) {
      logger.error('Failed to fetch reviews', error);
      set({ reviewsLoading: false });
      return;
    }
    set({ reviews: (data || []).map(mapDbToReview), reviewsLoading: false });
  },

  approveReview: async (reviewId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recenze')
      .update({ schvaleno: true })
      .eq('id', reviewId);

    if (error) {
      toast.error('Nepodařilo se schválit recenzi');
      return { success: false, error: error.message };
    }

    set({
      reviews: get().reviews.map((r) =>
        r.id === reviewId ? { ...r, approved: true } : r
      ),
    });
    toast.success('Recenze schválena');
    return { success: true };
  },

  deleteReview: async (reviewId: number) => {
    const supabase = createClient();
    const { error } = await supabase
      .from('recenze')
      .delete()
      .eq('id', reviewId);

    if (error) {
      toast.error('Nepodařilo se smazat recenzi');
      return { success: false, error: error.message };
    }

    set({ reviews: get().reviews.filter((r) => r.id !== reviewId) });
    toast.success('Recenze smazána');
    return { success: true };
  },

  // ===========================================================================
  // REALTIME
  // ===========================================================================

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    const supabase = createClient();

    const channel = supabase
      .channel('eshop-produkty-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produkty' }, () => {
        get().fetchEshopProduktyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'produkty_varianty' }, () => {
        get().fetchEshopProduktyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'kategorie' }, () => {
        get().fetchEshopProduktyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atributy_typy' }, () => {
        get().fetchEshopProduktyData();
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'atributy_hodnoty' }, () => {
        get().fetchEshopProduktyData();
      })
      .subscribe((status, err) => {
        if (err) logger.error(`[eshop-produkty-realtime] ${status}:`, err);
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
