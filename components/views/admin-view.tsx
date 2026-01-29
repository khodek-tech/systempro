'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCards } from '@/components/admin-dashboard/kpi-cards';
import { AttendanceTable } from '@/components/admin-dashboard/attendance-table';
import { SalesTable } from '@/components/admin-dashboard/sales-table';
import { LastPickups } from '@/components/admin-dashboard/last-pickups';
import { AbsenceRequests } from '@/components/admin-dashboard/absence-requests';
import { AdminSettingsView } from '@/components/admin-dashboard/settings/AdminSettingsView';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { ApprovalFullView } from '@/components/views/approval-full-view';
import { adminStores, months, years } from '@/lib/mock-data';
import { useAdminStore } from '@/stores/admin-store';
import { useAbsenceStore } from '@/stores/absence-store';

export function AdminView() {
  const {
    subView,
    storeFilter,
    monthFilter,
    yearFilter,
    setSubView,
    setStoreFilter,
    setMonthFilter,
    setYearFilter,
    getFilteredData,
    getKpiData,
    getVisibleStores,
  } = useAdminStore();
  const { approvalViewMode } = useAbsenceStore();

  const filteredData = getFilteredData();
  const kpiData = getKpiData();
  const visibleStores = getVisibleStores();

  // Fullscreen approval view nahrazuje celý obsah
  if (approvalViewMode === 'view') {
    return <ApprovalFullView />;
  }

  // Main dashboard view
  if (subView === 'main') {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="w-full mt-6 px-6">
          <ModuleRenderer />
        </div>
      </main>
    );
  }

  // Settings view
  if (subView === 'settings') {
    return (
      <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
        <div className="space-y-6 pb-16 animate-in fade-in duration-300">
          {/* Header */}
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => setSubView('main')}
              variant="outline"
              className="px-4 py-2 rounded-lg text-xs font-medium"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Zpět
            </Button>
            <h1 className="text-2xl font-bold text-slate-800">Nastavení</h1>
          </div>

          {/* Settings content */}
          <AdminSettingsView />
        </div>
      </main>
    );
  }

  // Reports view
  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Filter bar */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={() => setSubView('main')}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>
          <div className="flex items-center space-x-3">
            <select
              value={storeFilter}
              onChange={(e) => setStoreFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {adminStores.map((store) => (
                <option key={store.value} value={store.value}>
                  {store.label}
                </option>
              ))}
            </select>
            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <Button className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium ml-2 shadow-sm hover:bg-green-700">
              Export .XLS
            </Button>
          </div>
        </div>

        {/* KPI Cards */}
        <KpiCards
          totalSales={kpiData.totalSales}
          totalCash={kpiData.totalCash}
          pendingAbsence={kpiData.pendingAbsence}
        />

        {/* Tables */}
        <AttendanceTable data={filteredData} />
        <SalesTable data={filteredData} />

        {/* Bottom panels */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LastPickups stores={visibleStores} />
          <AbsenceRequests data={filteredData} />
        </div>
      </div>
    </main>
  );
}
