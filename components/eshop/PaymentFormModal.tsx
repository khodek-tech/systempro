'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';

export function PaymentFormModal() {
  const { editingPaymentId, selectedShopId, closePaymentForm, createPayment, updatePayment, shopPayments } = useEshopEshopyStore();
  const existing = editingPaymentId ? shopPayments.find((p) => p.id === editingPaymentId) : null;

  const [saving, setSaving] = useState(false);
  const [name, setName] = useState(existing?.name ?? '');
  const [type, setType] = useState(existing?.type ?? 'kartou');
  const [price, setPrice] = useState(existing?.price ?? 0);
  const [active, setActive] = useState(existing?.active ?? true);
  const [order, setOrder] = useState(existing?.order ?? 0);

  const handleSubmit = async () => {
    if (!name.trim() || !selectedShopId) return;
    setSaving(true);

    const data = {
      name: name.trim(),
      type: type.trim(),
      price,
      active,
      order,
      config: {},
    };

    if (editingPaymentId) {
      await updatePayment(editingPaymentId, data);
    } else {
      await createPayment({ ...data, shopId: selectedShopId });
    }
    setSaving(false);
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {existing ? 'Upravit platbu' : 'Nová platba'}
          </h2>
          <button onClick={closePaymentForm} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <label className={labelClass}>Název *</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} className={inputClass} placeholder="Kartou online" />
          </div>
          <div>
            <label className={labelClass}>Typ</label>
            <select value={type} onChange={(e) => setType(e.target.value)} className={inputClass}>
              <option value="kartou">Kartou online</option>
              <option value="prevodem">Bankovním převodem</option>
              <option value="dobirka">Dobírka</option>
              <option value="jine">Jiné</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelClass}>Příplatek (Kč)</label>
              <input type="number" value={price} onChange={(e) => setPrice(Number(e.target.value))} className={inputClass} min={0} />
            </div>
            <div>
              <label className={labelClass}>Pořadí</label>
              <input type="number" value={order} onChange={(e) => setOrder(Number(e.target.value))} className={inputClass} min={0} />
            </div>
          </div>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={active} onChange={(e) => setActive(e.target.checked)} className="w-4 h-4 rounded" />
            <span className="text-sm font-medium text-slate-600">Aktivní</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={closePaymentForm} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !name.trim()}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukládám...' : existing ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}
