'use client';

import { useState, useMemo } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoresStore } from '@/stores/stores-store';
import { StoreFormModal } from './StoreFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { Store } from '@/types';

type SortField = 'name' | 'address' | 'cashBase' | null;
type SortDirection = 'asc' | 'desc';

export function StoresSettings() {
  const { stores, toggleStoreActive, deleteStore, canDeleteStore } = useStoresStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStore, setEditingStore] = useState<Store | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalStore, setDeleteModalStore] = useState<Store | null>(null);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedStores = useMemo(() => {
    if (!sortField) return stores;
    return [...stores].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        return sortDirection === 'asc' ? aValue - bValue : bValue - aValue;
      }
      const comparison = String(aValue).localeCompare(String(bValue), 'cs');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [stores, sortField, sortDirection]);

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

  const handleDelete = (store: Store) => {
    const check = canDeleteStore(store.id);
    if (!check.canDelete) {
      toast.error(check.reason);
      return;
    }
    setDeleteModalStore(store);
  };

  const handleConfirmDelete = async () => {
    if (deleteModalStore) {
      setDeletingId(deleteModalStore.id);
      try {
        const result = await deleteStore(deleteModalStore.id);
        if (!result.success) {
          toast.error(result.error);
        }
      } catch {
        toast.error('Nepodařilo se smazat prodejnu.');
      } finally {
        setDeletingId(null);
      }
      setDeleteModalStore(null);
    }
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
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Název
                  {sortField === 'name' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('address')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Adresa
                  {sortField === 'address' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-center px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Stav
              </th>
              <th className="text-right px-4 py-3">
                <button
                  onClick={() => handleSort('cashBase')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all ml-auto"
                >
                  Stav pokladny
                  {sortField === 'cashBase' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedStores.map((store) => (
              <tr key={store.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{store.name}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{store.address}</td>
                <td className="px-4 py-3 text-center">
                  <button
                    disabled={togglingId === store.id}
                    onClick={async () => {
                      setTogglingId(store.id);
                      try {
                        await toggleStoreActive(store.id);
                      } catch {
                        toast.error('Nepodařilo se změnit stav prodejny.');
                      } finally {
                        setTogglingId(null);
                      }
                    }}
                    className="inline-flex items-center justify-center disabled:opacity-50"
                    aria-label={store.active ? `Deaktivovat ${store.name}` : `Aktivovat ${store.name}`}
                  >
                    {togglingId === store.id ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : store.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right text-sm font-medium text-slate-700">
                  {(store.cashBase ?? 0).toLocaleString('cs-CZ')} Kč
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => handleEdit(store)}
                      variant="outline"
                      size="sm"
                      className="text-slate-600"
                      aria-label={`Upravit ${store.name}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => handleDelete(store)}
                      disabled={deletingId === store.id}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors disabled:opacity-50"
                      aria-label={`Smazat ${store.name}`}
                    >
                      {deletingId === store.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Trash2 className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal with key to force remount */}
      <StoreFormModal key={modalKey} open={modalOpen} onClose={handleClose} store={editingStore} />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteModalStore !== null}
        onClose={() => setDeleteModalStore(null)}
        onConfirm={handleConfirmDelete}
        title="Smazat prodejnu"
        itemName={deleteModalStore?.name || ''}
        warningMessage="Všechna data o prodejně budou permanentně smazána."
      />
    </div>
  );
}
