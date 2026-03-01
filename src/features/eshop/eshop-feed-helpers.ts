import Papa from 'papaparse';
import { createClient } from '@/lib/supabase/client';
import { mapProductToDb, mapProductVariantToDb } from '@/lib/supabase/mappers';
import { generateSlug } from './eshop-produkty-helpers';
import type { Product, ProductVariant } from '@/shared/types';

// =============================================================================
// TYPES
// =============================================================================

export interface ParsedFeedData {
  headers: string[];
  rows: Record<string, string>[];
  totalRows: number;
}

/** DB fields available for mapping */
export const MAPPABLE_FIELDS = [
  { value: '', label: 'Přeskočit' },
  { value: 'name', label: 'Název produktu' },
  { value: 'sku', label: 'SKU' },
  { value: 'ean', label: 'EAN' },
  { value: 'brand', label: 'Značka' },
  { value: 'manufacturer', label: 'Výrobce' },
  { value: 'baseDescription', label: 'Popis' },
  { value: 'baseShortDescription', label: 'Krátký popis' },
  { value: 'stock', label: 'Skladem (ks)' },
  { value: 'minStock', label: 'Min. skladem' },
  { value: 'weight', label: 'Hmotnost (kg)' },
  { value: 'basePrice', label: 'Základní cena (varianta)' },
  { value: 'variantName', label: 'Varianta – Název' },
  { value: 'variantSku', label: 'Varianta – SKU' },
  { value: 'variantEan', label: 'Varianta – EAN' },
  { value: 'variantStock', label: 'Varianta – Skladem' },
  { value: 'imageUrl', label: 'Obrázek (URL)' },
  { value: 'category', label: 'Kategorie' },
] as const;

export type MappableField = (typeof MAPPABLE_FIELDS)[number]['value'];

export type MatchField = 'sku' | 'ean' | 'name';

export interface FeedMapping {
  /** feedColumn → dbField */
  columnMap: Record<string, MappableField>;
  matchField: MatchField;
}

export interface ImportResult {
  newProducts: number;
  updatedProducts: number;
  errors: number;
  errorDetails: { row: number; message: string }[];
}

// =============================================================================
// CSV PARSING
// =============================================================================

export function parseCSV(
  file: File,
  delimiter: string = ';',
  encoding: string = 'utf-8',
): Promise<ParsedFeedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = Papa.parse<Record<string, string>>(text, {
        header: true,
        delimiter,
        skipEmptyLines: true,
        transformHeader: (h) => h.trim(),
      });

      if (result.errors.length > 0 && result.data.length === 0) {
        reject(new Error(`CSV parse error: ${result.errors[0]?.message ?? 'unknown'}`));
        return;
      }

      resolve({
        headers: result.meta.fields ?? [],
        rows: result.data,
        totalRows: result.data.length,
      });
    };
    reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor'));
    reader.readAsText(file, encoding);
  });
}

// =============================================================================
// XML PARSING
// =============================================================================

export function parseXML(file: File): Promise<ParsedFeedData> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(text, 'text/xml');

      const parseError = doc.querySelector('parsererror');
      if (parseError) {
        reject(new Error('Neplatný XML soubor'));
        return;
      }

      // Find repeating elements (items/products/entries)
      const root = doc.documentElement;
      const candidates = root.children;
      if (candidates.length === 0) {
        reject(new Error('XML neobsahuje žádné záznamy'));
        return;
      }

      // If root has children with the same tag name, those are the items
      // Otherwise, look one level deeper
      let items: Element[];
      const firstChildTag = candidates[0]?.tagName;
      const sameTagChildren = Array.from(candidates).filter((c) => c.tagName === firstChildTag);

      if (sameTagChildren.length > 1) {
        items = sameTagChildren;
      } else {
        // Try one level deeper (e.g., <products><product>...</product></products>)
        const container = candidates[0];
        if (container && container.children.length > 0) {
          const innerTag = container.children[0]?.tagName;
          items = Array.from(container.children).filter((c) => c.tagName === innerTag);
        } else {
          items = Array.from(candidates);
        }
      }

      if (items.length === 0) {
        reject(new Error('XML neobsahuje žádné záznamy'));
        return;
      }

      // Extract headers from first item's direct children
      const headers = Array.from(new Set(
        items.flatMap((item) =>
          Array.from(item.children).map((c) => c.tagName)
        )
      ));

      // Extract rows
      const rows = items.map((item) => {
        const row: Record<string, string> = {};
        for (const header of headers) {
          const el = item.querySelector(header);
          row[header] = el?.textContent?.trim() ?? '';
        }
        return row;
      });

      resolve({
        headers,
        rows,
        totalRows: rows.length,
      });
    };
    reader.onerror = () => reject(new Error('Nepodařilo se přečíst soubor'));
    reader.readAsText(file, 'utf-8');
  });
}

// =============================================================================
// IMPORT ENGINE
// =============================================================================

/**
 * Apply mapping to a single row → product data.
 */
function applyProductMapping(
  row: Record<string, string>,
  columnMap: Record<string, MappableField>,
): Partial<Product> & { _basePrice?: number; _variantName?: string; _variantSku?: string; _variantEan?: string; _variantStock?: number; _imageUrl?: string; _category?: string } {
  const result: Record<string, string | number | undefined> = {};

  for (const [feedCol, dbField] of Object.entries(columnMap)) {
    if (!dbField || !(feedCol in row)) continue;
    const val = row[feedCol]?.trim() ?? '';
    if (!val) continue;

    switch (dbField) {
      case 'name':
        result.name = val;
        break;
      case 'sku':
        result.sku = val;
        break;
      case 'ean':
        result.ean = val;
        break;
      case 'brand':
        result.brand = val;
        break;
      case 'manufacturer':
        result.manufacturer = val;
        break;
      case 'baseDescription':
        result.baseDescription = val;
        break;
      case 'baseShortDescription':
        result.baseShortDescription = val;
        break;
      case 'stock':
        result.stock = parseInt(val, 10) || 0;
        break;
      case 'minStock':
        result.minStock = parseInt(val, 10) || 0;
        break;
      case 'weight':
        result.weight = parseFloat(val) || undefined;
        break;
      case 'basePrice':
        result._basePrice = parseFloat(val.replace(',', '.')) || 0;
        break;
      case 'variantName':
        result._variantName = val;
        break;
      case 'variantSku':
        result._variantSku = val;
        break;
      case 'variantEan':
        result._variantEan = val;
        break;
      case 'variantStock':
        result._variantStock = parseInt(val, 10) || 0;
        break;
      case 'imageUrl':
        result._imageUrl = val;
        break;
      case 'category':
        result._category = val;
        break;
    }
  }

  return result;
}

/**
 * Run the import: parse rows with mapping, upsert products/variants.
 */
export async function importProducts(
  rows: Record<string, string>[],
  mapping: FeedMapping,
  feedId: number,
  onProgress?: (current: number, total: number) => void,
): Promise<ImportResult> {
  const supabase = createClient();
  const result: ImportResult = {
    newProducts: 0,
    updatedProducts: 0,
    errors: 0,
    errorDetails: [],
  };

  // 1. Fetch existing products for matching
  const { data: existingProducts } = await supabase
    .from('produkty')
    .select('id, nazev, sku, ean');

  const existingMap = new Map<string, number>();
  for (const p of existingProducts ?? []) {
    const key = mapping.matchField === 'sku' ? p.sku
      : mapping.matchField === 'ean' ? p.ean
      : p.nazev;
    if (key) existingMap.set(key.toLowerCase(), p.id);
  }

  // 2. Process rows
  const BATCH_SIZE = 50;
  for (let i = 0; i < rows.length; i++) {
    try {
      const mapped = applyProductMapping(rows[i], mapping.columnMap);

      // Determine match key
      const matchValue = mapping.matchField === 'sku' ? mapped.sku
        : mapping.matchField === 'ean' ? mapped.ean
        : mapped.name;

      if (!matchValue) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          message: `Chybí hodnota pro párování (${mapping.matchField})`,
        });
        continue;
      }

      if (!mapped.name && !existingMap.has(matchValue.toLowerCase())) {
        result.errors++;
        result.errorDetails.push({
          row: i + 1,
          message: 'Chybí název produktu pro nový produkt',
        });
        continue;
      }

      const existingId = existingMap.get(matchValue.toLowerCase());
      const { _basePrice, _variantName, _variantSku, _variantEan, _variantStock, _imageUrl, _category: _unusedCategory, ...productData } = mapped;
      void _unusedCategory;

      if (existingId) {
        // UPDATE existing product
        const dbData = mapProductToDb(productData as Partial<Product>);
        dbData.feed_id = String(feedId);
        const { error } = await supabase
          .from('produkty')
          .update(dbData)
          .eq('id', existingId);

        if (error) {
          result.errors++;
          result.errorDetails.push({ row: i + 1, message: error.message });
          continue;
        }

        // Update/create variant if variant fields present
        if (_basePrice !== undefined || _variantName) {
          await upsertVariant(supabase, existingId, {
            basePrice: _basePrice,
            name: _variantName,
            sku: _variantSku,
            ean: _variantEan,
            stock: _variantStock,
            feedId: String(feedId),
          });
        }

        result.updatedProducts++;
      } else {
        // INSERT new product
        const slug = generateSlug(mapped.name ?? matchValue);
        const dbData = mapProductToDb({
          ...productData as Partial<Product>,
          slug,
          active: true,
          stock: (productData as Partial<Product>).stock ?? 0,
          minStock: (productData as Partial<Product>).minStock ?? 0,
        });
        dbData.feed_id = String(feedId);

        const { data: inserted, error } = await supabase
          .from('produkty')
          .insert(dbData)
          .select('id')
          .single();

        if (error) {
          result.errors++;
          result.errorDetails.push({ row: i + 1, message: error.message });
          continue;
        }

        const newId = inserted.id;
        existingMap.set(matchValue.toLowerCase(), newId);

        // Create variant if variant fields present
        if (_basePrice !== undefined || _variantName) {
          await upsertVariant(supabase, newId, {
            basePrice: _basePrice ?? 0,
            name: _variantName ?? mapped.name ?? matchValue,
            sku: _variantSku,
            ean: _variantEan,
            stock: _variantStock,
            feedId: String(feedId),
          });
        }

        // Create image if URL present
        if (_imageUrl) {
          await supabase.from('produkty_obrazky').insert({
            produkt_id: newId,
            url: _imageUrl,
            poradi: 0,
            hlavni: true,
          });
        }

        result.newProducts++;
      }
    } catch (err) {
      result.errors++;
      result.errorDetails.push({
        row: i + 1,
        message: err instanceof Error ? err.message : 'Neznámá chyba',
      });
    }

    // Report progress every BATCH_SIZE rows
    if (onProgress && (i + 1) % BATCH_SIZE === 0) {
      onProgress(i + 1, rows.length);
    }
  }

  // Final progress
  if (onProgress) {
    onProgress(rows.length, rows.length);
  }

  return result;
}

// =============================================================================
// HELPERS
// =============================================================================

async function upsertVariant(
  supabase: ReturnType<typeof createClient>,
  productId: number,
  data: {
    basePrice?: number;
    name?: string;
    sku?: string;
    ean?: string;
    stock?: number;
    feedId: string;
  },
) {
  // Try to find existing variant by SKU
  if (data.sku) {
    const { data: existing } = await supabase
      .from('produkty_varianty')
      .select('id')
      .eq('produkt_id', productId)
      .eq('sku', data.sku)
      .limit(1)
      .single();

    if (existing) {
      const dbData = mapProductVariantToDb({
        basePrice: data.basePrice,
        name: data.name,
        ean: data.ean,
        stock: data.stock,
        feedId: data.feedId,
      } as Partial<ProductVariant>);
      await supabase.from('produkty_varianty').update(dbData).eq('id', existing.id);
      return;
    }
  }

  // Create new variant
  const slug = generateSlug(data.name ?? `varianta-${productId}`);
  const dbData = mapProductVariantToDb({
    productId,
    sku: data.sku,
    name: data.name ?? 'Výchozí varianta',
    slug,
    basePrice: data.basePrice ?? 0,
    stock: data.stock ?? 0,
    ean: data.ean,
    active: true,
    feedId: data.feedId,
  } as Partial<ProductVariant>);
  await supabase.from('produkty_varianty').insert(dbData);
}
