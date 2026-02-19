'use client';

import { useState } from 'react';
import { X, Loader2, Truck } from 'lucide-react';
import { useUsersStore } from '@/core/stores/users-store';
import { usePrevodkyStore } from '@/stores/prevodky-store';

const DELIVERY_STORES = [
  'Bohnice', 'Brno', 'Butovice', 'Chodov', 'OC_Šestka', 'Prosek', 'Ústí', 'Vysočany', 'Zličín',
];

interface GenerateDialogProps {
  onClose: () => void;
}

export function GenerateDialog({ onClose }: GenerateDialogProps) {
  const users = useUsersStore((s) => s.users);
  const { isGenerating, generatePrevodky } = usePrevodkyStore();

  // assignment per store
  const [assignments, setAssignments] = useState<Record<string, string>>({});

  const activeUsers = users.filter((u) => u.active);

  const handleAssign = (store: string, userId: string) => {
    setAssignments((prev) => ({ ...prev, [store]: userId }));
  };

  const handleGenerate = async () => {
    const entries = Object.entries(assignments).filter(([, userId]) => userId);
    if (entries.length === 0) return;

    const result = await generatePrevodky(
      entries.map(([store, userId]) => ({ store, userId }))
    );

    if (result.success) {
      onClose();
    }
  };

  const assignedCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-white rounded-2xl shadow-lg max-w-lg w-full mx-4 max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center">
              <Truck className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800">Generovat převodky</h2>
              <p className="text-sm text-slate-500">Přiřaďte pickery k prodejnám</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
            <X className="w-5 h-5 text-slate-400" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-3">
          {DELIVERY_STORES.map((store) => (
            <div key={store} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
              <span className="text-sm font-semibold text-slate-700 w-28 flex-shrink-0">
                {store}
              </span>
              <select
                value={assignments[store] || ''}
                onChange={(e) => handleAssign(store, e.target.value)}
                className="flex-1 bg-white border border-slate-200 rounded-lg p-2.5 text-sm font-medium outline-none cursor-pointer focus:border-orange-300"
              >
                <option value="">-- Nepřiřazeno --</option>
                {activeUsers.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName}
                  </option>
                ))}
              </select>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between p-6 border-t border-slate-200">
          <span className="text-sm text-slate-500">
            {assignedCount} z {DELIVERY_STORES.length} prodejen přiřazeno
          </span>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-lg font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 transition-all"
            >
              Zrušit
            </button>
            <button
              onClick={handleGenerate}
              disabled={assignedCount === 0 || isGenerating}
              className="flex items-center gap-2 px-5 py-2 rounded-lg font-semibold text-white bg-purple-600 hover:bg-purple-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isGenerating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Truck className="w-4 h-4" />
              )}
              {isGenerating ? 'Generuji...' : 'Generovat'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
