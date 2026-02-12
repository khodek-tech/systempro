'use client';

import { ArrowLeft, ChevronLeft, ChevronRight, User, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useShiftsStore, ShiftDay } from '@/stores/shifts-store';
import { useAuthStore } from '@/stores/auth-store';
import { useStoresStore } from '@/stores/stores-store';
import { cn } from '@/lib/utils';

const MONTH_NAMES = [
  'Leden',
  'Únor',
  'Březen',
  'Duben',
  'Květen',
  'Červen',
  'Červenec',
  'Srpen',
  'Září',
  'Říjen',
  'Listopad',
  'Prosinec',
];

const DAY_NAMES = ['Po', 'Út', 'St', 'Čt', 'Pá', 'So', 'Ne'];

export function ShiftsFullView() {
  const {
    closeShiftsView,
    selectedMonth,
    selectedYear,
    selectedStoreId,
    navigateMonth,
    setSelectedStore,
    getShiftsForMonth,
  } = useShiftsStore();
  const { currentUser } = useAuthStore();
  const { stores } = useStoresStore();

  // Get user's stores or all stores for admin view
  const availableStores = currentUser
    ? currentUser.storeIds.length > 0
      ? stores.filter((s) => currentUser.storeIds.includes(s.id) && s.active)
      : stores.filter((s) => s.active)
    : [];

  // Auto-select first store if none selected
  const effectiveStoreId = selectedStoreId || availableStores[0]?.id || null;

  const hasWorkingHours = currentUser && currentUser.workingHours;
  const hasAlternating = hasWorkingHours && currentUser.workingHours?.alternating;

  // Get shifts for current user and month
  const shifts = currentUser
    ? getShiftsForMonth(currentUser.id, selectedMonth, selectedYear)
    : [];

  // Calculate calendar grid
  const firstDayOfMonth = (new Date(selectedYear, selectedMonth, 1).getDay() + 6) % 7;
  const today = new Date();
  const isCurrentMonth =
    today.getMonth() === selectedMonth && today.getFullYear() === selectedYear;
  const todayDate = today.getDate();

  // Create calendar grid with empty cells for padding
  const calendarCells: (ShiftDay | null)[] = [];
  for (let i = 0; i < firstDayOfMonth; i++) {
    calendarCells.push(null);
  }
  for (const shift of shifts) {
    calendarCells.push(shift);
  }

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header with back button and filters */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closeShiftsView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <h1 className="text-xl font-bold text-slate-800">Plánování směn</h1>

          <div className="flex items-center space-x-3">
            {availableStores.length > 1 && (
              <select
                value={effectiveStoreId || ''}
                onChange={(e) => setSelectedStore(e.target.value || null)}
                className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
              >
                {availableStores.map((store) => (
                  <option key={store.id} value={store.id}>
                    {store.name}
                  </option>
                ))}
              </select>
            )}
          </div>
        </div>

        {/* Month navigation */}
        <div className="flex items-center justify-center space-x-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <button
            onClick={() => navigateMonth('prev')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-slate-600" />
          </button>
          <span className="text-lg font-bold text-slate-800 min-w-[180px] text-center">
            {MONTH_NAMES[selectedMonth]} {selectedYear}
          </span>
          <button
            onClick={() => navigateMonth('next')}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <ChevronRight className="w-5 h-5 text-slate-600" />
          </button>
        </div>

        {!hasWorkingHours ? (
          /* No working hours set */
          <div className="flex items-center justify-center gap-3 bg-white p-8 rounded-xl border border-slate-200 shadow-sm">
            <AlertCircle className="w-5 h-5 text-orange-500" />
            <span className="text-sm font-medium text-slate-600">
              Pracovní doba není nastavena
            </span>
          </div>
        ) : (
          <>
            {/* Calendar */}
            <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
              {/* Day headers */}
              <div className="grid grid-cols-7 bg-slate-50 border-b border-slate-200">
                {DAY_NAMES.map((day, i) => (
                  <div
                    key={day}
                    className={cn(
                      'px-2 py-3 text-center text-xs font-semibold uppercase tracking-wide',
                      i === 6 ? 'text-red-500' : 'text-slate-500'
                    )}
                  >
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div className="grid grid-cols-7">
                {calendarCells.map((cell, index) => {
                  if (!cell) {
                    return <div key={`empty-${index}`} className="p-2 min-h-[80px] border-b border-r border-slate-100" />;
                  }

                  const dayNum = cell.date.getDate();
                  const isToday = isCurrentMonth && dayNum === todayDate;

                  return (
                    <div
                      key={dayNum}
                      className={cn(
                        'p-2 min-h-[80px] border-b border-r border-slate-100 transition-colors',
                        cell.isWorkDay ? 'bg-green-50' : 'bg-slate-50/30',
                        isToday && 'ring-2 ring-orange-400 ring-inset'
                      )}
                    >
                      <div className="flex flex-col h-full">
                        <span
                          className={cn(
                            'text-sm font-semibold',
                            cell.isWorkDay ? 'text-green-700' : 'text-slate-400',
                            cell.dayOfWeek === 0 && 'text-red-400'
                          )}
                        >
                          {dayNum}
                        </span>
                        {cell.isWorkDay && cell.openingHours && (
                          <div className="mt-1 text-xs text-green-600 font-medium">
                            {cell.openingHours.open} - {cell.openingHours.close}
                          </div>
                        )}
                        {cell.isWorkDay && hasAlternating && (
                          <div className="mt-auto">
                            <span
                              className={cn(
                                'inline-block px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase',
                                cell.isOddWeek
                                  ? 'bg-orange-100 text-orange-700'
                                  : 'bg-blue-100 text-blue-700'
                              )}
                            >
                              {cell.isOddWeek ? 'Lichý' : 'Sudý'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Working hours source indicator */}
            <div className="flex items-center justify-center gap-2 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
              <User className="w-4 h-4 text-purple-500" />
              <span className="text-sm font-medium text-purple-700">Pracovní doba: Vlastní</span>
            </div>

            {/* Legend */}
            <div className="flex items-center justify-center space-x-6 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-green-50 border border-green-200" />
                <span className="text-sm text-slate-600">Pracovní den</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded bg-slate-50/30 border border-slate-200" />
                <span className="text-sm text-slate-600">Volno</span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 rounded ring-2 ring-orange-400 ring-inset bg-white" />
                <span className="text-sm text-slate-600">Dnes</span>
              </div>
              {hasAlternating && (
                <>
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-orange-100 text-orange-700">
                      Lichý
                    </span>
                    <span className="text-sm text-slate-600">Lichý týden</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold uppercase bg-blue-100 text-blue-700">
                      Sudý
                    </span>
                    <span className="text-sm text-slate-600">Sudý týden</span>
                  </div>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </main>
  );
}
