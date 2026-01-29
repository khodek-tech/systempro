'use client';

import { ShoppingCart } from 'lucide-react';
import { AbsenceCard } from '@/components/shared/absence-card';

export function ObsluhaEshopView() {
  return (
    <main className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto bg-slate-50">
      <div className="w-full max-w-5xl mt-6 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10">
        {/* Absence */}
        <AbsenceCard />

        {/* Placeholder pro budoucí funkce */}
        <div className="flex flex-col items-center justify-center space-y-4 text-slate-400 bg-white border border-slate-100 rounded-[40px] p-10 w-full aspect-square md:aspect-auto md:min-h-[380px]">
          <ShoppingCart className="w-16 h-16" strokeWidth={1.2} />
          <span className="text-base">Další funkce ve vývoji</span>
        </div>
      </div>
    </main>
  );
}
