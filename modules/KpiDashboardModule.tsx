'use client';

import { useEffect } from 'react';
import { TrendingUp, Wallet, Users } from 'lucide-react';
import { useAdminStore } from '@/stores/admin-store';
import { useUsersStore } from '@/stores/users-store';

export function KpiDashboardModule() {
  const { _loaded, _loading, fetchAttendanceRecords, getKpiData } = useAdminStore();
  const users = useUsersStore((s) => s.users);

  useEffect(() => {
    if (!_loaded && !_loading) {
      fetchAttendanceRecords();
    }
  }, [_loaded, _loading, fetchAttendanceRecords]);

  const kpiData = getKpiData();
  const activeEmployees = users.filter((u) => u.active).length;

  if (_loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[0, 1, 2].map((i) => (
          <div key={i} className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-4 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="h-4 w-24 bg-slate-200 rounded" />
              <div className="h-9 w-9 bg-slate-100 rounded-lg" />
            </div>
            <div className="space-y-2">
              <div className="h-8 w-40 bg-slate-200 rounded" />
              <div className="h-4 w-28 bg-slate-100 rounded" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
      {/* Total Sales */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-4">
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
          <p className="text-sm text-slate-500 font-medium">ze všech prodejen</p>
        </div>
      </div>

      {/* Cash to Collect */}
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-4">
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
      <div className="bg-white border border-slate-200/60 rounded-xl p-6 space-y-4">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-slate-500">Aktivní zaměstnanci</span>
          <div className="bg-purple-50 p-2 rounded-lg">
            <Users className="w-5 h-5 text-purple-600" />
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-slate-900 font-mono">{activeEmployees}</p>
          <p className="text-sm text-slate-500 font-medium">celkem v systému</p>
        </div>
      </div>
    </div>
  );
}
