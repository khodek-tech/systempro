'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useEshopEshopyStore } from '@/stores/eshop-eshopy-store';

export function EshopRedirectFormModal() {
  const { editingRedirectId, selectedShopId, closeRedirectForm, createRedirect, updateRedirect, redirects } = useEshopEshopyStore();
  const existing = editingRedirectId ? redirects.find((r) => r.id === editingRedirectId) : null;

  const [saving, setSaving] = useState(false);
  const [oldUrl, setOldUrl] = useState(existing?.oldUrl ?? '');
  const [newUrl, setNewUrl] = useState(existing?.newUrl ?? '');
  const [type, setType] = useState(existing?.type ?? 301);

  const handleSubmit = async () => {
    if (!oldUrl.trim() || !newUrl.trim() || !selectedShopId) return;
    setSaving(true);

    if (editingRedirectId) {
      await updateRedirect(editingRedirectId, {
        oldUrl: oldUrl.trim(),
        newUrl: newUrl.trim(),
        type,
      });
    } else {
      await createRedirect({
        shopId: selectedShopId,
        oldUrl: oldUrl.trim(),
        newUrl: newUrl.trim(),
        type,
      });
    }
    setSaving(false);
  };

  const inputClass = 'bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm font-medium outline-none focus:border-emerald-300 w-full';
  const labelClass = 'text-xs font-semibold uppercase tracking-wide text-slate-500';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-lg w-full max-w-md animate-in slide-in-from-top-2 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
          <h2 className="text-lg font-bold text-slate-800">
            {existing ? 'Upravit přesměrování' : 'Nové přesměrování'}
          </h2>
          <button onClick={closeRedirectForm} className="p-2 rounded-lg hover:bg-slate-100 transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 space-y-4">
          <div>
            <label className={labelClass}>Stará URL *</label>
            <input type="text" value={oldUrl} onChange={(e) => setOldUrl(e.target.value)} className={inputClass} placeholder="/stara-stranka" />
          </div>
          <div>
            <label className={labelClass}>Nová URL *</label>
            <input type="text" value={newUrl} onChange={(e) => setNewUrl(e.target.value)} className={inputClass} placeholder="/nova-stranka" />
          </div>
          <div>
            <label className={labelClass}>Typ</label>
            <select value={type} onChange={(e) => setType(Number(e.target.value))} className={inputClass}>
              <option value={301}>301 (Trvalé)</option>
              <option value={302}>302 (Dočasné)</option>
            </select>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-slate-200">
          <button onClick={closeRedirectForm} className="px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors">
            Zrušit
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || !oldUrl.trim() || !newUrl.trim()}
            className="px-6 py-2 rounded-lg text-sm font-semibold bg-emerald-600 text-white hover:bg-emerald-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? 'Ukládám...' : existing ? 'Uložit' : 'Vytvořit'}
          </button>
        </div>
      </div>
    </div>
  );
}
