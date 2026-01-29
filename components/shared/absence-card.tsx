'use client';

import { Umbrella } from 'lucide-react';
import { AbsenceModal } from '@/components/modals/absence-modal';
import { useUIStore } from '@/stores/ui-store';

export function AbsenceCard() {
  const { absenceModalOpen, setAbsenceModalOpen } = useUIStore();

  return (
    <>
      <button
        onClick={() => setAbsenceModalOpen(true)}
        className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        <div className="relative bg-rose-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
          <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-rose-50" />
          <div className="relative text-rose-500 transition-transform duration-500 group-hover:scale-110">
            <Umbrella className="w-[72px] h-[72px]" strokeWidth={1.2} />
          </div>
        </div>
        <div className="flex flex-col items-center space-y-3 z-10">
          <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-rose-600">
            Absence
          </span>
          <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-rose-500 transition-all duration-500 opacity-50" />
        </div>
      </button>
      <AbsenceModal open={absenceModalOpen} onOpenChange={setAbsenceModalOpen} />
    </>
  );
}
