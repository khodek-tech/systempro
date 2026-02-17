'use client';

import { useState, useMemo } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRolesStore } from '@/stores/roles-store';
import { Role } from '@/types';

interface RoleFormModalProps {
  open: boolean;
  onClose: () => void;
  role: Role | null;
}

/**
 * Slugify: lowercase, remove diacritics, spaces → hyphens, keep only a-z0-9-
 */
function slugify(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^a-z0-9-]/g, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

export function RoleFormModal({ open, onClose, role }: RoleFormModalProps) {
  const { addRole, updateRole, roles } = useRolesStore();
  const isEditing = !!role;

  // Initialize from props - component remounts with new key when role changes
  const [name, setName] = useState(role?.name ?? '');
  const [type, setType] = useState(role?.type ?? '');
  const [autoSlug, setAutoSlug] = useState(!isEditing);

  // Collect unique existing role types for datalist suggestions
  const existingTypes = useMemo(() => {
    const types = new Set(roles.map((r) => r.type));
    return Array.from(types).sort((a, b) => a.localeCompare(b, 'cs'));
  }, [roles]);

  const handleNameChange = (value: string) => {
    setName(value);
    if (autoSlug) {
      setType(slugify(value));
    }
  };

  const handleTypeChange = (value: string) => {
    setType(value);
    setAutoSlug(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || !type.trim()) return;

    const finalType = slugify(type);
    if (!finalType) return;

    if (isEditing && role) {
      updateRole(role.id, { name: name.trim(), type: finalType });
    } else {
      addRole({ name: name.trim(), type: finalType, active: true });
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
              onChange={(e) => handleNameChange(e.target.value)}
              placeholder="např. Prodavač"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Typ role (slug)</label>
            <input
              type="text"
              value={type}
              onChange={(e) => handleTypeChange(e.target.value)}
              placeholder="např. prodavac"
              list="role-type-suggestions"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
            <datalist id="role-type-suggestions">
              {existingTypes.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
            {type && type !== slugify(type) && (
              <p className="text-xs text-slate-400 mt-1">
                Bude uloženo jako: <span className="font-mono font-semibold text-slate-600">{slugify(type)}</span>
              </p>
            )}
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
              disabled={!name.trim() || !slugify(type)}
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
