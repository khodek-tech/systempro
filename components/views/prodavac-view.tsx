'use client';

import { Package } from 'lucide-react';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { AbsenceFullView } from '@/components/views/absence-full-view';
import { useAbsenceStore } from '@/stores/absence-store';

interface ProdavacViewProps {
  isWarehouse: boolean;
}

export function ProdavacView({ isWarehouse }: ProdavacViewProps) {
  const { absenceViewMode } = useAbsenceStore();

  // Fullscreen absence view nahrazuje celý obsah
  if (absenceViewMode === 'view') {
    return <AbsenceFullView />;
  }

  if (isWarehouse) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto">
        <div className="flex items-center space-x-3 text-slate-400">
          <Package className="w-8 h-8" />
          <span className="text-xl font-medium">Sklad neeviduje tržby.</span>
        </div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto">
      <div className="w-full px-6">
        <ModuleRenderer />
      </div>
    </main>
  );
}
