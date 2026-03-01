'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';
import { ProductVariantsSection } from './ProductVariantsSection';
import { ProductImagesSection } from './ProductImagesSection';
import { ProductCategoryPicker } from './ProductCategoryPicker';

interface Props {
  editingId: number | null;
  onClose: () => void;
}

export function ProductFormModal({ editingId, onClose }: Props) {
  const { products, createProduct, updateProduct } = useEshopProduktyStore();
  const existing = editingId ? products.find((p) => p.id === editingId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [sku, setSku] = useState(existing?.sku ?? '');
  const [brand, setBrand] = useState(existing?.brand ?? '');
  const [manufacturer, setManufacturer] = useState(existing?.manufacturer ?? '');
  const [ean, setEan] = useState(existing?.ean ?? '');
  const [weight, setWeight] = useState(existing?.weight?.toString() ?? '');
  const [baseDescription, setBaseDescription] = useState(existing?.baseDescription ?? '');
  const [baseShortDescription, setBaseShortDescription] = useState(existing?.baseShortDescription ?? '');
  const [stock, setStock] = useState(existing?.stock ?? 0);
  const [minStock, setMinStock] = useState(existing?.minStock ?? 0);
  const [active, setActive] = useState(existing?.active ?? true);
  const [slugManual, setSlugManual] = useState(!!existing);
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<'basic' | 'variants' | 'images' | 'categories'>('basic');

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    const data = {
      name,
      slug,
      sku: sku || undefined,
      brand: brand || undefined,
      manufacturer: manufacturer || undefined,
      ean: ean || undefined,
      weight: weight ? Number(weight) : undefined,
      baseDescription: baseDescription || undefined,
      baseShortDescription: baseShortDescription || undefined,
      stock,
      minStock,
      active,
    };

    if (existing) {
      await updateProduct(existing.id, data);
    } else {
      await createProduct(data);
    }
    setSaving(false);
    onClose();
  };

  const SECTIONS = [
    { id: 'basic' as const, label: 'Základní údaje' },
    ...(existing
      ? [
          { id: 'variants' as const, label: 'Varianty' },
          { id: 'images' as const, label: 'Obrázky' },
          { id: 'categories' as const, label: 'Kategorie' },
        ]
      : []),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div
        className="bg-white rounded-2xl w-full max-w-[900px] max-h-[90vh] shadow-lg animate-in fade-in zoom-in-95 duration-200 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-8 py-5 border-b border-slate-200">
          <h2 className="text-2xl font-bold text-slate-800">
            {existing ? `Upravit: ${existing.name}` : 'Nový produkt'}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Section tabs (only for existing product) */}
        {SECTIONS.length > 1 && (
          <div className="flex items-center gap-1 px-8 pt-4 pb-2">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(s.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === s.id
                    ? 'bg-emerald-50 text-emerald-700'
                    : 'text-slate-500 hover:text-slate-700 hover:bg-slate-50'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-8 py-5">
          {activeSection === 'basic' && (
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Name & Slug */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Název *</label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => handleNameChange(e.target.value)}
                    placeholder="Název produktu"
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Slug *</label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              {/* SKU, Brand, Manufacturer */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">SKU</label>
                  <input
                    type="text"
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Značka</label>
                  <input
                    type="text"
                    value={brand}
                    onChange={(e) => setBrand(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Výrobce</label>
                  <input
                    type="text"
                    value={manufacturer}
                    onChange={(e) => setManufacturer(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              {/* EAN & Weight */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">EAN</label>
                  <input
                    type="text"
                    value={ean}
                    onChange={(e) => setEan(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Hmotnost (g)</label>
                  <input
                    type="number"
                    value={weight}
                    onChange={(e) => setWeight(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
              </div>

              {/* Short description */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Krátký popis</label>
                <textarea
                  value={baseShortDescription}
                  onChange={(e) => setBaseShortDescription(e.target.value)}
                  rows={2}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none resize-none focus:border-orange-300"
                />
              </div>

              {/* Long description */}
              <div>
                <label className="block text-sm font-medium text-slate-600 mb-1">Základní popis</label>
                <textarea
                  value={baseDescription}
                  onChange={(e) => setBaseDescription(e.target.value)}
                  rows={4}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none resize-none focus:border-orange-300"
                />
              </div>

              {/* Stock */}
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Skladem</label>
                  <input
                    type="number"
                    value={stock}
                    onChange={(e) => setStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600 mb-1">Min. skladem</label>
                  <input
                    type="number"
                    value={minStock}
                    onChange={(e) => setMinStock(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
                  />
                </div>
                <label className="flex items-center gap-3 cursor-pointer pt-7">
                  <input
                    type="checkbox"
                    checked={active}
                    onChange={(e) => setActive(e.target.checked)}
                    className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="text-sm font-medium text-slate-700">Aktivní</span>
                </label>
              </div>

              {/* Submit */}
              <div className="flex items-center gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 bg-slate-100 text-slate-700 px-4 py-3 rounded-lg font-medium hover:bg-slate-200 transition-colors"
                >
                  Zrušit
                </button>
                <button
                  type="submit"
                  disabled={saving || !name.trim()}
                  className="flex-1 bg-emerald-600 text-white px-4 py-3 rounded-lg font-semibold hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
                >
                  {saving ? 'Ukládám...' : existing ? 'Uložit' : 'Vytvořit'}
                </button>
              </div>
            </form>
          )}

          {activeSection === 'variants' && existing && (
            <ProductVariantsSection productId={existing.id} />
          )}

          {activeSection === 'images' && existing && (
            <ProductImagesSection productId={existing.id} />
          )}

          {activeSection === 'categories' && existing && (
            <div className="space-y-3">
              <h3 className="text-base font-semibold text-slate-800">Kategorie produktu</h3>
              <ProductCategoryPicker productId={existing.id} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
