'use client';

import { useState } from 'react';
import { Search, Plus, Pencil, Trash2, Sparkles, X, Check } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { useEshopProduktyStore } from '@/stores/eshop-produkty-store';
import { ProductPickerModal } from './ProductPickerModal';
import { EshopProductDetailModal } from './EshopProductDetailModal';
import type { AiStatus } from '@/shared/types';

const AI_STATUS_LABELS: Record<AiStatus, { label: string; className: string }> = {
  ceka: { label: 'Čeká', className: 'bg-orange-50 text-orange-600' },
  generuje: { label: 'Generuje', className: 'bg-blue-50 text-blue-600' },
  vygenerovano: { label: 'Vygenerováno', className: 'bg-green-50 text-green-600' },
  schvaleno: { label: 'Schváleno', className: 'bg-emerald-50 text-emerald-700' },
};

export function EshopProductManager() {
  const {
    selectedShopId,
    getFilteredShopProducts,
    shopProductSearchQuery,
    setShopProductSearch,
    openProductPicker,
    removeProductFromShop,
    openShopProductDetail,
    isProductPickerOpen,
    isShopProductDetailOpen,
    editingShopProductId,
    bulkGenerateAiText,
    aiBulkProgress,
    closeBulkProgress,
    aiGenerating,
  } = useEshopEshopyStore();

  const { products } = useEshopProduktyStore();
  const shopProducts = getFilteredShopProducts();

  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [aiStatusFilter, setAiStatusFilter] = useState<AiStatus | 'all'>('all');

  const filteredByAi = aiStatusFilter === 'all'
    ? shopProducts
    : shopProducts.filter((sp) => sp.aiStatus === aiStatusFilter);

  const allSelected = filteredByAi.length > 0 && filteredByAi.every((sp) => selectedIds.has(sp.id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredByAi.map((sp) => sp.id)));
    }
  };

  const toggleSelect = (id: number) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkGenerate = () => {
    const ids = [...selectedIds];
    setSelectedIds(new Set());
    bulkGenerateAiText(ids);
  };

  const getProductName = (productId: number) => {
    return products.find((p) => p.id === productId)?.name ?? `Produkt #${productId}`;
  };

  const getProductSku = (productId: number) => {
    return products.find((p) => p.id === productId)?.sku;
  };

  if (!selectedShopId) return null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Hledat produkt..."
              value={shopProductSearchQuery}
              onChange={(e) => setShopProductSearch(e.target.value)}
              className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-60"
            />
          </div>
          <select
            value={aiStatusFilter}
            onChange={(e) => setAiStatusFilter(e.target.value as AiStatus | 'all')}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none cursor-pointer focus:border-emerald-300"
          >
            <option value="all">AI: Vše</option>
            <option value="ceka">AI: Čeká</option>
            <option value="generuje">AI: Generuje</option>
            <option value="vygenerovano">AI: Vygenerováno</option>
            <option value="schvaleno">AI: Schváleno</option>
          </select>
        </div>
        <button
          onClick={openProductPicker}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Přidat produkty
        </button>
      </div>

      {/* Bulk toolbar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-purple-50 border border-purple-200 rounded-lg px-4 py-2.5">
          <span className="text-sm font-semibold text-purple-700">{selectedIds.size} vybráno</span>
          <button
            onClick={handleBulkGenerate}
            disabled={aiGenerating}
            className="flex items-center gap-2 px-3 py-1.5 bg-purple-600 text-white rounded-lg text-sm font-semibold hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            AI Přetextovat
          </button>
          <button
            onClick={() => setSelectedIds(new Set())}
            className="ml-auto p-1 rounded hover:bg-purple-100 transition-colors"
          >
            <X className="w-4 h-4 text-purple-400" />
          </button>
        </div>
      )}

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="w-10 px-3 py-3">
                <button
                  onClick={toggleSelectAll}
                  className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${allSelected && filteredByAi.length > 0 ? 'bg-purple-600 border-purple-600' : 'border-slate-300 hover:border-slate-400'}`}
                >
                  {allSelected && filteredByAi.length > 0 && <Check className="w-3 h-3 text-white" />}
                </button>
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Produkt</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">SKU</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Cena</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">AI Status</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Stav</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Akce</th>
            </tr>
          </thead>
          <tbody>
            {filteredByAi.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-slate-400 text-sm">
                  {shopProductSearchQuery || aiStatusFilter !== 'all' ? 'Žádné produkty nenalezeny' : 'Zatím žádné přiřazené produkty'}
                </td>
              </tr>
            ) : (
              filteredByAi.map((sp) => {
                const aiInfo = AI_STATUS_LABELS[sp.aiStatus] ?? AI_STATUS_LABELS.ceka;
                const isChecked = selectedIds.has(sp.id);
                return (
                  <tr
                    key={sp.id}
                    onClick={() => openShopProductDetail(sp.id)}
                    className={`border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors ${isChecked ? 'bg-purple-50/50' : ''}`}
                  >
                    <td className="px-3 py-3">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSelect(sp.id); }}
                        className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-colors ${isChecked ? 'bg-purple-600 border-purple-600' : 'border-slate-300 hover:border-slate-400'}`}
                      >
                        {isChecked && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </td>
                    <td className="px-4 py-3">
                      <div>
                        <span className="text-sm font-semibold text-slate-800">
                          {sp.nameOverride || getProductName(sp.productId)}
                        </span>
                        {sp.nameOverride && (
                          <span className="text-xs text-slate-400 ml-2">({getProductName(sp.productId)})</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-sm font-medium text-slate-500 font-mono">{getProductSku(sp.productId) ?? '—'}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className="text-sm font-bold text-slate-800">{sp.price} Kč</span>
                        {sp.priceBeforeDiscount && (
                          <span className="text-xs text-slate-400 line-through">{sp.priceBeforeDiscount} Kč</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold ${aiInfo.className}`}>
                        {aiInfo.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      {sp.active ? (
                        <span className="inline-flex items-center text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">Aktivní</span>
                      ) : (
                        <span className="inline-flex items-center text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">Neaktivní</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={(e) => { e.stopPropagation(); openShopProductDetail(sp.id); }}
                          className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="Upravit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (confirm('Opravdu odebrat produkt z e-shopu?')) {
                              removeProductFromShop(sp.id);
                            }
                          }}
                          className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                          title="Odebrat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      {isProductPickerOpen && <ProductPickerModal shopId={selectedShopId} />}
      {isShopProductDetailOpen && editingShopProductId && (
        <EshopProductDetailModal shopProductId={editingShopProductId} />
      )}

      {/* Bulk AI Progress */}
      {aiBulkProgress && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl p-8 w-full max-w-md animate-in slide-in-from-top-2 duration-300">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-600" />
              </div>
              <h3 className="text-lg font-bold text-slate-800">AI Generování</h3>
            </div>
            <div className="w-full bg-slate-200 rounded-full h-3 mb-2">
              <div
                className="bg-purple-600 h-3 rounded-full transition-all duration-300"
                style={{ width: `${(aiBulkProgress.current / aiBulkProgress.total) * 100}%` }}
              />
            </div>
            <p className="text-sm font-medium text-slate-600 mb-1">
              {aiBulkProgress.current} / {aiBulkProgress.total} produktů
            </p>
            {aiBulkProgress.errors.length > 0 && (
              <div className="mt-3 bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-xs font-semibold text-red-600 mb-1">{aiBulkProgress.errors.length} chyb:</p>
                {aiBulkProgress.errors.slice(0, 5).map((err, i) => (
                  <p key={i} className="text-xs text-red-500 truncate">{err}</p>
                ))}
              </div>
            )}
            {aiBulkProgress.current >= aiBulkProgress.total && (
              <button
                onClick={closeBulkProgress}
                className="mt-4 w-full px-4 py-2 rounded-lg text-sm font-semibold bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
              >
                Zavřít
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
