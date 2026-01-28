'use client';

import { useState } from 'react';
import { X, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { User } from '@/types';
import { cn } from '@/lib/utils';

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function EmployeeFormModal({ open, onClose, user }: EmployeeFormModalProps) {
  const { addUser, updateUser } = useUsersStore();
  const { roles } = useRolesStore();
  const { stores } = useStoresStore();

  const isEditing = !!user;

  // Initialize from props - component remounts with new key when user changes
  const [username, setUsername] = useState(user?.username ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roleIds ?? []);
  const [selectedStores, setSelectedStores] = useState<string[]>(user?.storeIds ?? []);
  const [error, setError] = useState<string | null>(null);

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) =>
      prev.includes(roleId) ? prev.filter((id) => id !== roleId) : [...prev, roleId]
    );
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) =>
      prev.includes(storeId) ? prev.filter((id) => id !== storeId) : [...prev, storeId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const userData = {
      username: username.trim(),
      fullName: fullName.trim(),
      roleIds: selectedRoles,
      storeIds: selectedStores,
      active: user?.active ?? true,
    };

    if (isEditing && user) {
      const result = updateUser(user.id, userData);
      if (!result.success) {
        setError(result.error || 'Nepodařilo se aktualizovat zaměstnance');
        return;
      }
    } else {
      const result = addUser(userData);
      if (!result.success) {
        setError(result.error || 'Nepodařilo se přidat zaměstnance');
        return;
      }
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Upravit zaměstnance' : 'Nový zaměstnanec'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Uživatelské jméno
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="např. novak"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Celé jméno</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="např. Jan Novák"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {roles
                .filter((r) => r.active)
                .map((role) => (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => toggleRole(role.id)}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all',
                      selectedRoles.includes(role.id)
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {selectedRoles.includes(role.id) && <Check className="w-4 h-4" />}
                    <span className="text-sm font-medium">{role.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Stores */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Prodejny</label>
            <div className="flex flex-wrap gap-2">
              {stores
                .filter((s) => s.active)
                .map((store) => (
                  <button
                    key={store.id}
                    type="button"
                    onClick={() => toggleStore(store.id)}
                    className={cn(
                      'flex items-center space-x-2 px-3 py-2 rounded-lg border transition-all',
                      selectedStores.includes(store.id)
                        ? 'bg-green-50 border-green-300 text-green-700'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                    )}
                  >
                    {selectedStores.includes(store.id) && <Check className="w-4 h-4" />}
                    <span className="text-sm font-medium">{store.name}</span>
                  </button>
                ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              onClick={onClose}
              variant="outline"
              className="px-6 py-2 rounded-lg font-medium"
            >
              Zrušit
            </Button>
            <Button
              type="submit"
              className="bg-blue-600 text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
            >
              {isEditing ? 'Uložit' : 'Přidat'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
