'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useStoresStore } from '@/stores/stores-store';
import { Store, StoreOpeningHours, DayOpeningHours } from '@/types';
import { cn } from '@/lib/utils';

interface StoreFormModalProps {
  open: boolean;
  onClose: () => void;
  store: Store | null;
}

const DAY_LABELS: { key: keyof Omit<StoreOpeningHours, 'sameAllWeek' | 'default'>; label: string }[] = [
  { key: 'monday', label: 'Pondělí' },
  { key: 'tuesday', label: 'Úterý' },
  { key: 'wednesday', label: 'Středa' },
  { key: 'thursday', label: 'Čtvrtek' },
  { key: 'friday', label: 'Pátek' },
  { key: 'saturday', label: 'Sobota' },
  { key: 'sunday', label: 'Neděle' },
];

const DEFAULT_DAY_HOURS: DayOpeningHours = {
  open: '09:00',
  close: '18:00',
  closed: false,
};

export function StoreFormModal({ open, onClose, store }: StoreFormModalProps) {
  const { addStore, updateStore } = useStoresStore();
  const isEditing = !!store;

  // Initialize from props - component remounts with new key when store changes
  const [name, setName] = useState(store?.name ?? '');
  const [address, setAddress] = useState(store?.address ?? '');
  const [cashBase, setCashBase] = useState(store?.cashBase ?? 2000);

  // Opening hours state
  const [sameAllWeek, setSameAllWeek] = useState(store?.openingHours?.sameAllWeek ?? true);
  const [defaultHours, setDefaultHours] = useState<DayOpeningHours>(
    store?.openingHours?.default ?? { ...DEFAULT_DAY_HOURS }
  );
  const [dayHours, setDayHours] = useState<Record<string, DayOpeningHours>>({
    monday: store?.openingHours?.monday ?? { ...DEFAULT_DAY_HOURS },
    tuesday: store?.openingHours?.tuesday ?? { ...DEFAULT_DAY_HOURS },
    wednesday: store?.openingHours?.wednesday ?? { ...DEFAULT_DAY_HOURS },
    thursday: store?.openingHours?.thursday ?? { ...DEFAULT_DAY_HOURS },
    friday: store?.openingHours?.friday ?? { ...DEFAULT_DAY_HOURS },
    saturday: store?.openingHours?.saturday ?? { open: '09:00', close: '14:00', closed: false },
    sunday: store?.openingHours?.sunday ?? { open: '00:00', close: '00:00', closed: true },
  });

  const handleDayHoursChange = (
    day: string,
    field: keyof DayOpeningHours,
    value: string | boolean
  ) => {
    setDayHours((prev) => ({
      ...prev,
      [day]: {
        ...prev[day],
        [field]: value,
      },
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return;

    const openingHours: StoreOpeningHours = sameAllWeek
      ? {
          sameAllWeek: true,
          default: defaultHours,
        }
      : {
          sameAllWeek: false,
          monday: dayHours.monday,
          tuesday: dayHours.tuesday,
          wednesday: dayHours.wednesday,
          thursday: dayHours.thursday,
          friday: dayHours.friday,
          saturday: dayHours.saturday,
          sunday: dayHours.sunday,
        };

    if (isEditing && store) {
      updateStore(store.id, { name: name.trim(), address: address.trim(), cashBase, openingHours });
    } else {
      addStore({ name: name.trim(), address: address.trim(), active: true, cashBase, openingHours });
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
            {isEditing ? 'Upravit prodejnu' : 'Nová prodejna'}
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
            <label className="block text-sm font-medium text-slate-500 mb-2">Název prodejny</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="např. Praha 1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">Adresa</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="např. Václavské náměstí 1, Praha 1"
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-500 mb-2">
              Provozní základna kasy (Kč)
            </label>
            <input
              type="number"
              value={cashBase}
              onChange={(e) => setCashBase(Number(e.target.value) || 0)}
              min={0}
              step={100}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none focus:border-orange-300"
            />
            <p className="text-xs text-slate-400 mt-1">
              Výchozí hodnota pokladny zobrazená prodavačům v modulu Stav pokladny
            </p>
          </div>

          {/* Opening Hours Section */}
          <div className="pt-4 border-t border-slate-200">
            <label className="block text-sm font-medium text-slate-500 mb-3">Otvírací doba</label>

            {/* Same all week toggle */}
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm text-slate-600">Stejná celý týden</span>
              <button
                type="button"
                onClick={() => setSameAllWeek(!sameAllWeek)}
                className={cn(
                  'relative inline-flex h-6 w-11 items-center rounded-full transition-colors',
                  sameAllWeek ? 'bg-green-500' : 'bg-slate-300'
                )}
              >
                <span
                  className={cn(
                    'inline-block h-4 w-4 transform rounded-full bg-white transition-transform',
                    sameAllWeek ? 'translate-x-6' : 'translate-x-1'
                  )}
                />
              </button>
            </div>

            {sameAllWeek ? (
              /* Same for all days */
              <div className="flex items-center space-x-3 bg-slate-50 rounded-xl p-4">
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Od</label>
                  <input
                    type="time"
                    value={defaultHours.open}
                    onChange={(e) => setDefaultHours({ ...defaultHours, open: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-300"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-xs font-medium text-slate-500 mb-1">Do</label>
                  <input
                    type="time"
                    value={defaultHours.close}
                    onChange={(e) => setDefaultHours({ ...defaultHours, close: e.target.value })}
                    className="w-full bg-white border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium outline-none focus:border-blue-300"
                  />
                </div>
              </div>
            ) : (
              /* Different for each day */
              <div className="space-y-2">
                {DAY_LABELS.map(({ key, label }) => (
                  <div
                    key={key}
                    className={cn(
                      'flex items-center space-x-3 rounded-xl p-3',
                      dayHours[key]?.closed ? 'bg-slate-100' : 'bg-slate-50'
                    )}
                  >
                    <span className="w-20 text-sm font-medium text-slate-700">{label}</span>
                    <div className="flex-1 flex items-center space-x-2">
                      <input
                        type="time"
                        value={dayHours[key]?.open ?? '09:00'}
                        onChange={(e) => handleDayHoursChange(key, 'open', e.target.value)}
                        disabled={dayHours[key]?.closed}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none focus:border-blue-300 disabled:opacity-50 disabled:bg-slate-100"
                      />
                      <span className="text-slate-400">-</span>
                      <input
                        type="time"
                        value={dayHours[key]?.close ?? '18:00'}
                        onChange={(e) => handleDayHoursChange(key, 'close', e.target.value)}
                        disabled={dayHours[key]?.closed}
                        className="flex-1 bg-white border border-slate-200 rounded-lg px-2 py-1.5 text-sm font-medium outline-none focus:border-blue-300 disabled:opacity-50 disabled:bg-slate-100"
                      />
                    </div>
                    <label className="flex items-center space-x-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={dayHours[key]?.closed ?? false}
                        onChange={(e) => handleDayHoursChange(key, 'closed', e.target.checked)}
                        className="w-4 h-4 rounded border-slate-300 text-red-500 focus:ring-red-500"
                      />
                      <span className="text-xs font-medium text-slate-500">Zavřeno</span>
                    </label>
                  </div>
                ))}
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
