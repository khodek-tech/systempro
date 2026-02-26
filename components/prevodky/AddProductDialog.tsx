'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X, Search, Plus, Minus, Check, AlertTriangle, Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { usePrevodkyStore } from '@/stores/prevodky-store';

interface SearchProduct {
  kod: string;
  nazev: string;
  ean: string | null;
  pozice: string | null;
}

interface AddProductDialogProps {
  prevodkaId: string;
  zdrojovySklad: string;
  existingCodes: string[];
  onClose: () => void;
}

export function AddProductDialog({ prevodkaId, zdrojovySklad, existingCodes, onClose }: AddProductDialogProps) {
  const { addItemToPrevodka } = usePrevodkyStore();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchProduct[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<SearchProduct | null>(null);
  const [qty, setQty] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'warning'; message: string } | null>(null);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(null);

  // Auto-focus search input
  useEffect(() => {
    if (!selectedProduct) {
      searchInputRef.current?.focus();
    }
  }, [selectedProduct]);

  // Clear feedback after 3 seconds
  useEffect(() => {
    if (feedback) {
      const timer = setTimeout(() => setFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [feedback]);

  const searchProducts = useCallback(async (q: string) => {
    if (q.length < 2) {
      setResults([]);
      return;
    }

    setIsSearching(true);
    const supabase = createClient();

    const { data, error } = await supabase
      .from('pohoda_zasoby')
      .select('kod, nazev, ean, nazev_pro_objednavku')
      .eq('cleneni_skladu_nazev', zdrojovySklad)
      .or(`kod.ilike.%${q}%,nazev.ilike.%${q}%,ean.ilike.%${q}%`)
      .limit(50);

    if (error) {
      setIsSearching(false);
      return;
    }

    setResults(
      (data ?? []).map((row) => ({
        kod: row.kod,
        nazev: row.nazev,
        ean: row.ean ?? null,
        pozice: row.nazev_pro_objednavku ?? null,
      }))
    );
    setIsSearching(false);
  }, [zdrojovySklad]);

  const handleQueryChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => searchProducts(value), 300);
  };

  const handleSelectProduct = (product: SearchProduct) => {
    const isDuplicate = existingCodes.includes(product.kod);
    if (isDuplicate) {
      setFeedback({ type: 'warning', message: `${product.nazev} — již v převodce, množství se navýší` });
    }
    setSelectedProduct(product);
    setQty(1);
  };

  const handleAdd = async () => {
    if (!selectedProduct || qty <= 0) return;

    setIsAdding(true);
    const result = await addItemToPrevodka(prevodkaId, {
      kod: selectedProduct.kod,
      nazev: selectedProduct.nazev,
      pozice: selectedProduct.pozice,
      mnozstvi: qty,
    });
    setIsAdding(false);

    if (result.success) {
      setFeedback({ type: 'success', message: `${selectedProduct.nazev} — přidán (${qty} ks)` });
      setSelectedProduct(null);
      setQuery('');
      setResults([]);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-white">
      {/* Header */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 py-3 bg-slate-800 text-white">
        <h2 className="text-lg font-bold">Přidat produkt</h2>
        <button
          onClick={onClose}
          className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Search */}
      <div className="flex-shrink-0 p-4 bg-slate-50 border-b border-slate-200">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Hledat podle názvu, kódu nebo EAN..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg font-medium outline-none focus:border-orange-400 transition-colors"
            autoComplete="off"
          />
          {isSearching && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 animate-spin" />
          )}
        </div>

        {/* Feedback */}
        {feedback && (
          <div
            className={`mt-2 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              feedback.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-orange-50 text-orange-700'
            }`}
          >
            {feedback.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {feedback.message}
          </div>
        )}
      </div>

      {/* Selected product — quantity picker */}
      {selectedProduct && (
        <div className="flex-shrink-0 p-4 bg-blue-50 border-b border-blue-200">
          <div className="mb-3">
            <p className="text-base font-semibold text-slate-800">{selectedProduct.nazev}</p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm font-mono text-slate-500">{selectedProduct.kod}</span>
              {selectedProduct.pozice && (
                <span className="text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-0.5 rounded">
                  {selectedProduct.pozice}
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="w-12 h-12 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors active:scale-95"
              >
                <Minus className="w-5 h-5 text-slate-600" />
              </button>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-20 h-12 text-center text-2xl font-bold text-slate-800 bg-white border border-slate-200 rounded-xl outline-none focus:border-orange-300"
                min={1}
              />
              <button
                onClick={() => setQty((q) => q + 1)}
                className="w-12 h-12 rounded-xl bg-white border border-slate-200 hover:bg-slate-50 flex items-center justify-center transition-colors active:scale-95"
              >
                <Plus className="w-5 h-5 text-slate-600" />
              </button>
            </div>

            <button
              onClick={handleAdd}
              disabled={isAdding || qty <= 0}
              className="flex-1 h-12 rounded-xl font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isAdding ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Plus className="w-4 h-4" />
              )}
              Přidat ({qty} ks)
            </button>

            <button
              onClick={() => setSelectedProduct(null)}
              className="h-12 px-4 rounded-xl font-medium text-slate-600 bg-white border border-slate-200 hover:bg-slate-50 transition-all"
            >
              Zrušit
            </button>
          </div>
        </div>
      )}

      {/* Results list */}
      <div className="flex-1 overflow-y-auto">
        {query.length < 2 && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <Search className="w-12 h-12 mb-3 opacity-30" />
            <p className="text-base font-medium">Zadejte alespoň 2 znaky pro vyhledání</p>
          </div>
        )}

        {query.length >= 2 && !isSearching && results.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-slate-400">
            <p className="text-base font-medium">Žádné výsledky</p>
          </div>
        )}

        {results.map((product) => {
          const isDuplicate = existingCodes.includes(product.kod);
          const isSelected = selectedProduct?.kod === product.kod;

          return (
            <button
              key={product.kod}
              onClick={() => handleSelectProduct(product)}
              className={`w-full flex items-center gap-3 px-4 py-3 border-b border-slate-100 text-left transition-colors ${
                isSelected
                  ? 'bg-blue-50'
                  : 'hover:bg-slate-50'
              }`}
            >
              {/* Position badge */}
              {product.pozice ? (
                <span className="flex-shrink-0 w-16 text-center text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-2 rounded">
                  {product.pozice}
                </span>
              ) : (
                <span className="flex-shrink-0 w-16" />
              )}

              {/* Product info */}
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium text-slate-800 truncate block">
                  {product.nazev}
                </span>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="text-xs font-mono text-slate-400">{product.kod}</span>
                  {product.ean && product.ean !== product.kod && (
                    <span className="text-xs text-slate-400">EAN: {product.ean}</span>
                  )}
                </div>
              </div>

              {/* Duplicate indicator */}
              {isDuplicate && (
                <span className="flex-shrink-0 text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded">
                  v převodce
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
