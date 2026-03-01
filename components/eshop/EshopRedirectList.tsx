'use client';

import { Search, Plus, Pencil, Trash2 } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';
import { EshopRedirectFormModal } from './EshopRedirectFormModal';

export function EshopRedirectList() {
  const {
    selectedShopId,
    getFilteredRedirects,
    redirectSearchQuery,
    setRedirectSearch,
    openRedirectForm,
    deleteRedirect,
    isRedirectFormOpen,
  } = useEshopEshopyStore();

  const redirects = getFilteredRedirects();

  if (!selectedShopId) return null;

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Hledat URL..."
            value={redirectSearchQuery}
            onChange={(e) => setRedirectSearch(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg pl-10 pr-4 py-2 text-sm font-medium outline-none focus:border-emerald-300 w-72"
          />
        </div>
        <button
          onClick={() => openRedirectForm()}
          className="flex items-center gap-2 bg-emerald-600 text-white px-4 py-2 rounded-lg font-semibold text-sm hover:bg-emerald-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4" />
          Nové přesměrování
        </button>
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Stará URL</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Nová URL</th>
              <th className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Typ</th>
              <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Vytvořeno</th>
              <th className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-4 py-3">Akce</th>
            </tr>
          </thead>
          <tbody>
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-12 text-slate-400 text-sm">
                  {redirectSearchQuery ? 'Žádná přesměrování nenalezena' : 'Zatím žádná přesměrování'}
                </td>
              </tr>
            ) : (
              redirects.map((redirect) => (
                <tr key={redirect.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-slate-600 break-all">{redirect.oldUrl}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-sm font-mono text-emerald-600 break-all">{redirect.newUrl}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold bg-slate-100 text-slate-600">
                      {redirect.type}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className="text-xs text-slate-400">
                      {new Date(redirect.createdAt).toLocaleDateString('cs-CZ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openRedirectForm(redirect.id)}
                        className="p-2 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                        title="Upravit"
                      >
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('Opravdu smazat přesměrování?')) {
                            deleteRedirect(redirect.id);
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
      {isRedirectFormOpen && <EshopRedirectFormModal />}
    </div>
  );
}
