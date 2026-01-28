'use client';

import { Building2 } from 'lucide-react';

export function VedouciVelkoobchodView() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto bg-slate-50">
      <div className="flex flex-col items-center space-y-4 text-slate-400">
        <Building2 className="w-16 h-16" strokeWidth={1.2} />
        <span className="text-xl font-medium">Vedoucí velkoobchodu</span>
        <span className="text-base">Tato sekce je ve vývoji.</span>
      </div>
    </main>
  );
}
