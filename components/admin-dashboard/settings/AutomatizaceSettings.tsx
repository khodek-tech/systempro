'use client';

import { useState } from 'react';
import { Package, Download, Loader2, AlertCircle, Truck, Eye, Send, Check, Clock, XCircle } from 'lucide-react';
import { usePohodaStore } from '@/stores/pohoda-store';
import { usePrevodkyStore } from '@/stores/prevodky-store';
import { useUsersStore } from '@/core/stores/users-store';
import { GenerateDialog } from '@/components/prevodky/GenerateDialog';
import { PrevodkaDetail } from '@/components/prevodky/PrevodkaDetail';
import type { PrevodkaStav } from '@/shared/types';

const STAV_LABELS: Record<PrevodkaStav, string> = {
  nova: 'Nová',
  picking: 'Picking',
  vychystano: 'Vychystáno',
  odeslano: 'Odesláno',
  potvrzeno: 'Potvrzeno',
  zrusena: 'Zrušena',
};

const STAV_COLORS: Record<PrevodkaStav, string> = {
  nova: 'bg-blue-50 text-blue-700',
  picking: 'bg-orange-50 text-orange-700',
  vychystano: 'bg-yellow-50 text-yellow-700',
  odeslano: 'bg-green-50 text-green-700',
  potvrzeno: 'bg-emerald-50 text-emerald-700',
  zrusena: 'bg-red-50 text-red-700',
};

const STAV_ICONS: Record<PrevodkaStav, typeof Check> = {
  nova: Clock,
  picking: Loader2,
  vychystano: Check,
  odeslano: Send,
  potvrzeno: Check,
  zrusena: XCircle,
};

type FilterType = PrevodkaStav | 'aktivni' | 'all';

export function AutomatizaceSettings() {
  const {
    isGeneratingRozdeleni,
    generateRozdeleniProgress,
    generateRozdeleniError,
    generateRozdeleni,
  } = usePohodaStore();

  const {
    prevodky,
    stavFilter,
    setStavFilter,
    openDetail,
    generateError,
    selectedPrevodkaId,
  } = usePrevodkyStore();

  const getUserById = useUsersStore((s) => s.getUserById);

  const [showGenerateDialog, setShowGenerateDialog] = useState(false);

  // Filter prevodky
  const filteredPrevodky = prevodky.filter((p) => {
    if (stavFilter === 'all') return true;
    if (stavFilter === 'aktivni') return !['zrusena', 'potvrzeno'].includes(p.stav);
    return p.stav === stavFilter;
  });

  const filterOptions: { value: FilterType; label: string }[] = [
    { value: 'aktivni', label: 'Aktivní' },
    { value: 'all', label: 'Všechny' },
    { value: 'nova', label: 'Nové' },
    { value: 'picking', label: 'Picking' },
    { value: 'vychystano', label: 'Vychystané' },
    { value: 'odeslano', label: 'Odeslané' },
    { value: 'zrusena', label: 'Zrušené' },
  ];

  return (
    <div className="space-y-6">
      {/* Rozdělení zboží */}
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

      {/* Převodky */}
      <div className="bg-white border border-slate-200 rounded-xl shadow-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-slate-800">
                Převodky
              </h3>
              <p className="text-sm text-slate-500">
                Interní převodní doklady s picking systémem
              </p>
            </div>
          </div>
          <button
            onClick={() => setShowGenerateDialog(true)}
            className="flex items-center gap-2 bg-purple-600 text-white px-5 py-2.5 rounded-lg font-semibold hover:bg-purple-700 active:scale-[0.98] transition-all"
          >
            <Truck className="w-4 h-4" />
            Generovat převodky
          </button>
        </div>

        {generateError && (
          <div className="mb-4 flex items-center gap-2 text-sm text-red-600 bg-red-50 rounded-lg p-3">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{generateError}</span>
          </div>
        )}

        {/* Filter tabs */}
        <div className="flex gap-1 mb-4 bg-slate-100 rounded-lg p-1">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStavFilter(opt.value)}
              className={`px-3 py-1.5 rounded-md text-xs font-semibold transition-all ${
                stavFilter === opt.value
                  ? 'bg-white text-slate-800 shadow-sm'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {/* Prevodky table */}
        {filteredPrevodky.length === 0 ? (
          <div className="text-center py-8 text-sm text-slate-400">
            Žádné převodky
          </div>
        ) : (
          <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Číslo</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Cíl</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Picker</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Stav</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Položky</th>
                  <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Vytvořeno</th>
                  <th className="px-4 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Akce</th>
                </tr>
              </thead>
              <tbody>
                {filteredPrevodky.map((p) => {
                  const picker = p.prirazenoKomu ? getUserById(p.prirazenoKomu) : null;
                  const pickedCount = p.polozky.filter((i) => i.vychystano).length;
                  const totalCount = p.polozky.length;
                  const StavIcon = STAV_ICONS[p.stav];

                  return (
                    <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="px-4 py-3 text-sm font-mono font-medium text-slate-700">
                        {p.cisloPrevodky}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-slate-600">
                        {p.cilovySklad}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-600">
                        {picker?.fullName ?? '-'}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-semibold ${STAV_COLORS[p.stav]}`}>
                          <StavIcon className={`w-3 h-3 ${p.stav === 'picking' ? 'animate-spin' : ''}`} />
                          {STAV_LABELS[p.stav]}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-center font-medium text-slate-600">
                        {pickedCount}/{totalCount}
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-500">
                        {new Date(p.vytvoreno).toLocaleDateString('cs-CZ')}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <button
                          onClick={() => openDetail(p.id)}
                          className="p-1.5 hover:bg-slate-100 rounded-lg transition-colors"
                          title="Detail"
                        >
                          <Eye className="w-4 h-4 text-slate-400" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Dialogs */}
      {showGenerateDialog && (
        <GenerateDialog onClose={() => setShowGenerateDialog(false)} />
      )}

      {selectedPrevodkaId && <PrevodkaDetail />}
    </div>
  );
}
