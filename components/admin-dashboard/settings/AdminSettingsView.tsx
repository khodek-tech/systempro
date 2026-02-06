'use client';

import { Store, Users, Shield, LayoutGrid, Database } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { StoresSettings } from './StoresSettings';
import { RolesSettings } from './RolesSettings';
import { EmployeesSettings } from './EmployeesSettings';
import { ModulesSettings } from './ModulesSettings';
import { PohodaSettings } from './PohodaSettings';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'stores' as const, label: 'Prodejny', icon: Store },
  { id: 'roles' as const, label: 'Role', icon: Shield },
  { id: 'employees' as const, label: 'Zaměstnanci', icon: Users },
  { id: 'modules' as const, label: 'Moduly', icon: LayoutGrid },
  { id: 'pohoda' as const, label: 'Pohoda', icon: Database },
];

export function AdminSettingsView() {
  const { settingsTab, setSettingsTab } = useAdminStore();

  return (
    <div className="space-y-6">
      {/* Header with tabs */}
      <div className="flex items-center justify-between">
        {/* Tabs */}
        <div className="flex bg-slate-100 p-1.5 rounded-xl w-fit">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setSettingsTab(tab.id)}
              className={cn(
                'flex items-center space-x-2 px-6 py-2.5 rounded-lg text-base font-semibold transition-all duration-200',
                settingsTab === tab.id
                  ? 'bg-white shadow-sm text-slate-800'
                  : 'text-slate-400 hover:text-slate-600'
              )}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.label}</span>
            </button>
          );
        })}
        </div>
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in duration-300">
        {settingsTab === 'stores' && <StoresSettings />}
        {settingsTab === 'roles' && <RolesSettings />}
        {settingsTab === 'employees' && <EmployeesSettings />}
        {settingsTab === 'modules' && <ModulesSettings />}
        {settingsTab === 'pohoda' && <PohodaSettings />}
      </div>
    </div>
  );
}
