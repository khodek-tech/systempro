'use client';

import { useState, useMemo } from 'react';
import { Plus, Pencil, ToggleLeft, ToggleRight, ShieldAlert, ChevronUp, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRolesStore } from '@/stores/roles-store';
import { RoleFormModal } from './RoleFormModal';
import { Role } from '@/types';

type SortField = 'name' | 'type' | null;
type SortDirection = 'asc' | 'desc';

export function RolesSettings() {
  const { roles, toggleRoleActive, canDeactivateRole } = useRolesStore();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [modalKey, setModalKey] = useState(0);
  const [sortField, setSortField] = useState<SortField>(null);
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const sortedRoles = useMemo(() => {
    if (!sortField) return roles;
    return [...roles].sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const comparison = aValue.localeCompare(bValue, 'cs');
      return sortDirection === 'asc' ? comparison : -comparison;
    });
  }, [roles, sortField, sortDirection]);

  const handleAdd = () => {
    setEditingRole(null);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleEdit = (role: Role) => {
    setEditingRole(role);
    setModalKey((prev) => prev + 1);
    setModalOpen(true);
  };

  const handleClose = () => {
    setModalOpen(false);
    setEditingRole(null);
  };

  const handleToggle = (role: Role) => {
    if (!canDeactivateRole(role.id)) {
      alert('Role Administrátor nemůže být deaktivována.');
      return;
    }
    toggleRoleActive(role.id);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-slate-800">Správa rolí</h2>
        <Button
          onClick={handleAdd}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 active:scale-[0.98] transition-all"
        >
          <Plus className="w-4 h-4 mr-2" />
          Přidat roli
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
                  onClick={() => handleSort('type')}
                  className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wide text-slate-500 hover:text-slate-700 cursor-pointer transition-all"
                >
                  Typ
                  {sortField === 'type' &&
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
            {sortedRoles.map((role) => {
              const isProtected = !canDeactivateRole(role.id);
              return (
                <tr key={role.id} className="border-t border-slate-100 hover:bg-slate-50">
                  <td className="px-4 py-3 text-sm font-medium text-slate-800">
                    <div className="flex items-center space-x-2">
                      <span>{role.name}</span>
                      {isProtected && (
                        <span title="Chráněná role">
                          <ShieldAlert className="w-4 h-4 text-orange-500" />
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-sm text-slate-600">{role.type}</td>
                  <td className="px-4 py-3 text-center">
                    <button
                      onClick={() => handleToggle(role)}
                      className="inline-flex items-center justify-center"
                      disabled={isProtected}
                    >
                      {role.active ? (
                        <ToggleRight
                          className={`w-8 h-8 ${isProtected ? 'text-green-300' : 'text-green-500'}`}
                        />
                      ) : (
                        <ToggleLeft className="w-8 h-8 text-slate-300" />
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      onClick={() => handleEdit(role)}
                      variant="outline"
                      size="sm"
                      className="text-slate-600"
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Modal with key to force remount */}
      <RoleFormModal key={modalKey} open={modalOpen} onClose={handleClose} role={editingRole} />
    </div>
  );
}
