'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';

interface Props {
  shopCategoryId: number;
}

export function EshopCategoryFormModal({ shopCategoryId }: Props) {
  const { shopCategories, updateShopCategory, closeShopCategoryForm } = useEshopEshopyStore();
  const { categories } = useEshopProduktyStore();

  const shopCat = shopCategories.find((sc) => sc.id === shopCategoryId);
  const globalCat = shopCat ? categories.find((c) => c.id === shopCat.categoryId) : null;

  const [saving, setSaving] = useState(false);
  const [nameOverride, setNameOverride] = useState(shopCat?.nameOverride ?? '');
  const [descriptionOverride, setDescriptionOverride] = useState(shopCat?.descriptionOverride ?? '');
  const [seoTitle, setSeoTitle] = useState(shopCat?.seoTitle ?? '');
  const [seoDescription, setSeoDescription] = useState(shopCat?.seoDescription ?? '');
  const [order, setOrder] = useState(shopCat?.order ?? 0);
  const [active, setActive] = useState(shopCat?.active ?? true);

  if (!shopCat || !globalCat) return null;

  const handleSubmit = async () => {
    setSaving(true);
    await updateShopCategory(shopCategoryId, {
      nameOverride: nameOverride || undefined,
      descriptionOverride: descriptionOverride || undefined,
      seoTitle: seoTitle || undefined,
      seoDescription: seoDescription || undefined,
      order,
      active,
    });
    setSaving(false);
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const textareaClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none resize-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Kategorie: {globalCat.name}</h2>
            <p className="text-xs text-slate-400 mt-0.5">Override pro e-shop</p>
          </div>
          <button onClick={closeShopCategoryForm} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className={labelClass}>Název override</label>
            <input type="text" value={nameOverride} onChange={(e) => setNameOverride(e.target.value)} className={inputClass} placeholder={globalCat.name} />
          </div>
          <div>
            <label className={labelClass}>Popis override</label>
            <textarea value={descriptionOverride} onChange={(e) => setDescriptionOverride(e.target.value)} className={textareaClass} rows={3} placeholder={globalCat.description ?? ''} />
          </div>
          <div>
            <label className={labelClass}>SEO Title</label>
            <input type="text" value={seoTitle} onChange={(e) => setSeoTitle(e.target.value)} className={inputClass} />
          </div>
          <div>
            <label className={labelClass}>SEO Description</label>
            <textarea value={seoDescription} onChange={(e) => setSeoDescription(e.target.value)} className={textareaClass} rows={2} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>Pořadí</label>
              <input type="number" min={0} value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputClass} />
            </div>
            <div className="flex items-center gap-3 pt-5">
              <label className={labelClass}>Aktivní</label>
              <button
                onClick={() => setActive(!active)}
                className={`relative w-11 h-6 rounded-full transition-colors ${active ? 'bg-emerald-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-5' : 'translate-x-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={closeShopCategoryForm} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
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
  );
}
