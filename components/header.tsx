'use client';

import { ChevronDown, Settings } from 'lucide-react';
import { AttendanceModule } from './attendance-module';
import { LiveClock } from './live-clock';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useAdminStore } from '@/stores/admin-store';
import { cn } from '@/lib/utils';

export function Header() {
  const {
    getAvailableRoles,
    getAvailableStores,
    getActiveRole,
    activeRoleId,
    activeStoreId,
    setActiveRole,
    setActiveStore,
    needsStoreSelection,
    hasAttendance,
    getActiveRoleType,
  } = useAuthStore();

  const {
    isInWork,
    kasaConfirmed,
    workplaceName,
    toggleAttendance,
    confirmKasa,
    setWorkplace,
  } = useAttendanceStore();

  const { goToSettings } = useAdminStore();

  const availableRoles = getAvailableRoles();
  const availableStores = getAvailableStores();
  const activeRole = getActiveRole();
  const showStoreSelector = needsStoreSelection();
  const showAttendance = hasAttendance();
  const isAdmin = getActiveRoleType() === 'administrator';

  const handleRoleChange = (roleId: string) => {
    setActiveRole(roleId);

    // Update workplace based on role
    const role = availableRoles.find((r) => r.id === roleId);
    if (role) {
      if (role.type === 'prodavac') {
        // For prodavac, set workplace to first available store
        const stores = getAvailableStores();
        if (stores.length > 0) {
          setWorkplace('store', stores[0].id, stores[0].name, true);
        }
      } else {
        // For other roles, set workplace to role name (no kasa required)
        setWorkplace('role', role.id, role.name, false);
      }
    }
  };

  const handleStoreChange = (storeId: string) => {
    setActiveStore(storeId);
    const store = availableStores.find((s) => s.id === storeId);
    if (store) {
      setWorkplace('store', store.id, store.name, true);
    }
  };

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-50">
      <div className="flex items-center space-x-6">
        <div className="text-2xl font-bold tracking-tight text-slate-800">
          SYSTEM<span className="text-blue-600">.PRO</span>
        </div>
        <div className="h-8 w-px bg-slate-200" />

        {/* Role Selector Dropdown */}
        <div className="relative group">
          <select
            value={activeRoleId || ''}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="appearance-none bg-slate-100 px-6 py-2.5 pr-10 rounded-xl text-base font-semibold text-slate-800 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
          >
            {availableRoles.map((role) => (
              <option key={role.id} value={role.id}>
                {role.name}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
        </div>

        {/* Store Selector (only for Prodavač with multiple stores) */}
        {showStoreSelector && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <div className="relative group">
              <select
                value={activeStoreId || ''}
                onChange={(e) => handleStoreChange(e.target.value)}
                disabled={isInWork}
                className={cn(
                  'appearance-none bg-slate-50 px-4 py-2 pr-8 rounded-lg text-sm font-medium text-slate-700 outline-none cursor-pointer border border-slate-200',
                  isInWork ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'
                )}
              >
                {availableStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </>
        )}

        {/* Settings Icon (only for Administrator) */}
        {isAdmin && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <button
              onClick={goToSettings}
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              title="Nastavení"
            >
              <Settings className="w-5 h-5" />
            </button>
          </>
        )}
      </div>

      {/* Attendance Module (only for roles with attendance) */}
      {showAttendance && (
        <AttendanceModule
          isInWork={isInWork}
          kasaConfirmed={kasaConfirmed}
          workplaceName={workplaceName}
          activeRole={activeRole}
          onToggleAttendance={toggleAttendance}
          onKasaConfirm={confirmKasa}
        />
      )}

      <LiveClock />
    </header>
  );
}
