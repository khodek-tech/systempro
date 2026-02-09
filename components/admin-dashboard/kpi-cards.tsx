'use client';

interface KpiCardsProps {
  totalSales: number;
  totalCash: number;
  pendingAbsence: number;
}

export function KpiCards({ totalSales, totalCash, pendingAbsence }: KpiCardsProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-blue-500" />
        <p className="text-sm font-medium text-slate-500 mb-1">
          Měsíční tržba firmy
        </p>
        <p className="text-2xl font-bold text-slate-900">
          {totalSales.toLocaleString('cs-CZ')} Kč
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-green-500" />
        <p className="text-sm font-medium text-slate-500 mb-1">
          V trezorech celkem
        </p>
        <p className="text-2xl font-bold text-slate-900">
          {totalCash.toLocaleString('cs-CZ')} Kč
        </p>
      </div>
      <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 relative overflow-hidden">
        <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-orange-500" />
        <p className="text-sm font-medium text-slate-500 mb-1">
          Čekající absence
        </p>
        <p className="text-2xl font-bold text-slate-900">
          {pendingAbsence}
        </p>
      </div>
    </div>
  );
}
