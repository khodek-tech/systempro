'use client';

import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { EshopFormModal } from './EshopFormModal';

export function EshopList() {
  const {
    getFilteredEshops,
    eshopSearchQuery,
    setEshopSearch,
    openEshopForm,
    deleteEshop,
    selectShop,
    setActiveTab,
    isEshopFormOpen,
    shopProducts,
  } = useEshopEshopyStore();

  const eshops = getFilteredEshops();

  const handleRowClick = (shopId: number) => {
    selectShop(shopId);
    setActiveTab('produkty');
  };

  const getProductCount = (shopId: number) => {
    return shopProducts.filter((sp) => sp.shopId === shopId).length;
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat e-shop..."
            value={eshopSearchQuery}
            onChange={(e) => setEshopSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-72"
          />
        </div>
        <button
          onClick={() => openEshopForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Nový e-shop
        </button>
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Název
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Doména
              </th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Barva
              </th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Produktů
              </th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Stav
              </th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {eshops.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12 text-slate-400 text-sm">
                  {eshopSearchQuery ? 'Žádné e-shopy nenalezeny' : 'Zatím žádné e-shopy'}
                </td>
              </tr>
            ) : (
              eshops.map((eshop) => (
                <tr
                  key={eshop.id}
                  onClick={() => handleRowClick(eshop.id)}
                  className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3">
                    <span className="text-sm font-semibold text-slate-800">{eshop.name}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-medium text-slate-500">{eshop.domain}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: eshop.primaryColor }}
                      />
                      <div
                        className="w-5 h-5 rounded-full border border-slate-200"
                        style={{ backgroundColor: eshop.secondaryColor }}
                      />
                    </div>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center justify-center min-w-[28px] h-6 px-2 rounded-full text-xs font-bold bg-slate-100 text-slate-600">
                      {getProductCount(eshop.id)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    {eshop.active ? (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-50 px-2 py-1 rounded-full">
                        Aktivní
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-slate-400 bg-slate-100 px-2 py-1 rounded-full">
                        Neaktivní
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openEshopForm(eshop.id);
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Upravit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm(`Opravdu smazat e-shop "${eshop.name}"? Tím se smažou i všechna přiřazení produktů a kategorií.`)) {
                            deleteEshop(eshop.id);
                          }
                        }}
                        className="p-2 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Smazat"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Form Modal */}
      {isEshopFormOpen && <EshopFormModal />}
    </div>
  );
}
