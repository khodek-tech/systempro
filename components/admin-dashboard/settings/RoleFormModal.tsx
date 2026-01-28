'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRolesStore } from '@/stores/roles-store';
import { Role, RoleType } from '@/types';

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

const ROLE_TYPES: { value: RoleType; label: string }[] = [
  { value: 'prodavac', label: 'Prodavač' },
  { value: 'skladnik', label: 'Skladník' },
  { value: 'administrator', label: 'Administrátor' },
  { value: 'vedouci-sklad', label: 'Vedoucí skladu' },
  { value: 'obsluha-eshop', label: 'Obsluha e-shopu' },
  { value: 'obchodnik', label: 'Obchodník' },
  { value: 'vedouci-velkoobchod', label: 'Vedoucí velkoobchodu' },
  { value: 'majitel', label: 'Majitel' },
];

export function RoleFormModal({ open, onClose, role }: RoleFormModalProps) {
  const { addRole, updateRole } = useRolesStore();
  const isEditing = !!role;

  // Initialize from props - component remounts with new key when role changes
  const [name, setName] = useState(role?.name ?? '');
  const [type, setType] = useState<RoleType>(role?.type ?? 'prodavac');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    if (isEditing && role) {
      updateRole(role.id, { name: name.trim(), type });
    } else {
      addRole({ name: name.trim(), type, active: true });
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Upravit roli' : 'Nová role'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Název role</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Prodavač"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Typ role</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as RoleType)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-semibold outline-none cursor-pointer focus:border-orange-300"
            >
              {ROLE_TYPES.map((roleType) => (
                <option key={roleType.value} value={roleType.value}>
                  {roleType.label}
                </option>
              ))}
            </select>
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
