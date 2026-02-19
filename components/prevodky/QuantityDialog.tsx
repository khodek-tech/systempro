'use client';

import { useState } from 'react';
import { Minus, Plus, X } from 'lucide-react';

interface QuantityDialogProps {
  productName: string;
  productCode: string;
  requiredQty: number;
  onConfirm: (qty: number) => void;
  onCancel: () => void;
}

export function QuantityDialog({ productName, productCode, requiredQty, onConfirm, onCancel }: QuantityDialogProps) {
  const [qty, setQty] = useState(requiredQty);

  const handleSubmit = () => {
    if (qty > 0) {
      onConfirm(qty);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg max-w-md w-full mx-4 p-8">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-bold text-slate-800">Zadejte množství</h3>
          <button onClick={onCancel} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="mb-6">
          <p className="text-base font-semibold text-slate-700">{productName}</p>
          <p className="text-sm font-mono text-slate-500 mt-1">{productCode}</p>
          <p className="text-sm text-slate-500 mt-2">
            Požadováno: <span className="font-bold text-slate-800">{requiredQty} ks</span>
          </p>
        </div>

        <div className="flex items-center justify-center gap-4 mb-8">
          <button
            onClick={() => setQty((q) => Math.max(0, q - 1))}
            className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95"
          >
            <Minus className="w-6 h-6 text-slate-600" />
          </button>
          <input
            type="number"
            value={qty}
            onChange={(e) => setQty(Math.max(0, parseInt(e.target.value) || 0))}
            className="w-24 h-14 text-center text-3xl font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-orange-300"
            min={0}
          />
          <button
            onClick={() => setQty((q) => q + 1)}
            className="w-14 h-14 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors active:scale-95"
          >
            <Plus className="w-6 h-6 text-slate-600" />
          </button>
        </div>

        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="flex-1 px-4 py-3 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
          >
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={qty <= 0}
            className="flex-1 px-4 py-3 rounded-lg font-semibold text-white bg-green-600 hover:bg-green-700 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Potvrdit ({qty} ks)
          </button>
        </div>
      </div>
    </div>
  );
}
