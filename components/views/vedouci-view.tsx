'use client';

import { ChartColumnIncreasing, ShieldCheck, Store, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCards } from '@/components/admin/kpi-cards';
import { AttendanceTable } from '@/components/admin/attendance-table';
import { SalesTable } from '@/components/admin/sales-table';
import { LastPickups } from '@/components/admin/last-pickups';
import { AbsenceRequests } from '@/components/admin/absence-requests';
import { adminStores, months, years } from '@/lib/mock-data';
import { useVedouciStore } from '@/stores/vedouci-store';

export function VedouciView() {
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
  } = useVedouciStore();

  const filteredData = getFilteredData();
  const kpiData = getKpiData();
  const visibleStores = getVisibleStores();

  if (subView === 'main') {
    return (
      <main className="flex-1 p-8 overflow-y-auto bg-slate-50">
        <div className="w-full max-w-5xl mx-auto mt-6 px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-10">
          {/* Tržba a Docházka */}
          <button
            onClick={() => setSubView('reports')}
            className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
            <div className="relative bg-blue-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
              <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-blue-50" />
              <div className="relative text-blue-500 transition-transform duration-500 group-hover:scale-110">
                <ChartColumnIncreasing className="w-[72px] h-[72px]" strokeWidth={1.2} />
              </div>
            </div>
            <div className="flex flex-col items-center space-y-3 z-10">
              <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-slate-800">
                Tržba a Docházka
              </span>
              <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-blue-500 transition-all duration-500 opacity-50" />
            </div>
          </button>

          {/* Práva - disabled */}
          <div className="relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden opacity-40 cursor-not-allowed">
            <div className="relative bg-slate-100 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center z-10">
              <div className="relative text-slate-400">
                <ShieldCheck className="w-[72px] h-[72px]" strokeWidth={1.2} />
              </div>
            </div>
            <div className="flex flex-col items-center space-y-3 z-10">
              <span className="text-3xl font-extrabold tracking-tight text-slate-400">
                Práva
              </span>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full opacity-50" />
            </div>
          </div>

          {/* Prodejny - disabled */}
          <div className="relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden opacity-40 cursor-not-allowed">
            <div className="relative bg-slate-100 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center z-10">
              <div className="relative text-slate-400">
                <Store className="w-[72px] h-[72px]" strokeWidth={1.2} />
              </div>
            </div>
            <div className="flex flex-col items-center space-y-3 z-10">
              <span className="text-3xl font-extrabold tracking-tight text-slate-400">
                Prodejny
              </span>
              <div className="w-12 h-1.5 bg-slate-200 rounded-full opacity-50" />
            </div>
          </div>
        </div>
      </main>
    );
  }

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
            Zpet
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
