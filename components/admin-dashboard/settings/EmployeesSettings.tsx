'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, ToggleLeft, ToggleRight, ChevronUp, ChevronDown, KeyRound, AlertTriangle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { EmployeeFormModal } from './EmployeeFormModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { User } from '@/types';

type SortField = 'fullName' | 'username' | 'role' | 'store' | null;
type SortDirection = 'asc' | 'desc';

export function EmployeesSettings() {
  const { users, toggleUserActive, deleteUser, resetPassword } = useUsersStore();
  const { getRoleById } = useRolesStore();
  const { getStoreById } = useStoresStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [sortField, setSortField] = useState<SortField>('fullName');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [deleteModalUser, setDeleteModalUser] = useState<User | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<User | null>(null);
  const [resettingPassword, setResettingPassword] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);

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

  const handleDelete = (user: User) => {
    setDeleteModalUser(user);
  };

  const handleConfirmDelete = async () => {
    if (deleteModalUser) {
      try {
        const result = await deleteUser(deleteModalUser.id);
        if (!result.success) {
          toast.error(result.error);
        }
      } catch {
        toast.error('Nepodařilo se smazat zaměstnance.');
      }
      setDeleteModalUser(null);
    }
  };

  const handleConfirmResetPassword = async () => {
    if (resetPasswordUser) {
      setResettingPassword(true);
      try {
        const result = await resetPassword(resetPasswordUser.id);
        if (result.success) {
          toast.success(`Heslo uživatele ${resetPasswordUser.fullName} bylo resetováno.`);
        } else {
          toast.error(result.error || 'Nepodařilo se resetovat heslo.');
        }
      } catch {
        toast.error('Nepodařilo se resetovat heslo.');
      }
      setResettingPassword(false);
      setResetPasswordUser(null);
    }
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
                    disabled={togglingId === user.id}
                    onClick={async () => {
                      setTogglingId(user.id);
                      try {
                        await toggleUserActive(user.id);
                      } catch {
                        toast.error('Nepodařilo se změnit stav zaměstnance.');
                      } finally {
                        setTogglingId(null);
                      }
                    }}
                    className="inline-flex items-center justify-center disabled:opacity-50"
                    aria-label={user.active ? `Deaktivovat ${user.fullName}` : `Aktivovat ${user.fullName}`}
                  >
                    {togglingId === user.id ? (
                      <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
                    ) : user.active ? (
                      <ToggleRight className="w-8 h-8 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-8 h-8 text-slate-300" />
                    )}
                  </button>
                </td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      onClick={() => handleEdit(user)}
                      variant="outline"
                      size="sm"
                      className="text-slate-600"
                      aria-label={`Upravit ${user.fullName}`}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <button
                      onClick={() => setResetPasswordUser(user)}
                      className="bg-orange-50 text-orange-600 p-2 rounded-lg hover:bg-orange-100 transition-colors"
                      aria-label={`Resetovat heslo ${user.fullName}`}
                    >
                      <KeyRound className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(user)}
                      className="bg-red-50 text-red-600 p-2 rounded-lg hover:bg-red-100 transition-colors"
                      aria-label={`Smazat ${user.fullName}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal with key to force remount */}
      <EmployeeFormModal key={modalKey} open={modalOpen} onClose={handleClose} user={editingUser} />

      {/* Delete confirmation modal */}
      <DeleteConfirmModal
        isOpen={deleteModalUser !== null}
        onClose={() => setDeleteModalUser(null)}
        onConfirm={handleConfirmDelete}
        title="Smazat zaměstnance"
        itemName={deleteModalUser?.fullName || ''}
        warningMessage="Všechna data o zaměstnanci budou permanentně smazána."
      />

      {/* Reset password confirmation modal */}
      {resetPasswordUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/50" onClick={() => !resettingPassword && setResetPasswordUser(null)} />
          <div className="relative bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-lg">
            <h2 className="text-xl font-bold text-slate-800 text-center mb-4">Resetovat heslo</h2>

            <div className="bg-orange-50 border border-orange-200 rounded-xl p-4 mb-6">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-orange-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-orange-700 font-medium">
                    Opravdu chcete resetovat heslo uživatele &quot;{resetPasswordUser.fullName}&quot;?
                  </p>
                  <p className="text-orange-600 text-sm mt-1">
                    Heslo bude nastaveno na výchozí hodnotu a uživatel bude muset při příštím přihlášení zadat nové heslo.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button
                onClick={() => setResetPasswordUser(null)}
                disabled={resettingPassword}
                className="flex-1 bg-slate-100 text-slate-700 px-4 py-2 rounded-lg font-medium hover:bg-slate-200 transition-all"
              >
                Zrušit
              </Button>
              <Button
                onClick={handleConfirmResetPassword}
                disabled={resettingPassword}
                className="flex-1 bg-orange-500 text-white px-4 py-2 rounded-lg font-semibold hover:bg-orange-600 active:scale-[0.98] transition-all"
              >
                {resettingPassword ? 'Resetuji...' : 'Resetovat heslo'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
