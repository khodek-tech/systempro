'use client';

import { useState } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { EmployeeFormModal } from './EmployeeFormModal';
import { User } from '@/types';

type SortField = 'fullName' | 'username' | 'role' | 'store' | null;
type SortDirection = 'asc' | 'desc';

export function EmployeesSettings() {
  const { users, toggleUserActive } = useUsersStore();
  const { getRoleById } = useRolesStore();
  const { getStoreById } = useStoresStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

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

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;

    let aValue = '';
    let bValue = '';

    switch (sortField) {
      case 'fullName':
        aValue = a.fullName;
        bValue = b.fullName;
        break;
      case 'username':
        aValue = a.username;
        bValue = b.username;
        break;
      case 'role':
        aValue = getRoleNames(a.roleIds);
        bValue = getRoleNames(b.roleIds);
        break;
      case 'store':
        aValue = getStoreNames(a.storeIds);
        bValue = getStoreNames(b.storeIds);
        break;
    }

    const result = aValue.localeCompare(bValue, 'cs');
    return sortDirection === 'asc' ? result : -result;
  });

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
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('fullName')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Jméno
                  {sortField === 'fullName' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('username')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Uživatel
                  {sortField === 'username' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('role')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Role
                  {sortField === 'role' &&
                    (sortDirection === 'asc' ? (
                      <ChevronUp className="w-3 h-3" />
                    ) : (
                      <ChevronDown className="w-3 h-3" />
                    ))}
                </button>
              </th>
              <th className="text-left px-4 py-3">
                <button
                  onClick={() => handleSort('store')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Prodejny
                  {sortField === 'store' &&
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
              <th className="text-right px-4 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                Akce
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedUsers.map((user) => (
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
