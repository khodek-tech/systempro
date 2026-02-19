'use client';

import { Package, Download, Loader2, AlertCircle } from 'lucide-react';
import { usePohodaStore } from '@/stores/pohoda-store';

export function AutomatizaceSettings() {
  const {
    isGeneratingRozdeleni,
    generateRozdeleniProgress,
    generateRozdeleniError,
    generateRozdeleni,
  } = usePohodaStore();

  return (
    <div className="space-y-6">
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center">
            <Package className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              Rozdělení zboží na prodejny
            </h3>
            <p className="text-sm text-slate-500">
              Automatický výpočet počtu kusů k dodání na každou prodejnu
            </p>
          </div>
        </div>

        <div className="bg-slate-50 rounded-lg p-4 mb-5 text-sm text-slate-600 space-y-1">
          <p>Výpočet vychází z průměrné měsíční prodejnosti za poslední 3 měsíce, aktuálních stavů zásob a konfigurace cílových stavů.</p>
          <p>Produkty s deficitem menším než 30 % cílového stavu se nedodávají. Množství je omezeno dostupností na centrálním skladu ALL_Zdiby.</p>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={generateRozdeleni}
            disabled={isGeneratingRozdeleni}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGeneratingRozdeleni ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {isGeneratingRozdeleni ? 'Generuji...' : 'Stáhnout rozdělení (.xlsx)'}
          </button>

          {generateRozdeleniProgress && (
            <span className="text-sm text-slate-500">{generateRozdeleniProgress}</span>
          )}
        </div>

        {generateRozdeleniError && (
          <div className="mt-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{generateRozdeleniError}</span>
          </div>
        )}
      </div>
    </div>
  );
}
