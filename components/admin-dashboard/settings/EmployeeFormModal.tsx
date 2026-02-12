'use client';

import { useEffect } from 'react';
import { X, Check, Star, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useEmployeeFormStore } from '@/stores/employee-form-store';
import { useRolesStore } from '@/stores/roles-store';
import { useStoresStore } from '@/stores/stores-store';
import { User, DayOpeningHours, StoreOpeningHours } from '@/types';
import { cn } from '@/lib/utils';

const DAY_NAMES = ['Neděle', 'Pondělí', 'Úterý', 'Středa', 'Čtvrtek', 'Pátek', 'Sobota'];
const DAY_KEYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'] as const;

interface EmployeeFormModalProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

function WeekScheduleEditor({
  week,
  schedule,
  label,
  storeIds,
}: {
  week: 'odd' | 'even';
  schedule: StoreOpeningHours;
  label?: string;
  storeIds: string[];
}) {
  const { setWeekDayHours, toggleWeekSameAllWeek, copyFromStore } = useEmployeeFormStore();
  const { stores } = useStoresStore();

  const availableStores = stores.filter((s) => storeIds.includes(s.id) && s.active && s.openingHours);

  return (
    <div className="bg-slate-50 rounded-xl p-4 space-y-4">
      {label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-semibold text-slate-700">{label}</span>
          {availableStores.length > 0 && (
            <button
              type="button"
              onClick={() => copyFromStore(week, availableStores[0].id)}
              className="flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
            >
              <Copy className="w-3 h-3" />
              Kopírovat z prodejny
            </button>
          )}
        </div>
      )}

      {/* Same all week toggle — only for non-alternating mode */}
      {!label && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-700">Stejná celý týden</span>
          <button
            type="button"
            onClick={() => toggleWeekSameAllWeek(week)}
            role="switch"
            aria-checked={schedule.sameAllWeek}
            aria-label="Stejná pracovní doba celý týden"
            className={cn(
              'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
              schedule.sameAllWeek ? 'bg-orange-500' : 'bg-slate-300'
            )}
          >
            <span
              className={cn(
                'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                schedule.sameAllWeek ? 'translate-x-6' : 'translate-x-1'
              )}
            />
          </button>
        </div>
      )}

      {/* Working hours inputs */}
      {schedule.sameAllWeek ? (
        <div className="flex items-center gap-3">
          <label htmlFor={`${week}-default-open`} className="sr-only">Začátek pracovní doby</label>
          <input
            id={`${week}-default-open`}
            type="time"
            value={schedule.default?.open || '08:00'}
            onChange={(e) => setWeekDayHours(week, 'default', 'open', e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
          />
          <span className="text-slate-400" aria-hidden="true">–</span>
          <label htmlFor={`${week}-default-close`} className="sr-only">Konec pracovní doby</label>
          <input
            id={`${week}-default-close`}
            type="time"
            value={schedule.default?.close || '16:30'}
            onChange={(e) => setWeekDayHours(week, 'default', 'close', e.target.value)}
            className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-orange-300"
          />
        </div>
      ) : (
        <div className="space-y-2">
          {DAY_KEYS.map((dayKey, index) => {
            const dayHours = schedule[dayKey] as DayOpeningHours | undefined;
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
                    onChange={(e) => setWeekDayHours(week, dayKey, 'closed', e.target.checked)}
                    className="w-4 h-4 rounded border-slate-300 text-orange-500 focus:ring-orange-500"
                  />
                  <span className="text-xs text-slate-500">Volno</span>
                </label>
                {!isClosed && (
                  <>
                    <label htmlFor={`${week}-${dayKey}-open`} className="sr-only">Začátek - {DAY_NAMES[index]}</label>
                    <input
                      id={`${week}-${dayKey}-open`}
                      type="time"
                      value={dayHours?.open || '08:00'}
                      onChange={(e) => setWeekDayHours(week, dayKey, 'open', e.target.value)}
                      className="bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none focus:border-orange-300"
                    />
                    <span className="text-slate-400" aria-hidden="true">–</span>
                    <label htmlFor={`${week}-${dayKey}-close`} className="sr-only">Konec - {DAY_NAMES[index]}</label>
                    <input
                      id={`${week}-${dayKey}-close`}
                      type="time"
                      value={dayHours?.close || '16:30'}
                      onChange={(e) => setWeekDayHours(week, dayKey, 'close', e.target.value)}
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
  );
}

export function EmployeeFormModal({ open, onClose, user }: EmployeeFormModalProps) {
  const { roles } = useRolesStore();
  const { stores } = useStoresStore();

  const {
    username,
    fullName,
    selectedRoles,
    selectedStores,
    defaultRoleId,
    defaultStoreId,
    workingHours,
    error,
    initForm,
    setUsername,
    setFullName,
    toggleRole,
    setDefaultRole,
    toggleStore,
    setDefaultStore,
    toggleWorkingHours,
    toggleAlternating,
    submitForm,
    isEditing,
  } = useEmployeeFormStore();

  // Initialize form when modal opens or user changes
  useEffect(() => {
    if (open) {
      initForm(user);
    }
  }, [open, user, initForm]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitForm(onClose);
  };

  const handleSetDefaultRole = (roleId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultRole(roleId);
  };

  const handleSetDefaultStore = (storeId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDefaultStore(storeId);
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-8 max-w-lg w-full mx-4 max-h-[90vh] overflow-y-auto animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">
            {isEditing() ? 'Upravit zaměstnance' : 'Nový zaměstnanec'}
          </h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 transition-colors"
            aria-label="Zavřít"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm" role="alert">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-slate-500 mb-2">
              Uživatelské jméno
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="např. novak"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label htmlFor="fullName" className="block text-sm font-medium text-slate-500 mb-2">
              Celé jméno
            </label>
            <input
              id="fullName"
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="např. Jan Novák"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          {/* Roles */}
          <fieldset>
            <legend className="block text-sm font-medium text-slate-500 mb-2">Role</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Výběr rolí">
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
                        aria-pressed={isSelected}
                      >
                        {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
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
                          aria-label={isDefault ? `${role.name} je výchozí role` : `Nastavit ${role.name} jako výchozí`}
                        >
                          <Star className={cn('w-4 h-4', isDefault && 'fill-amber-500')} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </fieldset>

          {/* Stores */}
          <fieldset>
            <legend className="block text-sm font-medium text-slate-500 mb-2">Prodejny</legend>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Výběr prodejen">
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
                        aria-pressed={isSelected}
                      >
                        {isSelected && <Check className="w-4 h-4" aria-hidden="true" />}
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
                          aria-label={isDefault ? `${store.name} je výchozí prodejna` : `Nastavit ${store.name} jako výchozí`}
                        >
                          <Star className={cn('w-4 h-4', isDefault && 'fill-amber-500')} aria-hidden="true" />
                        </button>
                      )}
                    </div>
                  );
                })}
            </div>
          </fieldset>

          {/* Working Hours */}
          <div className="pt-4 border-t border-slate-200">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-slate-500">Pracovní doba</span>
              <button
                type="button"
                onClick={toggleWorkingHours}
                role="switch"
                aria-checked={!!workingHours}
                aria-label="Vlastní pracovní doba"
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

            {workingHours && (
              <div className="space-y-4">
                {/* Alternating toggle */}
                <div className="flex items-center justify-between bg-slate-50 rounded-xl p-4">
                  <div>
                    <span className="text-sm font-medium text-slate-700">Střídání lichý/sudý týden</span>
                    <p className="text-xs text-slate-500 mt-1">
                      Dle čísla ISO týdne (lichý/sudý)
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={toggleAlternating}
                    role="switch"
                    aria-checked={workingHours.alternating}
                    aria-label="Střídání lichý/sudý týden"
                    className={cn(
                      'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                      workingHours.alternating ? 'bg-orange-500' : 'bg-slate-300'
                    )}
                  >
                    <span
                      className={cn(
                        'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                        workingHours.alternating ? 'translate-x-6' : 'translate-x-1'
                      )}
                    />
                  </button>
                </div>

                {workingHours.alternating ? (
                  <>
                    <WeekScheduleEditor
                      week="odd"
                      schedule={workingHours.oddWeek}
                      label="Lichý týden"
                      storeIds={selectedStores}
                    />
                    {workingHours.evenWeek && (
                      <WeekScheduleEditor
                        week="even"
                        schedule={workingHours.evenWeek}
                        label="Sudý týden"
                        storeIds={selectedStores}
                      />
                    )}
                  </>
                ) : (
                  <WeekScheduleEditor
                    week="odd"
                    schedule={workingHours.oddWeek}
                    storeIds={selectedStores}
                  />
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
              {isEditing() ? 'Uložit' : 'Přidat'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
