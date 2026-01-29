'use client';

import { useEffect } from 'react';
import { ChevronDown, Settings, User } from 'lucide-react';
import { AttendanceModule } from './attendance-module';
import { LiveClock } from './live-clock';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useAdminStore } from '@/stores/admin-store';
import { useUsersStore } from '@/stores/users-store';
import { useModulesStore } from '@/stores/modules-store';
import { cn } from '@/lib/utils';

export function Header() {
  const {
    _hydrated,
    currentUser,
    getAvailableStores,
    getAvailableRoles,
    getActiveRole,
    activeRoleId,
    activeStoreId,
    setActiveRole,
    setActiveStore,
    switchToUser,
    getAllActiveUsers,
    needsStoreSelection,
    getActiveRoleType,
  } = useAuthStore();

  const { getModulesForRole } = useModulesStore();

  const {
    isInWork,
    kasaConfirmed,
    workplaceName,
    toggleAttendance,
    confirmKasa,
    setWorkplace,
  } = useAttendanceStore();

  const { goToSettings } = useAdminStore();
  const usersHydrated = useUsersStore((state) => state._hydrated);

  const allUsers = getAllActiveUsers();
  const isFullyHydrated = _hydrated && usersHydrated;
  const availableStores = getAvailableStores();
  const availableRoles = getAvailableRoles();
  const activeRole = getActiveRole();
  const showStoreSelector = needsStoreSelection();
  const isAdmin = getActiveRoleType() === 'administrator';
  const showRoleSelector = availableRoles.length > 1;

  // Check if current role has attendance module assigned
  const roleModules = getModulesForRole(activeRole?.id || '');
  const hasAttendanceModule = roleModules.some((m) => m.moduleId === 'attendance');

  // Synchronize workplace with auth-store after hydration (fixes reload issue)
  useEffect(() => {
    if (!_hydrated || !activeRoleId) return;

    const role = getActiveRole();
    if (!role) return;

    if (role.type === 'prodavac') {
      const stores = getAvailableStores();
      if (stores.length > 0) {
        const store = stores.find((s) => s.id === activeStoreId) || stores[0];
        setWorkplace('store', store.id, store.name, true);
      } else {
        setWorkplace('store', '', 'Bez prodejny', false);
      }
    } else {
      setWorkplace('role', role.id, role.name, false);
    }
  }, [_hydrated, activeRoleId, activeStoreId, getActiveRole, getAvailableStores, setWorkplace]);

  const handleUserChange = (userId: string) => {
    switchToUser(userId);

    // Update workplace based on the new user's role
    const user = allUsers.find((u) => u.id === userId);
    if (user) {
      // Get the user's default role
      const { getActiveRole: getNewRole, getAvailableStores: getNewStores } =
        useAuthStore.getState();
      const newRole = getNewRole();

      if (newRole) {
        if (newRole.type === 'prodavac') {
          const stores = getNewStores();
          if (stores.length > 0) {
            setWorkplace('store', stores[0].id, stores[0].name, true);
          } else {
            setWorkplace('store', '', 'Bez prodejny', false);
          }
        } else {
          setWorkplace('role', newRole.id, newRole.name, false);
        }
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

  const handleRoleChange = (roleId: string) => {
    setActiveRole(roleId);

    // Update workplace based on the new role
    const role = availableRoles.find((r) => r.id === roleId);
    if (role) {
      if (role.type === 'prodavac') {
        const stores = getAvailableStores();
        if (stores.length > 0) {
          const store = stores[0];
          setWorkplace('store', store.id, store.name, true);
        } else {
          setWorkplace('store', '', 'Bez prodejny', false);
        }
      } else {
        setWorkplace('role', role.id, role.name, false);
      }
    }
  };

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-50">
      <div className="flex items-center space-x-6">
        <div className="text-2xl font-bold tracking-tight text-slate-800">
          SYSTEM<span className="text-blue-600">.PRO</span>
        </div>
        <div className="h-8 w-px bg-slate-200" />

        {/* User Selector Dropdown */}
        {isFullyHydrated ? (
          <div className="relative group">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
            <select
              value={currentUser?.id || ''}
              onChange={(e) => handleUserChange(e.target.value)}
              className="appearance-none bg-slate-100 pl-9 pr-10 py-2.5 rounded-xl text-base font-semibold text-slate-800 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
            >
              {allUsers.map((user) => (
                <option key={user.id} value={user.id}>
                  {user.fullName}
                </option>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" />
          </div>
        ) : (
          <div className="bg-slate-100 px-4 py-2.5 rounded-xl text-base font-semibold text-slate-400">
            Načítání...
          </div>
        )}

        {/* Role Selector (only for users with multiple roles) */}
        {_hydrated && showRoleSelector && (
          <>
            <div className="h-6 w-px bg-slate-200" />
            <div className="relative group">
              <select
                value={activeRoleId || ''}
                onChange={(e) => handleRoleChange(e.target.value)}
                disabled={isInWork}
                className={cn(
                  'appearance-none bg-slate-50 px-4 py-2 pr-8 rounded-lg text-sm font-semibold text-slate-700 outline-none cursor-pointer border border-slate-200',
                  isInWork ? 'opacity-50 cursor-not-allowed' : 'hover:border-slate-300'
                )}
              >
                {availableRoles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            </div>
          </>
        )}

        {/* Store Selector (only for Prodavač with multiple stores) */}
        {_hydrated && showStoreSelector && (
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
        {_hydrated && isAdmin && (
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

      {/* Attendance Module (only for roles with attendance module assigned) */}
      {_hydrated && hasAttendanceModule && (
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
