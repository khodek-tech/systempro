'use client';

import { useMemo, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useMotivationStore } from '@/stores/motivation-store';
import { Search, ChevronUp, ChevronDown } from 'lucide-react';

type SortField = 'kod' | 'nazev' | 'prodejniCena';
type SortDirection = 'asc' | 'desc';

interface MotivationProductsModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function MotivationProductsModal({ open, onOpenChange }: MotivationProductsModalProps) {
  const { products, _loading } = useMotivationStore();

  const [filter, setFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('nazev');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Only show products that are in motivation
  const motivationProducts = useMemo(
    () => products.filter((p) => p.motivation),
    [products]
  );

  const filteredProducts = useMemo(() => {
    const q = filter.toLowerCase().trim();
    let result = motivationProducts;

    if (q) {
      result = motivationProducts.filter(
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
        default:
          return 0;
      }
    });

    return result;
  }, [motivationProducts, filter, sortField, sortDirection]);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return null;
    return sortDirection === 'asc' ? (
      <ChevronUp className="w-3.5 h-3.5 inline ml-1" />
    ) : (
      <ChevronDown className="w-3.5 h-3.5 inline ml-1" />
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[95vw] w-[95vw] h-[95vh] flex flex-col overflow-hidden rounded-2xl p-0">
        {/* Header */}
        <div className="flex-shrink-0 px-6 pt-6 pb-4 border-b border-slate-200">
          <DialogHeader>
            <div className="flex items-center justify-between">
              <DialogTitle className="text-2xl font-bold text-slate-800">
                Produkty v motivaci
              </DialogTitle>
              <span className="text-sm font-medium text-slate-400">
                {filteredProducts.length.toLocaleString('cs-CZ')} produktů
                {filter && ' (filtrováno)'}
              </span>
            </div>
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
          ) : motivationProducts.length === 0 ? (
            <div className="flex items-center justify-center h-40">
              <div className="text-sm text-slate-500">
                Žádné produkty nejsou zařazeny do motivace.
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
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr
                    key={product.kod}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
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
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
