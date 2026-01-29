'use client';

import { useState } from 'react';
import { Store, Users, Shield, LayoutGrid, Save, Loader2, Check, AlertCircle } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { useUsersStore } from '@/stores/users-store';
import { useStoresStore } from '@/stores/stores-store';
import { useRolesStore } from '@/stores/roles-store';
import { useAbsenceStore } from '@/stores/absence-store';
import { saveDataToFile } from '@/lib/actions/save-data';
import { StoresSettings } from './StoresSettings';
import { RolesSettings } from './RolesSettings';
import { EmployeesSettings } from './EmployeesSettings';
import { ModulesSettings } from './ModulesSettings';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'stores' as const, label: 'Prodejny', icon: Store },
  { id: 'roles' as const, label: 'Role', icon: Shield },
  { id: 'employees' as const, label: 'Zaměstnanci', icon: Users },
  { id: 'modules' as const, label: 'Moduly', icon: LayoutGrid },
];

type SaveStatus = 'idle' | 'saving' | 'success' | 'error';

export function AdminSettingsView() {
  const { settingsTab, setSettingsTab } = useAdminStore();
  const users = useUsersStore((state) => state.users);
  const stores = useStoresStore((state) => state.stores);
  const roles = useRolesStore((state) => state.roles);
  const absenceRequests = useAbsenceStore((state) => state.absenceRequests);

  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');

  const handleSaveToFile = async () => {
    setSaveStatus('saving');
    setErrorMessage('');

    try {
      const result = await saveDataToFile({
        users,
        stores,
        roles,
        absenceRequests,
      });

      if (result.success) {
        setSaveStatus('success');
        setTimeout(() => setSaveStatus('idle'), 3000);
      } else {
        setSaveStatus('error');
        setErrorMessage(result.error || 'Neznámá chyba');
        setTimeout(() => setSaveStatus('idle'), 5000);
      }
    } catch {
      setSaveStatus('error');
      setErrorMessage('Chyba při ukládání');
      setTimeout(() => setSaveStatus('idle'), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header with tabs and save button */}
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

        {/* Save to file button */}
        <button
          onClick={handleSaveToFile}
          disabled={saveStatus === 'saving'}
          className={cn(
            'flex items-center gap-2 px-4 py-2.5 rounded-lg font-semibold transition-all duration-200',
            saveStatus === 'idle' && 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98]',
            saveStatus === 'saving' && 'bg-blue-400 text-white cursor-not-allowed',
            saveStatus === 'success' && 'bg-green-600 text-white',
            saveStatus === 'error' && 'bg-red-600 text-white'
          )}
        >
          {saveStatus === 'idle' && (
            <>
              <Save className="w-4 h-4" />
              <span>Uložit do souboru</span>
            </>
          )}
          {saveStatus === 'saving' && (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Ukládám...</span>
            </>
          )}
          {saveStatus === 'success' && (
            <>
              <Check className="w-4 h-4" />
              <span>Uloženo</span>
            </>
          )}
          {saveStatus === 'error' && (
            <>
              <AlertCircle className="w-4 h-4" />
              <span>{errorMessage || 'Chyba'}</span>
            </>
          )}
        </button>
      </div>

      {/* Tab content */}
      <div className="animate-in fade-in duration-300">
        {settingsTab === 'stores' && <StoresSettings />}
        {settingsTab === 'roles' && <RolesSettings />}
        {settingsTab === 'employees' && <EmployeesSettings />}
        {settingsTab === 'modules' && <ModulesSettings />}
      </div>
    </div>
  );
}
