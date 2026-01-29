'use client';

import { ModuleRenderer } from '@/components/ModuleRenderer';
import { AbsenceFullView } from '@/components/views/absence-full-view';
import { ApprovalFullView } from '@/components/views/approval-full-view';
import { useAbsenceStore } from '@/stores/absence-store';

export function VedouciVelkoobchodView() {
  const { absenceViewMode, approvalViewMode } = useAbsenceStore();

  // Fullscreen approval view nahrazuje celý obsah
  if (approvalViewMode === 'view') {
    return <ApprovalFullView />;
  }

  // Fullscreen absence view nahrazuje celý obsah
  if (absenceViewMode === 'view') {
    return <AbsenceFullView />;
  }

  return (
    <main className="flex-1 flex flex-col items-center p-8 relative overflow-y-auto bg-slate-50">
      <div className="w-full mt-6 px-6">
        <ModuleRenderer />
      </div>
    </main>
  );
}
