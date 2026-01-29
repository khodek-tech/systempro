'use client';

import { TrendingUp, Wallet, Users } from 'lucide-react';

export function KpiDashboardModule() {
  // Mock KPI data
  const kpiData = {
    totalSales: 1250000,
    totalCash: 450000,
    activeEmployees: 27,
  };

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Total Sales */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Celkové tržby</span>
          <div className="bg-emerald-50 p-2 rounded-lg">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-slate-900 font-mono">
            {kpiData.totalSales.toLocaleString('cs-CZ')} Kč
          </p>
          <p className="text-sm text-emerald-600 font-medium">+12.5% oproti minulému měsíci</p>
        </div>
      </div>

      {/* Cash to Collect */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">K odvodu</span>
          <div className="bg-blue-50 p-2 rounded-lg">
            <Wallet className="w-5 h-5 text-blue-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-slate-900 font-mono">
            {kpiData.totalCash.toLocaleString('cs-CZ')} Kč
          </p>
          <p className="text-sm text-slate-500 font-medium">ze všech prodejen</p>
        </div>
      </div>

      {/* Active Employees */}
      <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Aktivní zaměstnanci</span>
          <div className="bg-purple-50 p-2 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-slate-900 font-mono">{kpiData.activeEmployees}</p>
          <p className="text-sm text-slate-500 font-medium">celkem v systému</p>
        </div>
      </div>
    </div>
  );
}
