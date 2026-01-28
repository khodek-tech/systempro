'use client';

import { useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { EmployeeFormModal } from './EmployeeFormModal';
import { User } from '@/types';

export function EmployeesSettings() {
  const { users, toggleUserActive } = useUsersStore();
  const { getRoleById } = useRolesStore();
  const { getStoreById } = useStoresStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalKey, setModalKey] = useState(0);

  const handleAdd = () => {
    setEditingUser(null);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingUser(null);
  };

  const getRoleNames = (roleIds: string[]) => {
    return roleIds
      .map((id) => getRoleById(id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  const getStoreNames = (storeIds: string[]) => {
    return storeIds
      .map((id) => getStoreById(id)?.name)
      .filter(Boolean)
      .join(', ');
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Správa zaměstnanců</h2>
        <Button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat zaměstnance
        </Button>
      </div>

      {/* Table */}
      <div className="shadow-sm border border-slate-200 bg-white rounded-xl overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Jméno
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Uživatel
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Role
              </th>
              <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Prodejny
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
            {users.map((user) => (
              <tr key={user.id} className="border-t border-slate-100 hover:bg-slate-50">
                <td className="px-4 py-3 text-sm font-medium text-slate-800">{user.fullName}</td>
                <td className="px-4 py-3 text-sm text-slate-600">{user.username}</td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {getRoleNames(user.roleIds) || '-'}
                </td>
                <td className="px-4 py-3 text-sm text-slate-600">
                  {getStoreNames(user.storeIds) || '-'}
                </td>
                <td className="px-4 py-3 text-center">
                  <button
                    onClick={() => toggleUserActive(user.id)}
                    className="inline-flex items-center justify-center"
                  >
                    {user.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button
                    onClick={() => handleEdit(user)}
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
      <EmployeeFormModal key={modalKey} open={modalOpen} onClose={handleClose} user={editingUser} />
    </div>
  );
}
