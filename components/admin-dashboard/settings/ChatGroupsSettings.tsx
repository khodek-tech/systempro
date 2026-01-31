'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/stores/chat-store';
import { useUsersStore } from '@/stores/users-store';
import { ChatGroupFormModal } from './ChatGroupFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export function ChatGroupsSettings() {
  const { groups, openGroupForm, deleteGroup } = useChatStore();
  const { getUserById } = useUsersStore();

  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [groupToDelete, setGroupToDelete] = useState<string | null>(null);

  const handleDeleteClick = (groupId: string) => {
    setGroupToDelete(groupId);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = () => {
    if (groupToDelete) {
      deleteGroup(groupToDelete);
      setGroupToDelete(null);
      setDeleteModalOpen(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('cs-CZ', {
      day: 'numeric',
      month: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-800">Chat skupiny</h2>
          <p className="text-sm text-slate-500 mt-1">
            Správa komunikačních skupin pro zaměstnance
          </p>
        </div>
        <Button
          onClick={() => openGroupForm()}
          className="bg-blue-600 text-white hover:bg-blue-700"
        >
          <Plus className="w-4 h-4 mr-2" />
          Nová skupina
        </Button>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50 border-b border-slate-200">
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Název
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Členové
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vytvořeno
              </th>
              <th className="text-left px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Vytvořil
              </th>
              <th className="text-right px-6 py-4 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {groups.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-slate-500">
                  Žádné skupiny. Vytvořte první skupinu.
                </td>
              </tr>
            ) : (
              groups.map((group) => {
                const creator = getUserById(group.createdBy);
                return (
                  <tr
                    key={group.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="px-6 py-4">
                      <span className="font-semibold text-slate-800">{group.name}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Users className="w-4 h-4 text-slate-400" />
                        <span className="text-sm font-medium text-slate-600">
                          {group.memberIds.length} členů
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {formatDate(group.createdAt)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <span className="text-sm text-slate-600">
                        {creator?.fullName || 'Neznámý'}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openGroupForm(group.id)}
                          className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Upravit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteClick(group.id)}
                          className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Smazat"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modals */}
      <ChatGroupFormModal />

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setGroupToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Smazat skupinu"
        itemName={groups.find((g) => g.id === groupToDelete)?.name || 'tuto skupinu'}
        warningMessage="Všechny zprávy v této skupině budou trvale odstraněny."
      />
    </div>
  );
}
