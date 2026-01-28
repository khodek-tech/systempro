'use client';

import { useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoresStore } from '@/stores/stores-store';
import { StoreFormModal } from './StoreFormModal';
import { Store } from '@/types';

export function StoresSettings() {
  const { stores, toggleStoreActive } = useStoresStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [modalKey, setModalKey] = useState(0);

  const handleAdd = () => {
    setEditingStore(null);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleEdit = (store: Store) => {
    setEditingStore(store);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingStore(null);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Správa prodejen</h2>
        <Button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat prodejnu
        </Button>
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Název
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Adresa
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stav
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {stores.map((store) => (
              <tr key={store.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{store.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{store.address}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleStoreActive(store.id)}
                    className="inline-flex items-center justify-center"
                  >
                    {store.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    onClick={() => handleEdit(store)}
                    variant="outline"
                    size="sm"
                    className="text-slate-600"
                  >
                    <Pencil className="w-4 h-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal with key to force remount */}
      <StoreFormModal key={modalKey} open={modalOpen} onClose={handleClose} store={editingStore} />
    </div>
  );
}
