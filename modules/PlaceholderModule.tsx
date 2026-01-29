'use client';

import { Package } from 'lucide-react';

interface PlaceholderModuleProps {
  title?: string;
}

export function PlaceholderModule({ title = 'Další funkce ve vývoji' }: PlaceholderModuleProps) {
  return (
    <div className="flex flex-col items-center justify-center space-y-4 text-slate-400 bg-white border border-slate-100 rounded-[40px] p-10 w-full aspect-square md:aspect-auto md:min-h-[380px]">
      <Package className="w-16 h-16" strokeWidth={1.2} />
      <span className="text-base">{title}</span>
    </div>
  );
}
