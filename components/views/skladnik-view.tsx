'use client';

import { Package } from 'lucide-react';

export function SkladnikView() {
  return (
    <main className="flex-1 flex flex-col items-center justify-center p-8 relative overflow-y-auto bg-slate-50">
      <div className="flex flex-col items-center space-y-4 text-slate-400">
        <Package className="w-16 h-16" strokeWidth={1.2} />
        <span className="text-xl font-medium">Skladník</span>
        <span className="text-base">Tato sekce je ve vývoji.</span>
      </div>
    </main>
  );
}
