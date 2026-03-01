/**
 * E-shop platform types
 */

// =============================================================================
// E-SHOP
// =============================================================================

export interface Eshop {
  id: number;
  name: string;
  domain: string;
  slug: string;
  logoUrl?: string;
  faviconUrl?: string;
  primaryColor: string;
  secondaryColor: string;
  font: string;
  toneOfVoice?: string;
  targetAudience?: string;
  aiInstructions?: string;
  contactEmail?: string;
  contactPhone?: string;
  ico?: string;
  dic?: string;
  companyName?: string;
  companyAddress?: string;
  termsAndConditions?: string;
  gdprText?: string;
  seoTitleTemplate?: string;
  seoDescriptionTemplate?: string;
  senderEmail?: string;
  senderName?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// PRODUCTS
// =============================================================================

export interface Product {
  id: number;
  sku?: string;
  name: string;
  slug: string;
  brand?: string;
  manufacturer?: string;
  ean?: string;
  weight?: number;
  dimensions?: Record<string, number>;
  baseDescription?: string;
  baseShortDescription?: string;
  stock: number;
  minStock: number;
  active: boolean;
  feedId?: string;
  feedData?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type AttributeDisplayType = 'color_swatch' | 'dropdown' | 'buttons';

export interface AttributeType {
  id: number;
  name: string;
  slug: string;
  displayType: AttributeDisplayType;
  expandInCategory: boolean;
  order: number;
  createdAt: string;
}

export interface AttributeValue {
  id: number;
  attributeTypeId: number;
  value: string;
  slug: string;
  hexColor?: string;
  order: number;
}

export interface ProductVariant {
  id: number;
  productId: number;
  sku?: string;
  name: string;
  slug: string;
  basePrice: number;
  stock: number;
  ean?: string;
  active: boolean;
  feedId?: string;
  createdAt: string;
  updatedAt: string;
}

export interface VariantAttribute {
  id: number;
  variantId: number;
  attributeValueId: number;
}

export interface ProductImage {
  id: number;
  productId: number;
  variantId?: number;
  url: string;
  altText?: string;
  order: number;
  isMain: boolean;
}

// =============================================================================
// CATEGORIES
// =============================================================================

export interface Category {
  id: number;
  name: string;
  slug: string;
  parentId?: number;
  description?: string;
  order: number;
  active: boolean;
}

export interface ShopCategory {
  id: number;
  shopId: number;
  categoryId: number;
  nameOverride?: string;
  descriptionOverride?: string;
  seoTitle?: string;
  seoDescription?: string;
  order: number;
  active: boolean;
}

export interface ProductCategory {
  id: number;
  productId: number;
  categoryId: number;
  order: number;
}

// =============================================================================
// SHOP ↔ PRODUCTS
// =============================================================================

export type AiStatus = 'ceka' | 'generuje' | 'vygenerovano' | 'schvaleno';

export interface ShopProduct {
  id: number;
  shopId: number;
  productId: number;
  price: number;
  priceBeforeDiscount?: number;
  nameOverride?: string;
  shortDescription?: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  seoSlug?: string;
  aiStatus: AiStatus;
  active: boolean;
  order: number;
  createdAt: string;
  updatedAt: string;
}

export interface ShopProductVariant {
  id: number;
  shopProductId: number;
  variantId: number;
  priceOverride?: number;
  active: boolean;
}

// =============================================================================
// CUSTOMERS
// =============================================================================

export interface Customer {
  id: number;
  shopId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  ageVerified: boolean;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
}

export type AddressType = 'fakturacni' | 'dodaci';

export interface CustomerAddress {
  id: number;
  customerId: number;
  type: AddressType;
  firstName?: string;
  lastName?: string;
  street?: string;
  city?: string;
  zip?: string;
  country: string;
  isDefault: boolean;
}

// =============================================================================
// ORDERS
// =============================================================================

export type OrderStatus = 'nova' | 'zaplacena' | 'expedovana' | 'dorucena' | 'zrusena';
export type ShippingType = 'zasilkovna' | 'ppl' | 'dpd' | 'osobni' | 'ceska_posta';
export type PaymentType = 'kartou' | 'prevodem' | 'dobirka' | 'comgate' | 'stripe';

export interface Order {
  id: number;
  shopId: number;
  customerId?: number;
  orderNumber: string;
  status: OrderStatus;
  totalPrice: number;
  shippingPrice: number;
  paymentPrice: number;
  shippingType?: string;
  paymentType?: string;
  trackingNumber?: string;
  note?: string;
  internalNote?: string;
  pohodaExported: boolean;
  assignedTo?: number;
  billingAddress?: Record<string, string>;
  shippingAddress?: Record<string, string>;
  createdAt: string;
  updatedAt: string;
}

export interface OrderItem {
  id: number;
  orderId: number;
  productId?: number;
  variantId?: number;
  name: string;
  price: number;
  quantity: number;
  total: number;
}

export interface OrderHistory {
  id: number;
  orderId: number;
  statusFrom?: string;
  statusTo: string;
  note?: string;
  changedBy?: number;
  createdAt: string;
}

// =============================================================================
// SHIPPING & PAYMENT
// =============================================================================

export interface ShopShipping {
  id: number;
  shopId: number;
  name: string;
  type: string;
  price: number;
  freeFrom?: number;
  config: Record<string, unknown>;
  active: boolean;
  order: number;
}

export interface ShopPayment {
  id: number;
  shopId: number;
  name: string;
  type: string;
  price: number;
  config: Record<string, unknown>;
  active: boolean;
  order: number;
}

// =============================================================================
// PAGE BUILDER
// =============================================================================

export interface BlockType {
  id: number;
  name: string;
  slug: string;
  description?: string;
  defaultConfig: Record<string, unknown>;
  configSchema: Record<string, unknown>;
}

export interface PageBlock {
  id: number;
  shopId: number;
  page: string;
  pageId?: number;
  blockTypeId: number;
  config: Record<string, unknown>;
  order: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// BLOG
// =============================================================================

export type BlogPostStatus = 'koncept' | 'planovany' | 'publikovano';

export interface BlogPost {
  id: number;
  shopId: number;
  title: string;
  slug: string;
  shortDescription?: string;
  content?: string;
  imageUrl?: string;
  seoTitle?: string;
  seoDescription?: string;
  authorId?: number;
  status: BlogPostStatus;
  publishedAt?: string;
  tags: string[];
  aiStatus?: AiStatus;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// AI GENERATED TEXTS
// =============================================================================

export interface AiGeneratedProductTexts {
  shortDescription: string;
  longDescription: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AiGeneratedBlogTexts {
  shortDescription: string;
  content: string;
  seoTitle: string;
  seoDescription: string;
}

export interface AiUsage {
  inputTokens: number;
  outputTokens: number;
  durationMs: number;
}

// =============================================================================
// AI KONFIGURACE
// =============================================================================

export interface AiKonfigurace {
  id: number;
  key: string;
  value: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

// =============================================================================
// FEED IMPORT
// =============================================================================

export type FeedType = 'csv' | 'xml';

export interface FeedConfig {
  id: number;
  name: string;
  url?: string;
  type: FeedType;
  delimiter: string;
  encoding: string;
  mapping: Record<string, string>;
  autoSync: boolean;
  syncInterval: string;
  lastSync?: string;
  lastSyncStatus?: string;
  lastSyncLog?: string;
  active: boolean;
  createdAt: string;
}

export interface FeedLog {
  id: number;
  feedId: number;
  type: string;
  status: string;
  newProducts: number;
  updatedProducts: number;
  errors: number;
  details?: Record<string, unknown>;
  startedAt: string;
  completedAt?: string;
}

// =============================================================================
// REDIRECTS
// =============================================================================

export interface Redirect {
  id: number;
  shopId: number;
  oldUrl: string;
  newUrl: string;
  type: number;
  createdAt: string;
}

// =============================================================================
// REVIEWS
// =============================================================================

export interface Review {
  id: number;
  shopId: number;
  productId: number;
  customerId?: number;
  name: string;
  email?: string;
  rating: number;
  text?: string;
  approved: boolean;
  createdAt: string;
}
