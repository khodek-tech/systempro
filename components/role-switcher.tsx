'use client';

import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface RoleSwitcherProps {
  role: Role;
  onRoleChange: (role: Role) => void;
}

export function RoleSwitcher({ role, onRoleChange }: RoleSwitcherProps) {
  return (
    <div className="flex bg-slate-100 p-1.5 rounded-xl">
      <button
        onClick={() => onRoleChange('prodavac')}
        className={cn(
          'px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200',
          role === 'prodavac'
            ? 'bg-white shadow-sm text-slate-800'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        Prodavač
      </button>
      <button
        onClick={() => onRoleChange('vedouci')}
        className={cn(
          'px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200',
          role === 'vedouci'
            ? 'bg-white shadow-sm text-slate-800'
            : 'text-slate-400 hover:text-slate-600'
        )}
      >
        Vedoucí
      </button>
    </div>
  );
}
