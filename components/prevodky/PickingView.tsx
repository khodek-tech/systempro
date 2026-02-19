'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { ArrowLeft, Check, AlertTriangle, ScanBarcode, Package, MessageSquare, Printer } from 'lucide-react';
import { usePrevodkyStore } from '@/stores/prevodky-store';
import { QuantityDialog } from './QuantityDialog';
import type { PrevodkaPolozka } from '@/shared/types';

export function PickingView() {
  const {
    pickingPrevodkaId,
    closePicking,
    getPrevodkaById,
    startPicking,
    confirmItem,
    finishPicking,
  } = usePrevodkyStore();

  const [scanInput, setScanInput] = useState('');
  const [scanFeedback, setScanFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [quantityItem, setQuantityItem] = useState<PrevodkaPolozka | null>(null);
  const [finishNote, setFinishNote] = useState('');
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const startingRef = useRef(false);

  const prevodka = pickingPrevodkaId ? getPrevodkaById(pickingPrevodkaId) : null;

  // Auto-start picking when opening
  const prevodkaId = prevodka?.id;
  const prevodkaStav = prevodka?.stav;
  useEffect(() => {
    if (prevodkaId && prevodkaStav === 'nova' && !startingRef.current) {
      startingRef.current = true;
      startPicking(prevodkaId).finally(() => { startingRef.current = false; });
    }
  }, [prevodkaId, prevodkaStav, startPicking]);

  // Auto-focus scan input
  useEffect(() => {
    if (!quantityItem && !showFinishDialog) {
      inputRef.current?.focus();
    }
  }, [quantityItem, showFinishDialog, prevodka?.polozky]);

  // Clear scan feedback after 3 seconds
  useEffect(() => {
    if (scanFeedback) {
      const timer = setTimeout(() => setScanFeedback(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [scanFeedback]);

  const handleScan = useCallback((code: string) => {
    if (!prevodka) return;

    const trimmed = code.trim();
    if (!trimmed) return;

    // Find matching item by code (EAN)
    const item = prevodka.polozky.find((p) => p.kod === trimmed && !p.vychystano);

    if (!item) {
      // Check if already picked
      const alreadyPicked = prevodka.polozky.find((p) => p.kod === trimmed && p.vychystano);
      if (alreadyPicked) {
        setScanFeedback({ type: 'error', message: `${alreadyPicked.nazev} — již vychystáno` });
      } else {
        setScanFeedback({ type: 'error', message: 'Produkt není v převodce' });
      }
      return;
    }

    if (item.pozadovaneMnozstvi === 1) {
      // Auto-confirm for qty=1
      confirmItem(prevodka.id, item.id, 1);
      setScanFeedback({ type: 'success', message: `${item.nazev} — OK` });
    } else {
      // Show quantity dialog
      setQuantityItem(item);
    }
  }, [prevodka, confirmItem]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleScan(scanInput);
      setScanInput('');
    }
  }, [handleScan, scanInput]);

  const handleQuantityConfirm = useCallback((qty: number) => {
    if (!prevodka || !quantityItem) return;
    confirmItem(prevodka.id, quantityItem.id, qty);
    setScanFeedback({ type: 'success', message: `${quantityItem.nazev} — ${qty} ks` });
    setQuantityItem(null);
  }, [prevodka, quantityItem, confirmItem]);

  const handleFinish = useCallback(async () => {
    if (!prevodka) return;

    const allPicked = prevodka.polozky.every((p) => p.vychystano);

    if (!allPicked && !finishNote.trim()) {
      // Need note for partial
      return;
    }

    await finishPicking(prevodka.id, finishNote.trim() || undefined);
    setShowFinishDialog(false);
  }, [prevodka, finishNote, finishPicking]);

  const handlePrint = useCallback(() => {
    if (!prevodka) return;

    const rows = prevodka.polozky
      .map(
        (item) =>
          `<tr>
            <td style="padding:6px 10px;border:1px solid #ccc;font-weight:bold;text-align:center;white-space:nowrap">${item.pozice ?? ''}</td>
            <td style="padding:6px 10px;border:1px solid #ccc">
              <div style="font-weight:600">${item.nazev}</div>
              <div style="font-size:11px;color:#666;font-family:monospace">${item.kod}</div>
            </td>
            <td style="padding:6px 10px;border:1px solid #ccc;text-align:center;font-weight:bold;font-size:16px">${item.pozadovaneMnozstvi}</td>
            <td style="padding:6px 10px;border:1px solid #ccc;text-align:center;width:60px"></td>
          </tr>`
      )
      .join('');

    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>${prevodka.cisloPrevodky}</title>
      <style>@media print { body { margin: 0; } @page { margin: 10mm; } }</style></head><body style="font-family:system-ui,sans-serif;padding:20px">
      <h2 style="margin:0 0 4px">${prevodka.cisloPrevodky}</h2>
      <p style="margin:0 0 16px;color:#555">${prevodka.zdrojovySklad} → ${prevodka.cilovySklad} · ${prevodka.polozky.length} položek</p>
      <table style="width:100%;border-collapse:collapse">
        <thead><tr style="background:#f1f5f9">
          <th style="padding:8px 10px;border:1px solid #ccc;text-align:center;width:80px">Pozice</th>
          <th style="padding:8px 10px;border:1px solid #ccc;text-align:left">Produkt</th>
          <th style="padding:8px 10px;border:1px solid #ccc;text-align:center;width:60px">Požad.</th>
          <th style="padding:8px 10px;border:1px solid #ccc;text-align:center;width:60px">Skut.</th>
        </tr></thead>
        <tbody>${rows}</tbody>
      </table></body></html>`;

    const w = window.open('', '_blank');
    if (w) {
      w.document.write(html);
      w.document.close();
      w.print();
    }
  }, [prevodka]);

  if (!prevodka) return null;

  const totalItems = prevodka.polozky.length;
  const pickedItems = prevodka.polozky.filter((p) => p.vychystano).length;
  const progress = totalItems > 0 ? (pickedItems / totalItems) * 100 : 0;
  const allPicked = pickedItems === totalItems;

  return (
    <div className="fixed inset-0 z-50 bg-white flex flex-col">
      {/* Header */}
      <div className="flex-shrink-0 bg-slate-800 text-white">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <button
              onClick={closePicking}
              className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-lg font-bold">{prevodka.cisloPrevodky}</h1>
              <p className="text-sm text-slate-300">{prevodka.zdrojovySklad} → {prevodka.cilovySklad}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-3 py-2 bg-slate-700 hover:bg-slate-600 rounded-lg text-sm font-medium transition-colors"
            >
              <Printer className="w-4 h-4" />
              Tisknout
            </button>
            <div className="text-right">
              <div className="text-2xl font-bold font-mono">{pickedItems}/{totalItems}</div>
              <p className="text-xs text-slate-400">položek</p>
            </div>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-2 bg-slate-700">
          <div
            className={`h-full transition-all duration-300 ${allPicked ? 'bg-green-500' : 'bg-orange-500'}`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Scan input */}
      <div className="flex-shrink-0 p-4 bg-slate-50 border-b border-slate-200">
        <div className="relative">
          <ScanBarcode className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            value={scanInput}
            onChange={(e) => setScanInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Naskenujte EAN kód..."
            className="w-full pl-12 pr-4 py-4 bg-white border-2 border-slate-200 rounded-xl text-lg font-mono outline-none focus:border-orange-400 transition-colors"
            autoFocus
            autoComplete="off"
          />
        </div>

        {/* Scan feedback */}
        {scanFeedback && (
          <div
            className={`mt-2 p-3 rounded-lg text-sm font-semibold flex items-center gap-2 animate-in fade-in duration-200 ${
              scanFeedback.type === 'success'
                ? 'bg-green-50 text-green-700'
                : 'bg-red-50 text-red-700'
            }`}
          >
            {scanFeedback.type === 'success' ? (
              <Check className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            {scanFeedback.message}
          </div>
        )}
      </div>

      {/* Items list */}
      <div className="flex-1 overflow-y-auto">
        {prevodka.polozky.map((item) => (
          <div
            key={item.id}
            className={`flex items-center gap-3 px-4 py-3 border-b border-slate-100 ${
              item.vychystano ? 'bg-green-50/50' : ''
            }`}
          >
            {/* Status indicator */}
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                item.vychystano
                  ? item.skutecneMnozstvi !== null && item.skutecneMnozstvi < item.pozadovaneMnozstvi
                    ? 'bg-orange-100'
                    : 'bg-green-100'
                  : 'bg-slate-100'
              }`}
            >
              {item.vychystano ? (
                item.skutecneMnozstvi !== null && item.skutecneMnozstvi < item.pozadovaneMnozstvi ? (
                  <AlertTriangle className="w-4 h-4 text-orange-600" />
                ) : (
                  <Check className="w-4 h-4 text-green-600" />
                )
              ) : (
                <Package className="w-4 h-4 text-slate-400" />
              )}
            </div>

            {/* Position badge — spans both rows vertically */}
            {item.pozice ? (
              <span className="flex-shrink-0 w-16 text-center text-xs font-bold bg-slate-200 text-slate-700 px-1.5 py-2 rounded self-center">
                {item.pozice}
              </span>
            ) : (
              <span className="flex-shrink-0 w-16" />
            )}

            {/* Product info — name + EAN stacked */}
            <div className="flex-1 min-w-0 pl-2">
              <span className="text-sm font-medium text-slate-800 truncate block">
                {item.nazev}
              </span>
              <p className="text-xs font-mono text-slate-400 mt-0.5">{item.kod}</p>
            </div>

            {/* Quantity */}
            <div className="flex-shrink-0 text-right">
              {item.vychystano ? (
                <span className={`text-lg font-bold ${
                  item.skutecneMnozstvi !== null && item.skutecneMnozstvi < item.pozadovaneMnozstvi
                    ? 'text-orange-600'
                    : 'text-green-600'
                }`}>
                  {item.skutecneMnozstvi}/{item.pozadovaneMnozstvi}
                </span>
              ) : (
                <span className="text-lg font-bold text-slate-900">{item.pozadovaneMnozstvi}</span>
              )}
              <p className="text-xs text-slate-400">ks</p>
            </div>
          </div>
        ))}
      </div>

      {/* Bottom action bar */}
      <div className="flex-shrink-0 p-4 bg-white border-t border-slate-200 safe-area-inset-bottom">
        <button
          onClick={() => {
            if (allPicked) {
              finishPicking(prevodka.id);
            } else {
              setShowFinishDialog(true);
            }
          }}
          disabled={pickedItems === 0}
          className={`w-full py-4 rounded-xl font-bold text-lg transition-all active:scale-[0.98] disabled:opacity-30 disabled:cursor-not-allowed ${
            allPicked
              ? 'bg-green-600 text-white hover:bg-green-700'
              : 'bg-orange-500 text-white hover:bg-orange-600'
          }`}
        >
          {allPicked
            ? 'Dokončit picking'
            : `Dokončit picking (${pickedItems}/${totalItems})`
          }
        </button>
      </div>

      {/* Quantity dialog */}
      {quantityItem && (
        <QuantityDialog
          productName={quantityItem.nazev}
          productCode={quantityItem.kod}
          requiredQty={quantityItem.pozadovaneMnozstvi}
          onConfirm={handleQuantityConfirm}
          onCancel={() => setQuantityItem(null)}
        />
      )}

      {/* Finish with note dialog (partial picking) */}
      {showFinishDialog && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-8">
            <h3 className="text-xl font-bold text-slate-800 mb-2">Neúplné vychystání</h3>
            <p className="text-sm text-slate-500 mb-6">
              Vychystáno {pickedItems} z {totalItems} položek. Uveďte důvod neúplného vychystání.
            </p>

            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <MessageSquare className="w-4 h-4 text-slate-400" />
                <label className="text-sm font-semibold text-slate-700">Poznámka (povinná)</label>
              </div>
              <textarea
                value={finishNote}
                onChange={(e) => setFinishNote(e.target.value)}
                placeholder="Např. nedostatek zásob na pozici H10..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none resize-none focus:border-orange-300"
                rows={3}
                autoFocus
              />
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setShowFinishDialog(false)}
                className="flex-1 px-4 py-3 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
              >
                Zpět
              </button>
              <button
                onClick={handleFinish}
                disabled={!finishNote.trim()}
                className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-orange-500 hover:bg-orange-600 active:scale-[0.98] transition-all disabled:opacity-50"
              >
                Dokončit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
