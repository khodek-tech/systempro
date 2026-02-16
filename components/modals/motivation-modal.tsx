'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMotivationStore } from '@/stores/motivation-store';
import { useAuthStore } from '@/core/stores/auth-store';
import { Search, ChevronUp, ChevronDown, Save, CheckSquare, Square } from 'lucide-react';

type SortField = 'kod' | 'nazev' | 'prodejniCena' | 'motivation';
type SortDirection = 'asc' | 'desc';

interface MotivationModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MotivationModal({ open, onOpenChange }: MotivationModalProps) {
  const {
    products,
    pendingChanges,
    _loading,
    _saving,
    toggleProduct,
    markAllFiltered,
    saveChanges,
  } = useMotivationStore();
  const currentUser = useAuthStore((s) => s.currentUser);

  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('nazev');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const filteredProducts = useMemo(() => {
    const q = filter.toLowerCase().trim();
    let result = products;

    if (q) {
      result = products.filter(
        (p) =>
          p.kod.toLowerCase().includes(q) ||
          p.nazev.toLowerCase().includes(q) ||
          (p.ean && p.ean.toLowerCase().includes(q))
      );
    }

    result = [...result].sort((a, b) => {
      const dir = sortDirection === 'asc' ? 1 : -1;
      switch (sortField) {
        case 'kod':
          return a.kod.localeCompare(b.kod, 'cs') * dir;
        case 'nazev':
          return a.nazev.localeCompare(b.nazev, 'cs') * dir;
        case 'prodejniCena':
          return (a.prodejniCena - b.prodejniCena) * dir;
        case 'motivation':
          return (Number(a.motivation) - Number(b.motivation)) * dir;
        default:
          return 0;
      }
    });

    return result;
  }, [products, filter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSave = async () => {
    if (!currentUser) return;
    await saveChanges(currentUser.fullName);
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  const filteredKods = filteredProducts.map((p) => p.kod);
  const allFilteredChecked = filteredProducts.length > 0 && filteredProducts.every((p) => p.motivation);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-200">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-slate-800">
              Motivace prodejny
            </DialogTitle>
          </DialogHeader>
          <div className="mt-4 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              placeholder="Hledat podle kódu, názvu nebo EAN..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-3 text-sm font-medium outline-none focus:border-orange-300 transition-colors"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-y-auto">
          {_loading ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-sm text-slate-500">Načítám produkty...</div>
            </div>
          ) : products.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-sm text-slate-500">
                Nebyl vybrán sklad nebo sklad neobsahuje žádné produkty.
              </div>
            </div>
          ) : (
            <table className="w-full">
              <thead className="sticky top-0 bg-slate-50 z-10">
                <tr className="border-b border-slate-200">
                  <th
                    onClick={() => handleSort('kod')}
                    className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    Kód
                    {renderSortIcon('kod')}
                  </th>
                  <th
                    onClick={() => handleSort('nazev')}
                    className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    Název
                    {renderSortIcon('nazev')}
                  </th>
                  <th className="text-left text-xs font-semibold uppercase tracking-wide text-slate-500 px-6 py-3">
                    EAN
                  </th>
                  <th
                    onClick={() => handleSort('prodejniCena')}
                    className="text-right text-xs font-semibold uppercase tracking-wide text-slate-500 px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    Cena
                    {renderSortIcon('prodejniCena')}
                  </th>
                  <th
                    onClick={() => handleSort('motivation')}
                    className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 px-6 py-3 cursor-pointer hover:text-slate-700 transition-colors"
                  >
                    Motivace
                    {renderSortIcon('motivation')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.kod}
                    onClick={() => toggleProduct(product.kod)}
                    className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
                  >
                    <td className="text-sm font-medium text-slate-600 px-6 py-2.5">
                      {product.kod}
                    </td>
                    <td className="text-sm font-medium text-slate-600 px-6 py-2.5">
                      {product.nazev}
                    </td>
                    <td className="text-sm text-slate-400 px-6 py-2.5">
                      {product.ean || '—'}
                    </td>
                    <td className="text-sm font-medium text-slate-600 px-6 py-2.5 text-right tabular-nums">
                      {product.prodejniCena.toLocaleString('cs-CZ')} Kč
                    </td>
                    <td className="text-center px-6 py-2.5">
                      {product.motivation ? (
                        <CheckSquare className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-300 mx-auto" />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-slate-200 bg-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => markAllFiltered(filteredKods, true)}
              className="bg-green-50 text-green-700 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-green-100 transition-colors"
            >
              {allFilteredChecked ? 'Vše označeno' : 'Označit vše'}
            </button>
            <button
              onClick={() => markAllFiltered(filteredKods, false)}
              className="bg-slate-100 text-slate-700 px-4 py-2 rounded-lg text-sm font-medium hover:bg-slate-200 transition-colors"
            >
              Odznačit vše
            </button>
            <span className="text-xs text-slate-400">
              {filteredProducts.length.toLocaleString('cs-CZ')} produktů
              {filter && ` (filtrováno)`}
            </span>
          </div>
          <div className="flex items-center gap-3">
            {pendingChanges.size > 0 && (
              <span className="text-sm font-medium text-orange-600">
                {pendingChanges.size} {pendingChanges.size === 1 ? 'změna' : pendingChanges.size < 5 ? 'změny' : 'změn'}
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={pendingChanges.size === 0 || _saving}
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold text-sm hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {_saving ? 'Ukládám...' : 'Uložit'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
