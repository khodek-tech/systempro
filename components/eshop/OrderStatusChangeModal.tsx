'use client';

import { useState } from 'react';
import { X, Mail } from 'lucide-react';
import { useEshopObjednavkyStore } from '@/stores/eshop-objednavky-store';
import { useAuthStore } from '@/core/stores/auth-store';
import type { OrderStatus } from '@/shared/types';

const STATUS_OPTIONS: { value: OrderStatus; label: string }[] = [
  { value: 'nova', label: 'Nová' },
  { value: 'zaplacena', label: 'Zaplacená' },
  { value: 'expedovana', label: 'Expedovaná' },
  { value: 'dorucena', label: 'Doručená' },
  { value: 'zrusena', label: 'Zrušená' },
];

export function OrderStatusChangeModal() {
  const { selectedOrderId, getOrderById, updateOrderStatus, closeStatusChange } = useEshopObjednavkyStore();
  const currentUser = useAuthStore((s) => s.currentUser);
  const order = selectedOrderId ? getOrderById(selectedOrderId) : null;

  const [newStatus, setNewStatus] = useState<OrderStatus>(order?.status ?? 'nova');
  const [note, setNote] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [saving, setSaving] = useState(false);

  if (!order) return null;

  const handleSubmit = async () => {
    if (newStatus === order.status) return;
    setSaving(true);
    await updateOrderStatus(order.id, newStatus, note.trim() || undefined, currentUser ? Number(currentUser.id) : undefined, sendEmail);
    setSaving(false);
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md animate-in slide-in-from-top-2 duration-300">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">Změna stavu objednávky</h2>
          <button onClick={closeStatusChange} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-slate-500 mb-2">Objednávka: <span className="font-semibold text-slate-800">{order.orderNumber}</span></p>
          </div>
          <div>
            <label className={labelClass}>Nový stav</label>
            <select value={newStatus} onChange={(e) => setNewStatus(e.target.value as OrderStatus)} className={inputClass}>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelClass}>Poznámka</label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              className={`${inputClass} resize-none`}
              rows={3}
              placeholder="Volitelná poznámka ke změně stavu..."
            />
          </div>
          <label className="flex items-center gap-2 cursor-pointer group">
            <input
              type="checkbox"
              checked={sendEmail}
              onChange={(e) => setSendEmail(e.target.checked)}
              className="w-4 h-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 cursor-pointer"
            />
            <Mail className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
            <span className="text-sm font-medium text-slate-600 group-hover:text-slate-800 transition-colors">Odeslat email zákazníkovi</span>
          </label>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={closeStatusChange} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || newStatus === order.status}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukládám...' : 'Změnit stav'}
          </button>
        </div>
      </div>
    </div>
  );
}
