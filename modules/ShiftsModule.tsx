'use client';

import { Calendar } from 'lucide-react';
import { useShiftsStore } from '@/stores/shifts-store';

export function ShiftsModule() {
  const { openShiftsView } = useShiftsStore();

  return (
    <button
      onClick={openShiftsView}
      className="group relative bg-white border border-slate-100/60 rounded-[24px] sm:rounded-[32px] lg:rounded-[var(--module-card-radius)] p-6 sm:p-8 lg:p-[var(--module-card-pad)] flex flex-col items-center justify-center space-y-4 sm:space-y-6 lg:space-y-[var(--module-inner-gap)] transition-all duration-300 hover:shadow-elevation-card-hover hover:-translate-y-1 active:scale-[0.98] w-full aspect-square md:aspect-auto md:min-h-[280px] lg:min-h-0 lg:h-[var(--module-card-h)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-blue-50 w-20 h-20 sm:w-28 sm:h-28 lg:w-[var(--module-icon-size)] lg:h-[var(--module-icon-size)] rounded-2xl sm:rounded-3xl lg:rounded-[var(--module-icon-radius)] flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 z-10">
        <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-blue-50" />
        <div className="relative text-blue-500 transition-transform duration-500 group-hover:scale-105">
          <Calendar className="w-10 h-10 sm:w-14 sm:h-14 lg:w-[var(--module-icon-inner)] lg:h-[var(--module-icon-inner)]" strokeWidth={1.2} />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-3 z-10">
        <span className="text-xl sm:text-2xl lg:text-[length:var(--module-title-size)] font-extrabold tracking-tight transition-colors duration-300 text-blue-600">
          Směny
        </span>
        <div className="w-8 h-0.5 bg-slate-200 rounded-full group-hover:w-16 group-hover:bg-blue-500 transition-all duration-500 opacity-50" />
      </div>
    </button>
  );
}
