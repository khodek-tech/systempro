'use client';

import { useState } from 'react';
import { X, Check, Star, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUsersStore } from '@/stores/users-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { User, StoreOpeningHours, DayOpeningHours } from '@/types';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

const DEFAULT_HOURS: DayOpeningHours = { open: '08:00', close: '16:30', closed: false };

function createDefaultWorkingHours(): StoreOpeningHours {
  return {
    sameAllWeek: true,
    default: { ...DEFAULT_HOURS },
  };
}

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

export function EmployeeFormModal({ open, onClose, user }: EmployeeFormModalProps) {
  const { addUser, updateUser } = useUsersStore();
  const { roles } = useRolesStore();
  const { stores } = useStoresStore();

  const isEditing = !!user;

  // Initialize from props - component remounts with new key when user changes
  const [username, setUsername] = useState(user?.username ?? '');
  const [fullName, setFullName] = useState(user?.fullName ?? '');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roleIds ?? []);
  const [selectedStores, setSelectedStores] = useState<string[]>(user?.storeIds ?? []);
  const [defaultRoleId, setDefaultRoleId] = useState<string | undefined>(user?.defaultRoleId);
  const [defaultStoreId, setDefaultStoreId] = useState<string | undefined>(user?.defaultStoreId);
  const [startsWithShortWeek, setStartsWithShortWeek] = useState<boolean>(user?.startsWithShortWeek ?? false);
  const [workingHours, setWorkingHours] = useState<StoreOpeningHours | undefined>(user?.workingHours);
  const [error, setError] = useState<string | null>(null);

  const handleToggleWorkingHours = () => {
    if (workingHours) {
      setWorkingHours(undefined);
    } else {
      setWorkingHours(createDefaultWorkingHours());
    }
  };

  const handleSameAllWeekToggle = () => {
    if (!workingHours) return;

    if (workingHours.sameAllWeek) {
      // Switch to per-day mode
      const defaultHrs = workingHours.default || DEFAULT_HOURS;
      setWorkingHours({
        sameAllWeek: false,
        monday: { ...defaultHrs },
        tuesday: { ...defaultHrs },
        wednesday: { ...defaultHrs },
        thursday: { ...defaultHrs },
        friday: { ...defaultHrs },
        saturday: { ...defaultHrs, closed: true },
        sunday: { ...defaultHrs, closed: true },
      });
    } else {
      // Switch to same all week mode
      setWorkingHours({
        sameAllWeek: true,
        default: workingHours.monday || DEFAULT_HOURS,
      });
    }
  };

  const handleDayHoursChange = (
    dayKey: typeof DAY_KEYS[number] | 'default',
    field: 'open' | 'close' | 'closed',
    value: string | boolean
  ) => {
    if (!workingHours) return;

    setWorkingHours((prev) => {
      if (!prev) return prev;
      const current = prev[dayKey] || { ...DEFAULT_HOURS };
      return {
        ...prev,
        [dayKey]: {
          ...current,
          [field]: value,
        },
      };
    });
  };

  const toggleRole = (roleId: string) => {
    setSelectedRoles((prev) => {
      const newRoles = prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId];

      // If removing the default role, reset to first available or undefined
      if (!newRoles.includes(defaultRoleId ?? '')) {
        setDefaultRoleId(newRoles[0]);
      }

      return newRoles;
    });
  };

  const toggleStore = (storeId: string) => {
    setSelectedStores((prev) => {
      const newStores = prev.includes(storeId)
        ? prev.filter((id) => id !== storeId)
        : [...prev, storeId];

      // If removing the default store, reset to first available or undefined
      if (!newStores.includes(defaultStoreId ?? '')) {
        setDefaultStoreId(newStores[0]);
      }

      return newStores;
    });
  };

  const handleSetDefaultRole = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultRoleId(roleId);
  };

  const handleSetDefaultStore = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultStoreId(storeId);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const userData = {
      username: username.trim(),
      fullName: fullName.trim(),
      roleIds: selectedRoles,
      storeIds: selectedStores,
      defaultRoleId: selectedRoles.length > 1 ? defaultRoleId : undefined,
      defaultStoreId: selectedStores.length > 1 ? defaultStoreId : undefined,
      active: user?.active ?? true,
      startsWithShortWeek: selectedStores.length > 0 ? startsWithShortWeek : undefined,
      workingHours: workingHours,
    };

    if (isEditing && user) {
      const result = updateUser(user.id, userData);
      if (!result.success) {
        setError(result.error || 'Nepodařilo se aktualizovat zaměstnance');
        return;
      }
    } else {
      const result = addUser(userData);
      if (!result.success) {
        setError(result.error || 'Nepodařilo se přidat zaměstnance');
        return;
      }
    }

    onClose();
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing ? 'Upravit zaměstnance' : 'Nový zaměstnanec'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Uživatelské jméno
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="např. novak"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Celé jméno</label>
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="např. Jan Novák"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          {/* Roles */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Role</label>
            <div className="flex flex-wrap gap-2">
              {roles
                .filter((r) => r.active)
                .map((role) => {
                  const isSelected = selectedRoles.includes(role.id);
                  const isDefault = defaultRoleId === role.id;
                  const showStar = isSelected && selectedRoles.length > 1;

                  return (
                    <div
                      key={role.id}
                      className={cn(
                        'flex items-center rounded-lg border transition-all',
                        isSelected
                          ? 'bg-blue-50 border-blue-300 text-blue-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleRole(role.id)}
                        className="flex items-center space-x-2 px-3 py-2"
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span className="text-sm font-medium">{role.name}</span>
                      </button>
                      {showStar && (
                        <button
                          type="button"
                          onClick={(e) => handleSetDefaultRole(role.id, e)}
                          className={cn(
                            'pr-3 transition-colors',
                            isDefault ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                          )}
                          title={isDefault ? 'Výchozí role' : 'Nastavit jako výchozí'}
                        >
                          <Star className={cn('w-4 h-4', isDefault && 'fill-amber-500')} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Stores */}
          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Prodejny</label>
            <div className="flex flex-wrap gap-2">
              {stores
                .filter((s) => s.active)
                .map((store) => {
                  const isSelected = selectedStores.includes(store.id);
                  const isDefault = defaultStoreId === store.id;
                  const showStar = isSelected && selectedStores.length > 1;

                  return (
                    <div
                      key={store.id}
                      className={cn(
                        'flex items-center rounded-lg border transition-all',
                        isSelected
                          ? 'bg-green-50 border-green-300 text-green-700'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:border-slate-300'
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => toggleStore(store.id)}
                        className="flex items-center space-x-2 px-3 py-2"
                      >
                        {isSelected && <Check className="w-4 h-4" />}
                        <span className="text-sm font-medium">{store.name}</span>
                      </button>
                      {showStar && (
                        <button
                          type="button"
                          onClick={(e) => handleSetDefaultStore(store.id, e)}
                          className={cn(
                            'pr-3 transition-colors',
                            isDefault ? 'text-amber-500' : 'text-slate-300 hover:text-amber-400'
                          )}
                          title={isDefault ? 'Výchozí prodejna' : 'Nastavit jako výchozí'}
                        >
                          <Star className={cn('w-4 h-4', isDefault && 'fill-amber-500')} />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Shift Settings - only show if stores are selected */}
          {selectedStores.length > 0 && (
            <div className="pt-4 border-t border-slate-200">
              <label className="block text-sm font-medium text-slate-500 mb-3">Nastavení směn</label>
              <div className="bg-slate-50 rounded-xl p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Začíná krátkým týdnem</span>
                    <p className="text-xs text-slate-500 mt-1">
                      Krátký = St, Čt | Dlouhý = Po, Út, Pá, So, Ne
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setStartsWithShortWeek(!startsWithShortWeek)}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      startsWithShortWeek ? 'bg-orange-500' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        startsWithShortWeek ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Working Hours */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-medium text-slate-500">Pracovní doba</label>
              <button
                type="button"
                onClick={handleToggleWorkingHours}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  workingHours ? 'bg-blue-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    workingHours ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {selectedStores.length > 0 && (
              <div className="flex items-start gap-2 mb-3 p-3 bg-blue-50 rounded-lg">
                <Info className="w-4 h-4 text-blue-500 mt-0.5 flex-shrink-0" />
                <p className="text-xs text-blue-700">
                  Pokud je zaměstnanec přiřazen k prodejně, platí otvírací doba prodejny.
                </p>
              </div>
            )}

            {workingHours && (
              <div className="bg-slate-50 rounded-xl p-4 space-y-4">
                {/* Same all week toggle */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700">Stejná celý týden</span>
                  <button
                    type="button"
                    onClick={handleSameAllWeekToggle}
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      workingHours.sameAllWeek ? 'bg-orange-500' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        workingHours.sameAllWeek ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {/* Working hours inputs */}
                {workingHours.sameAllWeek ? (
                  <div className="flex items-center gap-3">
                    <input
                      type="time"
                      value={workingHours.default?.open || '08:00'}
                      onChange={(e) => handleDayHoursChange('default', 'open', e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
                    />
                    <span className="text-slate-400">–</span>
                    <input
                      type="time"
                      value={workingHours.default?.close || '16:30'}
                      onChange={(e) => handleDayHoursChange('default', 'close', e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
                    />
                  </div>
                ) : (
                  <div className="space-y-2">
                    {DAY_KEYS.map((dayKey, index) => {
                      const dayHours = workingHours[dayKey] as DayOpeningHours | undefined;
                      const isClosed = dayHours?.closed ?? false;

                      return (
                        <div key={dayKey} className="flex items-center gap-3">
                          <span className="w-20 text-sm font-medium text-slate-600">
                            {DAY_NAMES[index]}
                          </span>
                          <label className="flex items-center gap-1 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={isClosed}
                              onChange={(e) => handleDayHoursChange(dayKey, 'closed', e.target.checked)}
                              className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                            />
                            <span className="text-xs text-slate-500">Volno</span>
                          </label>
                          {!isClosed && (
                            <>
                              <input
                                type="time"
                                value={dayHours?.open || '08:00'}
                                onChange={(e) => handleDayHoursChange(dayKey, 'open', e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none focus:border-orange-300"
                              />
                              <span className="text-slate-400">–</span>
                              <input
                                type="time"
                                value={dayHours?.close || '16:30'}
                                onChange={(e) => handleDayHoursChange(dayKey, 'close', e.target.value)}
                                className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none focus:border-orange-300"
                              />
                            </>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
