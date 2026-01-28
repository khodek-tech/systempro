'use client';

import { Landmark } from 'lucide-react';

interface LastPickupsProps {
  stores: string[];
}

export function LastPickups({ stores }: LastPickupsProps) {
  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h4 className="text-base font-bold text-purple-600 mb-5">
        Poslední odvedená tržba poboček
      </h4>
      <div className="space-y-4">
        {stores.map((store) => (
          <div
            key={store}
            className="flex justify-between items-center p-5 bg-slate-50 rounded-xl border border-slate-100"
          >
            <div>
              <p className="text-sm font-medium text-slate-500 mb-1">
                {store}
              </p>
              <p className="text-base font-semibold text-slate-800">
                Svoz: 26. 1. (Řidič Karel)
              </p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-purple-50 flex items-center justify-center">
              <Landmark className="w-6 h-6 text-purple-600" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
