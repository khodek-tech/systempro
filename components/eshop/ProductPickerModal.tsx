'use client';

import { useState } from 'react';
import { X, Search, Check } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';

interface Props {
  shopId: number;
}

export function ProductPickerModal({ shopId }: Props) {
  const { getUnassignedProducts, bulkAssignProducts, closeProductPicker } = useEshopEshopyStore();
  const { products } = useEshopProduktyStore();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [defaultPrice, setDefaultPrice] = useState(0);
  const [search, setSearch] = useState('');
  const [saving, setSaving] = useState(false);

  const available = getUnassignedProducts(shopId, products);
  const filtered = search
    ? available.filter(
        (p) =>
          p.name.toLowerCase().includes(search.toLowerCase()) ||
          p.sku?.toLowerCase().includes(search.toLowerCase()) ||
          p.brand?.toLowerCase().includes(search.toLowerCase())
      )
    : available;

  const toggleProduct = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const selectAll = () => {
    if (selectedIds.size === filtered.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;
    setSaving(true);
    await bulkAssignProducts(shopId, Array.from(selectedIds), defaultPrice);
    setSaving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-lg max-h-[80vh] flex flex-col animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Přidat produkty</h2>
          <button onClick={closeProductPicker} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Search + Price */}
        <div className="px-6 py-3 space-y-3 border-b border-slate-100">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat produkt..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="text-xs font-semibold uppercase tracking-wide text-slate-500 whitespace-nowrap">Výchozí cena</label>
            <input
              type="number"
              min={0}
              value={defaultPrice}
              onChange={(e) => setDefaultPrice(Number(e.target.value))}
              className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-right outline-none focus:border-emerald-300 w-32"
            />
            <span className="text-sm text-slate-500">Kč</span>
          </div>
        </div>

        {/* Product list */}
        <div className="flex-1 overflow-y-auto px-6 py-2">
          {filtered.length === 0 ? (
            <p className="text-center py-8 text-sm text-slate-400">
              {search ? 'Žádné produkty nenalezeny' : 'Všechny produkty jsou již přiřazeny'}
            </p>
          ) : (
            <>
              {/* Select all */}
              <button
                onClick={selectAll}
                className="flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs font-semibold text-slate-500 hover:bg-slate-50 transition-colors mb-1"
              >
                <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                  selectedIds.size === filtered.length ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                }`}>
                  {selectedIds.size === filtered.length && <Check className="w-3 h-3 text-white" />}
                </div>
                Vybrat vše ({filtered.length})
              </button>

              {filtered.map((product) => {
                const isSelected = selectedIds.has(product.id);
                return (
                  <button
                    key={product.id}
                    onClick={() => toggleProduct(product.id)}
                    className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-left transition-colors ${
                      isSelected ? 'bg-emerald-50' : 'hover:bg-slate-50'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-emerald-500 border-emerald-500' : 'border-slate-300'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-sm font-semibold text-slate-800 block truncate">{product.name}</span>
                      {product.sku && (
                        <span className="text-xs text-slate-400 font-mono">{product.sku}</span>
                      )}
                    </div>
                    {product.brand && (
                      <span className="text-xs text-slate-400">{product.brand}</span>
                    )}
                  </button>
                );
              })}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            Vybráno: <strong>{selectedIds.size}</strong>
          </span>
          <div className="flex items-center gap-3">
            <button onClick={closeProductPicker} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
              Zrušit
            </button>
            <button
              onClick={handleSubmit}
              disabled={saving || selectedIds.size === 0}
              className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {saving ? 'Přidávám...' : `Přidat ${selectedIds.size > 0 ? `(${selectedIds.size})` : ''}`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
