'use client';

import { X, Check, AlertTriangle, Minus, Send, Ban } from 'lucide-react';
import { usePrevodkyStore } from '@/stores/prevodky-store';
import { useUsersStore } from '@/core/stores/users-store';
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

function formatDate(dateStr: string | null): string {
  if (!dateStr) return '-';
  return new Date(dateStr).toLocaleString('cs-CZ', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function PrevodkaDetail() {
  const {
    selectedPrevodkaId,
    closeDetail,
    getPrevodkaById,
    markAsSent,
    cancelPrevodka,
  } = usePrevodkyStore();

  const getUserById = useUsersStore((s) => s.getUserById);

  if (!selectedPrevodkaId) return null;

  const prevodka = getPrevodkaById(selectedPrevodkaId);
  if (!prevodka) return null;

  const picker = prevodka.prirazenoKomu ? getUserById(prevodka.prirazenoKomu) : null;
  const creator = getUserById(prevodka.vytvoril);

  const totalItems = prevodka.polozky.length;
  const pickedItems = prevodka.polozky.filter((p) => p.vychystano).length;

  const canSend = prevodka.stav === 'vychystano';
  const canCancel = !['odeslano', 'potvrzeno', 'zrusena'].includes(prevodka.stav);

  const handleSend = async () => {
    await markAsSent(prevodka.id);
  };

  const handleCancel = async () => {
    if (!confirm('Opravdu chcete zrušit tuto převodku? Přiřazený úkol bude smazán.')) return;
    await cancelPrevodka(prevodka.id);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg max-w-[900px] w-full mx-4 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <div className="flex items-center gap-3">
              <h2 className="text-xl font-bold text-slate-800">{prevodka.cisloPrevodky}</h2>
              <span className={`px-2.5 py-1 rounded-md text-xs font-semibold ${STAV_COLORS[prevodka.stav]}`}>
                {STAV_LABELS[prevodka.stav]}
              </span>
            </div>
            <p className="text-sm text-slate-500 mt-1">
              {prevodka.zdrojovySklad} → {prevodka.cilovySklad}
            </p>
          </div>
          <button onClick={closeDetail} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Info grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-6 border-b border-slate-100">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Picker</span>
            <p className="text-sm font-medium text-slate-700 mt-1">{picker?.fullName ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vytvořil</span>
            <p className="text-sm font-medium text-slate-700 mt-1">{creator?.fullName ?? '-'}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Vytvořeno</span>
            <p className="text-sm font-medium text-slate-700 mt-1">{formatDate(prevodka.vytvoreno)}</p>
          </div>
          <div>
            <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">Položky</span>
            <p className="text-sm font-medium text-slate-700 mt-1">{pickedItems} / {totalItems}</p>
          </div>
        </div>

        {/* Timestamps */}
        {(prevodka.zahajeno || prevodka.vychystano || prevodka.odeslano) && (
          <div className="flex gap-6 px-6 py-3 bg-slate-50 text-xs text-slate-500">
            {prevodka.zahajeno && <span>Zahájeno: {formatDate(prevodka.zahajeno)}</span>}
            {prevodka.vychystano && <span>Vychystáno: {formatDate(prevodka.vychystano)}</span>}
            {prevodka.odeslano && <span>Odesláno: {formatDate(prevodka.odeslano)}</span>}
          </div>
        )}

        {/* Note */}
        {prevodka.poznamka && (
          <div className="px-6 py-3 bg-orange-50 text-sm text-orange-700 border-b border-orange-100">
            <span className="font-semibold">Poznámka pickera:</span> {prevodka.poznamka}
          </div>
        )}

        {/* Items table */}
        <div className="flex-1 overflow-y-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Kód</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Název</th>
                <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wide text-slate-500">Pozice</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Požadováno</th>
                <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wide text-slate-500">Skutečně</th>
                <th className="px-6 py-3 text-center text-xs font-semibold uppercase tracking-wide text-slate-500">Status</th>
              </tr>
            </thead>
            <tbody>
              {prevodka.polozky.map((item) => {
                const isPartial = item.vychystano && item.skutecneMnozstvi !== null && item.skutecneMnozstvi < item.pozadovaneMnozstvi;
                const isMissing = !item.vychystano && prevodka.stav === 'vychystano';

                return (
                  <tr key={item.id} className="border-b border-slate-100 hover:bg-slate-50">
                    <td className="px-6 py-3 text-sm font-mono text-slate-600">{item.kod}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-700">{item.nazev}</td>
                    <td className="px-6 py-3 text-sm text-slate-500">{item.pozice ?? '-'}</td>
                    <td className="px-6 py-3 text-sm font-medium text-slate-700 text-right">{item.pozadovaneMnozstvi}</td>
                    <td className="px-6 py-3 text-sm font-medium text-right">
                      <span className={isPartial ? 'text-orange-600' : isMissing ? 'text-red-600' : 'text-slate-700'}>
                        {item.skutecneMnozstvi ?? '-'}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-center">
                      {item.vychystano ? (
                        isPartial ? (
                          <AlertTriangle className="w-4 h-4 text-orange-500 mx-auto" />
                        ) : (
                          <Check className="w-4 h-4 text-green-500 mx-auto" />
                        )
                      ) : isMissing ? (
                        <Minus className="w-4 h-4 text-red-400 mx-auto" />
                      ) : (
                        <span className="w-4 h-4 block mx-auto rounded-full border-2 border-slate-200" />
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          {canCancel && (
            <button
              onClick={handleCancel}
              className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-red-600 bg-red-50 hover:bg-red-100 transition-all"
            >
              <Ban className="w-4 h-4" />
              Zrušit převodku
            </button>
          )}
          {canSend && (
            <button
              onClick={handleSend}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all"
            >
              <Send className="w-4 h-4" />
              Označit jako odesláno
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
