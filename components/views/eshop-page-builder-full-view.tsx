'use client';

import { ArrowLeft, LayoutGrid } from 'lucide-react';
import { useEshopPageBuilderStore } from '@/stores/eshop-page-builder-store';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { PageBlockList } from '@/components/eshop/PageBlockList';

export function EshopPageBuilderFullView() {
  const { closePageBuilderView, selectedShopId, selectedPage, selectShop, selectPage, getBlocksForCurrentPage } = useEshopPageBuilderStore();
  const { eshops } = useEshopEshopyStore();
  const blocks = getBlocksForCurrentPage();

  return (
    <main className="flex-1 flex flex-col bg-slate-50 overflow-hidden">
      {/* Header */}
      <div className="flex-shrink-0 bg-white border-b border-slate-200 px-6 py-4">
        <div className="flex items-center gap-4">
          <button
            onClick={closePageBuilderView}
            className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Zpět
          </button>

          <div className="flex items-center gap-2">
            <LayoutGrid className="w-5 h-5 text-emerald-600" />
            <h1 className="text-lg font-bold text-slate-800">Page Builder</h1>
          </div>

          <div className="h-6 w-px bg-slate-200" />

          {/* E-shop selector */}
          <select
            value={selectedShopId ?? ''}
            onChange={(e) => selectShop(e.target.value ? Number(e.target.value) : null)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none cursor-pointer focus:border-orange-300"
          >
            <option value="">Vyberte e-shop</option>
            {eshops
              .filter((e) => e.active)
              .map((eshop) => (
                <option key={eshop.id} value={eshop.id}>
                  {eshop.name}
                </option>
              ))}
          </select>

          {/* Page selector */}
          <select
            value={selectedPage}
            onChange={(e) => selectPage(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-semibold outline-none cursor-pointer focus:border-orange-300"
          >
            <option value="homepage">Homepage</option>
          </select>

          {/* Block count indicator */}
          {selectedShopId && (
            <div className="flex items-center gap-2 ml-auto">
              <span className="text-sm text-slate-500">
                {blocks.length} {blocks.length === 1 ? 'blok' : blocks.length >= 2 && blocks.length <= 4 ? 'bloky' : 'bloků'}
              </span>
              {selectedShopId && (
                <span className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span className="text-sm font-medium text-slate-600">
                    {eshops.find((e) => e.id === selectedShopId)?.name}
                  </span>
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        {!selectedShopId ? (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-20 h-20 rounded-2xl bg-slate-100 flex items-center justify-center mb-4">
              <LayoutGrid className="w-10 h-10 text-slate-300" />
            </div>
            <p className="text-lg font-semibold text-slate-600 mb-1">Vyberte e-shop</p>
            <p className="text-sm text-slate-400">Zvolte e-shop pro správu bloků stránek</p>
          </div>
        ) : (
          <div className="max-w-3xl mx-auto">
            <PageBlockList />
          </div>
        )}
      </div>
    </main>
  );
}
