'use client';

import { Info } from 'lucide-react';

interface CashMonitorProps {
  cashToCollect: number;
}

export function CashMonitor({ cashToCollect }: CashMonitorProps) {
  return (
    <div className="w-full max-w-5xl mb-8 bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden flex flex-col md:flex-row items-center justify-between px-8 py-6">
      <div className="flex items-center space-x-5 mb-4 md:mb-0">
        <div className="bg-blue-50 p-3 rounded-xl border border-blue-100">
          <Info className="w-7 h-7 text-blue-500" />
        </div>
        <div>
          <p className="text-base text-slate-500 font-medium">
            Hotovost k odevzdání (v trezoru)
          </p>
          <h3 className="text-3xl font-bold text-slate-800">
            {cashToCollect.toLocaleString('cs-CZ')}{' '}
            <span className="text-xl font-semibold text-slate-400">Kč</span>
          </h3>
        </div>
      </div>
      <div className="text-right flex flex-col items-center md:items-end">
        <p className="text-sm font-bold text-blue-600 uppercase tracking-widest mb-1">
          Provozní základna kasy
        </p>
        <div className="flex items-center space-x-2">
          <span className="text-xl font-bold text-slate-700">2 000 Kč</span>
          <span className="text-sm font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
            (souhlasí)
          </span>
        </div>
      </div>
    </div>
  );
}
