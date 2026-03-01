'use client';

import { useState } from 'react';
import { X, Sparkles } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { AiPreviewModal } from './AiPreviewModal';
import type { AiStatus, AiGeneratedProductTexts } from '@/shared/types';

const AI_STATUSES: { value: AiStatus; label: string }[] = [
  { value: 'ceka', label: 'Čeká na přetextování' },
  { value: 'generuje', label: 'Generuje se' },
  { value: 'vygenerovano', label: 'Vygenerováno' },
  { value: 'schvaleno', label: 'Schváleno' },
];

interface Props {
  shopProductId: number;
}

export function EshopProductDetailModal({ shopProductId }: Props) {
  const {
    shopProducts,
    updateShopProduct,
    closeShopProductDetail,
    getShopProductVariantsForShopProduct,
    upsertShopProductVariant,
    generateAiText,
    applyAiTexts,
    aiGenerating,
    isAiPreviewOpen,
    aiPreviewData,
    aiPreviewShopProductId,
    aiPreviewUsage,
    openAiPreview,
    closeAiPreview,
  } = useEshopEshopyStore();

  const { products, getVariantsForProduct } = useEshopProduktyStore();

  const shopProduct = shopProducts.find((sp) => sp.id === shopProductId);
  const product = shopProduct ? products.find((p) => p.id === shopProduct.productId) : null;
  const productVariants = product ? getVariantsForProduct(product.id) : [];
  const shopVariants = getShopProductVariantsForShopProduct(shopProductId);

  const [saving, setSaving] = useState(false);

  // Form state
  const [price, setPrice] = useState(shopProduct?.price ?? 0);
  const [priceBeforeDiscount, setPriceBeforeDiscount] = useState(shopProduct?.priceBeforeDiscount ?? undefined);
  const [nameOverride, setNameOverride] = useState(shopProduct?.nameOverride ?? '');
  const [shortDescription, setShortDescription] = useState(shopProduct?.shortDescription ?? '');
  const [longDescription, setLongDescription] = useState(shopProduct?.longDescription ?? '');
  const [seoTitle, setSeoTitle] = useState(shopProduct?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(shopProduct?.seoDescription ?? '');
  const [seoSlug, setSeoSlug] = useState(shopProduct?.seoSlug ?? '');
  const [aiStatus, setAiStatus] = useState<AiStatus>(shopProduct?.aiStatus ?? 'ceka');
  const [active, setActive] = useState(shopProduct?.active ?? true);
  const [order, setOrder] = useState(shopProduct?.order ?? 0);

  if (!shopProduct || !product) return null;

  const handleSubmit = async () => {
    setSaving(true);
    await updateShopProduct(shopProductId, {
      price,
      priceBeforeDiscount: priceBeforeDiscount || undefined,
      nameOverride: nameOverride || undefined,
      shortDescription: shortDescription || undefined,
      longDescription: longDescription || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      seoSlug: seoSlug || undefined,
      aiStatus,
      active,
      order,
    });
    setSaving(false);
  };

  const handleVariantPriceChange = async (variantId: number, newPrice: string) => {
    const val = newPrice ? Number(newPrice) : undefined;
    await upsertShopProductVariant(shopProductId, variantId, { priceOverride: val });
  };

  const handleVariantActiveToggle = async (variantId: number, currentActive: boolean) => {
    await upsertShopProductVariant(shopProductId, variantId, { active: !currentActive });
  };

  const handleGenerateAi = async () => {
    const result = await generateAiText(shopProductId);
    if (result.success && result.data) {
      openAiPreview(shopProductId, result.data, result.usage);
    }
  };

  const handleApplyAiTexts = async (selectedFields: Record<string, string>) => {
    // Apply to local form state
    if (selectedFields.shortDescription !== undefined) setShortDescription(selectedFields.shortDescription);
    if (selectedFields.longDescription !== undefined) setLongDescription(selectedFields.longDescription);
    if (selectedFields.seoTitle !== undefined) setSeoTitle(selectedFields.seoTitle);
    if (selectedFields.seoDescription !== undefined) setSeoDescription(selectedFields.seoDescription);

    // Save to DB with 'schvaleno' status
    await applyAiTexts(shopProductId, selectedFields as Partial<AiGeneratedProductTexts>);
    setAiStatus('schvaleno');
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const textareaClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[90vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">{product.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Nastavení pro e-shop</p>
          </div>
          <button onClick={closeShopProductDetail} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Cena (Kč)</label>
              <input type="number" min={0} value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Cena před slevou</label>
              <input
                type="number"
                min={0}
                value={priceBeforeDiscount ?? ''}
                onChange={(e) => setPriceBeforeDiscount(e.target.value ? Number(e.target.value) : undefined)}
                className={inputClass}
                placeholder="Nepovinné"
              />
            </div>
          </div>

          {/* Name override */}
          <div>
            <label className={labelClass}>Název override</label>
            <input type="text" value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} className={inputClass} placeholder={product.name} />
          </div>

          {/* Descriptions */}
          <div>
            <label className={labelClass}>Krátký popis</label>
            <textarea value={shortDescription} onChange={(e) => setShortDescription(e.target.value)} className={textareaClass} rows={2} />
          </div>
          <div>
            <label className={labelClass}>Dlouhý popis</label>
            <textarea value={longDescription} onChange={(e) => setLongDescription(e.target.value)} className={textareaClass} rows={5} />
          </div>

          {/* SEO */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">SEO</h3>
            <div>
              <label className={labelClass}>SEO Slug</label>
              <input type="text" value={seoSlug} onChange={(e) => setSeoSlug(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SEO Title</label>
              <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>SEO Description</label>
              <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={textareaClass} rows={2} />
            </div>
          </div>

          {/* Status */}
          <div className="grid grid-cols-2 gap-4 pt-2 border-t border-slate-100">
            <div>
              <label className={labelClass}>AI Status</label>
              <select
                value={aiStatus}
                onChange={(e) => setAiStatus(e.target.value as AiStatus)}
                className={inputClass}
              >
                {AI_STATUSES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelClass}>Pořadí</label>
              <input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputClass} />
            </div>
          </div>

          {/* Active toggle */}
          <div className="flex items-center gap-3">
            <label className={labelClass}>Aktivní</label>
            <button
              onClick={() => setActive(!active)}
              className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
            >
              <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
            </button>
          </div>

          {/* Variants */}
          {productVariants.length > 0 && (
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wide text-slate-400">Varianty ({productVariants.length})</h3>
              {productVariants.map((variant) => {
                const shopVariant = shopVariants.find((sv) => sv.variantId === variant.id);
                const isActive = shopVariant?.active ?? true;
                return (
                  <div key={variant.id} className="flex items-center gap-3 bg-slate-50 rounded-lg px-3 py-2">
                    <button
                      onClick={() => handleVariantActiveToggle(variant.id, isActive)}
                      className={`relative w-9 h-5 rounded-full transition-colors shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-slate-300'}`}
                    >
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isActive ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </button>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-medium text-slate-700 truncate block">{variant.name}</span>
                      <span className="text-xs text-slate-400">Základ: {variant.basePrice} Kč</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <input
                        type="number"
                        min={0}
                        value={shopVariant?.priceOverride ?? ''}
                        onChange={(e) => handleVariantPriceChange(variant.id, e.target.value)}
                        placeholder={String(variant.basePrice)}
                        className="bg-white border border-slate-200 rounded-lg px-2 py-1 text-sm font-bold text-right outline-none focus:border-emerald-300 w-24"
                      />
                      <span className="text-xs text-slate-400">Kč</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <button
            onClick={handleGenerateAi}
            disabled={aiGenerating || aiStatus === 'generuje'}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold bg-purple-600 text-white hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-4 h-4" />
            {aiGenerating ? 'Generuji...' : 'AI Přetextovat'}
          </button>
          <div className="flex items-center gap-3">
            <button onClick={closeShopProductDetail} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Zrušit
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50"
            >
              {saving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </div>
      </div>

      {/* AI Preview Modal */}
      {isAiPreviewOpen && aiPreviewShopProductId === shopProductId && aiPreviewData && (
        <AiPreviewModal
          title={product.name}
          fields={[
            { key: 'shortDescription', label: 'Krátký popis', original: shortDescription, generated: aiPreviewData.shortDescription },
            { key: 'longDescription', label: 'Dlouhý popis', original: longDescription, generated: aiPreviewData.longDescription, multiline: true },
            { key: 'seoTitle', label: 'SEO Title', original: seoTitle, generated: aiPreviewData.seoTitle },
            { key: 'seoDescription', label: 'SEO Description', original: seoDescription, generated: aiPreviewData.seoDescription },
          ]}
          usage={aiPreviewUsage ?? undefined}
          onApply={handleApplyAiTexts}
          onReject={closeAiPreview}
        />
      )}
    </div>
  );
}
