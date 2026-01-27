'use client';

import { Role, WorkplaceType } from '@/types';
import { RoleSwitcher } from './role-switcher';
import { AttendanceModule } from './attendance-module';
import { LiveClock } from './live-clock';

interface HeaderProps {
  role: Role;
  onRoleChange: (role: Role) => void;
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplace: WorkplaceType;
  onToggleAttendance: () => { success: boolean; error?: string };
  onKasaConfirm: (confirmed: boolean) => void;
  onWorkplaceChange: (workplace: WorkplaceType) => void;
}

export function Header({
  role,
  onRoleChange,
  isInWork,
  kasaConfirmed,
  workplace,
  onToggleAttendance,
  onKasaConfirm,
  onWorkplaceChange,
}: HeaderProps) {
  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-50">
      <div className="flex items-center space-x-6">
        <div className="text-2xl font-bold tracking-tight text-slate-800">
          SYSTEM<span className="text-blue-600">.PRO</span>
        </div>
        <div className="h-8 w-px bg-slate-200" />
        <RoleSwitcher role={role} onRoleChange={onRoleChange} />
      </div>

      {role === 'prodavac' && (
        <AttendanceModule
          isInWork={isInWork}
          kasaConfirmed={kasaConfirmed}
          workplace={workplace}
          onToggleAttendance={onToggleAttendance}
          onKasaConfirm={onKasaConfirm}
          onWorkplaceChange={onWorkplaceChange}
        />
      )}

      <LiveClock />
    </header>
  );
}
