'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { generateSlug } from '@/features/eshop/eshop-produkty-helpers';
import { flattenCategoryTree } from '@/features/eshop/eshop-produkty-helpers';

interface Props {
  editingId: number | null;
  onClose: () => void;
}

export function CategoryFormModal({ editingId, onClose }: Props) {
  const { categories, getCategoryTree, createCategory, updateCategory } = useEshopProduktyStore();
  const existing = editingId ? categories.find((c) => c.id === editingId) : null;
  const flatTree = flattenCategoryTree(getCategoryTree());

  const [name, setName] = useState(existing?.name ?? '');
  const [slug, setSlug] = useState(existing?.slug ?? '');
  const [parentId, setParentId] = useState<number | undefined>(existing?.parentId);
  const [description, setDescription] = useState(existing?.description ?? '');
  const [order, setOrder] = useState(existing?.order ?? 0);
  const [active, setActive] = useState(existing?.active ?? true);
  const [slugManual, setSlugManual] = useState(!!existing);
  const [saving, setSaving] = useState(false);

  const handleNameChange = (value: string) => {
    setName(value);
    if (!slugManual) setSlug(generateSlug(value));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setSaving(true);

    if (existing) {
      await updateCategory(existing.id, { name, slug, parentId, description: description || undefined, order, active });
    } else {
      await createCategory({ name, slug, parentId, description: description || undefined, order, active });
    }
    setSaving(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="bg-white rounded-2xl p-8 w-full max-w-md shadow-lg animate-in fade-in zoom-in-95 duration-200" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">{existing ? 'Upravit kategorii' : 'Nová kategorie'}</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Název</label>
            <input
              type="text"
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="Např. E-cigarety, Likidy..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Slug</label>
            <input
              type="text"
              value={slug}
              onChange={(e) => { setSlug(e.target.value); setSlugManual(true); }}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Nadřazená kategorie</label>
            <select
              value={parentId ?? ''}
              onChange={(e) => setParentId(e.target.value ? Number(e.target.value) : undefined)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-semibold outline-none cursor-pointer focus:border-orange-300"
            >
              <option value="">Žádná (hlavní kategorie)</option>
              {flatTree
                .filter((c) => c.id !== editingId)
                .map((c) => (
                  <option key={c.id} value={c.id}>
                    {'  '.repeat(c.level)}
                    {c.name}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-600 mb-1">Popis</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none resize-none focus:border-orange-300"
            />
          </div>

          <div className="flex items-center gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium text-slate-600 mb-1">Pořadí</label>
              <input
                type="number"
                value={order}
                onChange={(e) => setOrder(Number(e.target.value))}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-base font-medium outline-none focus:border-orange-300"
              />
            </div>
            <label className="flex items-center gap-3 cursor-pointer pt-6">
              <input
                type="checkbox"
                checked={active}
                onChange={(e) => setActive(e.target.checked)}
                className="w-5 h-5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
              />
              <span className="text-sm font-medium text-slate-700">Aktivní</span>
            </label>
          </div>

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
      </div>
    </div>
  );
}
