'use client';

import { useEffect } from 'react';
import { ChevronDown, Settings, User, HelpCircle, LogOut } from 'lucide-react';
import { signOut } from '@/app/actions/auth';
import { cleanupSubscriptions } from '@/lib/supabase/init';
import { AttendanceModule } from './attendance-module';
import { LiveClock } from './live-clock';
import { useAuthStore } from '@/stores/auth-store';
import { useAttendanceStore } from '@/stores/attendance-store';
import { useAdminStore } from '@/stores/admin-store';
import { useUsersStore } from '@/stores/users-store';
import { useModulesStore } from '@/stores/modules-store';
import { useManualStore } from '@/stores/manual-store';
import { closeAllViews } from '@/lib/navigation';
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
    getAllActiveUsers,
    needsStoreSelection,
    getActiveRoleType,
    handleUserChange,
    handleStoreChange,
    handleRoleChange,
    syncWorkplaceWithRole,
    isLoggedInAdmin,
    loggedInUser,
  } = useAuthStore();

  const { getModulesForRole } = useModulesStore();

  const {
    isInWork,
    kasaConfirmed,
    workplaceName,
    toggleAttendance,
    confirmKasa,
    setWorkplace,
    checkInUser,
    checkOutUser,
  } = useAttendanceStore();

  const { goToSettings } = useAdminStore();
  const usersLoaded = useUsersStore((state) => state._loaded);

  const allUsers = getAllActiveUsers();
  const isFullyHydrated = _hydrated && usersLoaded;
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
    syncWorkplaceWithRole(setWorkplace);
  }, [_hydrated, activeRoleId, activeStoreId, syncWorkplaceWithRole, setWorkplace]);

  // Wrapped toggle that also tracks global check-in state
  const handleToggleAttendance = async () => {
    const result = await toggleAttendance();
    if (result.success && currentUser) {
      if (isInWork) {
        // Was in work, now checking out
        checkOutUser(currentUser.id);
      } else {
        // Was not in work, now checking in
        checkInUser(currentUser.id);
      }
    }
    return result;
  };

  // Navigate to home/main view when logo is clicked
  const handleLogoClick = () => {
    closeAllViews();
  };

  return (
    <header className="h-20 bg-white/95 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 z-50">
      <div className="flex items-center space-x-4">
        <button
          onClick={handleLogoClick}
          className="text-2xl font-bold tracking-tight flex items-baseline hover:opacity-80 transition-opacity"
          aria-label="Přejít na hlavní stránku"
        >
          <span className="text-slate-800">Vape</span>
          <span className="text-[#8BC34A]">style</span>
          <span className="text-[#8BC34A] text-base font-semibold">.cz</span>
        </button>
        <div className="h-8 w-px bg-slate-200" />

        {/* User Selector Dropdown (admin only) or static name */}
        {isFullyHydrated ? (
          isLoggedInAdmin() ? (
            <div className="relative group">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" aria-hidden="true" />
              <label htmlFor="user-selector" className="sr-only">Vybrat uživatele</label>
              <select
                id="user-selector"
                value={currentUser?.id || ''}
                onChange={(e) => handleUserChange(e.target.value, setWorkplace)}
                className="appearance-none bg-slate-100 pl-9 pr-10 py-2.5 rounded-xl text-base font-semibold text-slate-800 outline-none cursor-pointer hover:bg-slate-200 transition-colors"
              >
                {allUsers.map((user) => (
                  <option key={user.id} value={user.id}>
                    {user.fullName}
                  </option>
                ))}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
          ) : (
            <div className="flex items-center bg-slate-100 pl-3 pr-4 py-2.5 rounded-xl">
              <User className="w-4 h-4 text-slate-500 mr-2" aria-hidden="true" />
              <span className="text-base font-semibold text-slate-800">
                {loggedInUser?.fullName || currentUser?.fullName || ''}
              </span>
            </div>
          )
        ) : (
          <div className="bg-slate-100 px-4 py-2.5 rounded-xl text-base font-semibold text-slate-400" aria-live="polite">
            Načítání...
          </div>
        )}

        {/* Role Selector (only for users with multiple roles) */}
        {_hydrated && showRoleSelector && (
          <>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <div className="relative group">
              <label htmlFor="role-selector" className="sr-only">Vybrat roli</label>
              <select
                id="role-selector"
                value={activeRoleId || ''}
                onChange={(e) => handleRoleChange(e.target.value, setWorkplace)}
                disabled={isInWork}
                aria-disabled={isInWork}
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
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
          </>
        )}

        {/* Store Selector (only for Prodavač with multiple stores) */}
        {_hydrated && showStoreSelector && (
          <>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <div className="relative group">
              <label htmlFor="store-selector" className="sr-only">Vybrat prodejnu</label>
              <select
                id="store-selector"
                value={activeStoreId || ''}
                onChange={(e) => handleStoreChange(e.target.value, setWorkplace)}
                disabled={isInWork}
                aria-disabled={isInWork}
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
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" aria-hidden="true" />
            </div>
          </>
        )}

        {/* Settings Icon (only for Administrator) */}
        {_hydrated && isAdmin && (
          <>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <button
              onClick={goToSettings}
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              aria-label="Nastavení"
            >
              <Settings className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}

        {/* Help Icon (available for all roles) */}
        {_hydrated && (
          <>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <button
              onClick={useManualStore.getState().openManualView}
              className="p-2.5 rounded-lg text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-all"
              aria-label="Nápověda"
            >
              <HelpCircle className="w-5 h-5" aria-hidden="true" />
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
          onToggleAttendance={handleToggleAttendance}
          onKasaConfirm={confirmKasa}
        />
      )}

      <div className="flex items-center space-x-4">
        <LiveClock />
        {/* Logout Button */}
        {_hydrated && (
          <>
            <div className="h-6 w-px bg-slate-200" aria-hidden="true" />
            <button
              type="button"
              onClick={async () => {
                cleanupSubscriptions();
                await signOut();
                useAuthStore.getState().resetAuth();
              }}
              className="p-2.5 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-all"
              aria-label="Odhlasit se"
            >
              <LogOut className="w-5 h-5" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </header>
  );
}
