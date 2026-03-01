'use client';

import { useEffect, useState } from 'react';
import { ArrowLeft, HardDrive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { KpiCards } from '@/components/admin-dashboard/kpi-cards';
import { AttendanceTable } from '@/components/admin-dashboard/attendance-table';
import { SalesTable } from '@/components/admin-dashboard/sales-table';
import { AttendanceEditModal } from '@/components/admin-dashboard/AttendanceEditModal';
import { AbsenceRequests } from '@/components/admin-dashboard/absence-requests';
import { AdminSettingsView } from '@/components/admin-dashboard/settings/AdminSettingsView';
import { ModuleRenderer } from '@/components/ModuleRenderer';
import { AbsenceFullView } from '@/components/views/absence-full-view';
import { ApprovalFullView } from '@/components/views/approval-full-view';
import { TasksFullView } from '@/components/views/tasks-full-view';
import { ChatFullView } from '@/components/views/chat-full-view';
import { EmailFullView } from '@/components/views/email-full-view';
import { PresenceFullView } from '@/components/views/presence-full-view';
import { ManualFullView } from '@/components/views/manual-full-view';
import { AttendanceRecord } from '@/types';
import { exportAttendanceToXls } from '@/lib/export-attendance';
import { months, years } from '@/lib/mock-data';
import { useAdminStore } from '@/stores/admin-store';
import { useStoresStore } from '@/stores/stores-store';
import { useUsersStore } from '@/stores/users-store';
import { useAbsenceStore } from '@/stores/absence-store';
import { useTasksStore } from '@/stores/tasks-store';
import { useChatStore } from '@/stores/chat-store';
import { useEmailStore } from '@/stores/email-store';
import { useManualStore } from '@/stores/manual-store';
import { usePresenceStore } from '@/stores/presence-store';
import { usePrevodkyStore } from '@/stores/prevodky-store';
import { PickingView } from '@/components/prevodky/PickingView';
import { formatBytes } from '@/lib/supabase/storage';

export function AdminView() {
  const {
    subView,
    storeFilter,
    employeeFilter,
    dayFilter,
    monthFilter,
    yearFilter,
    storageUsageBytes,
    pohodaTrzby,
    motivaceProdukty,
    setSubView,
    setStoreFilter,
    setEmployeeFilter,
    setDayFilter,
    setMonthFilter,
    setYearFilter,
    getFilteredData,
    getKpiData,
    fetchStorageUsage,
    fetchPohodaTrzby,
    fetchMotivaceProdukty,
  } = useAdminStore();
  const { stores } = useStoresStore();
  const { users } = useUsersStore();
  const { approvalViewMode, absenceViewMode } = useAbsenceStore();
  const { tasksViewMode } = useTasksStore();
  const { chatViewMode } = useChatStore();
  const { emailViewMode } = useEmailStore();
  const { manualViewMode } = useManualStore();
  const { presenceViewMode } = usePresenceStore();
  const { pickingPrevodkaId } = usePrevodkyStore();

  const [editRecord, setEditRecord] = useState<AttendanceRecord | null>(null);

  const filteredData = getFilteredData();
  const kpiData = getKpiData();

  useEffect(() => {
    if (subView === 'settings') {
      fetchStorageUsage();
    }
    if (subView === 'reports') {
      fetchPohodaTrzby();
      fetchMotivaceProdukty();
    }
  }, [subView, fetchStorageUsage, fetchPohodaTrzby, fetchMotivaceProdukty]);

  // Fullscreen picking view has highest priority
  if (pickingPrevodkaId) {
    return <PickingView />;
  }

  // Fullscreen manual view has highest priority
  if (manualViewMode === 'view') {
    return <ManualFullView />;
  }

  // Fullscreen email view nahrazuje celý obsah
  if (emailViewMode === 'view') {
    return <EmailFullView />;
  }

  // Fullscreen chat view nahrazuje celý obsah
  if (chatViewMode === 'view') {
    return <ChatFullView />;
  }

  // Fullscreen tasks view nahrazuje celý obsah
  if (tasksViewMode === 'view') {
    return <TasksFullView />;
  }

  // Fullscreen approval view nahrazuje celý obsah
  if (approvalViewMode === 'view') {
    return <ApprovalFullView />;
  }

  // Fullscreen absence view (žádost o absenci)
  if (absenceViewMode === 'view') {
    return <AbsenceFullView />;
  }

  // Fullscreen presence view
  if (presenceViewMode === 'view') {
    return <PresenceFullView />;
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
            <span className="text-sm font-medium text-slate-400 flex items-center gap-1.5">
              <HardDrive className="w-4 h-4" />
              {formatBytes(storageUsageBytes)}
            </span>
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
              <option value="all">VŠECHNY PRODEJNY</option>
              {stores.filter((s) => s.active).map((store) => (
                <option key={store.id} value={store.name.toLowerCase()}>
                  {store.name.toUpperCase()}
                </option>
              ))}
            </select>
            <select
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              <option value="all">VŠICHNI ZAMĚSTNANCI</option>
              {users
                .filter((u) => u.active)
                .sort((a, b) => a.fullName.localeCompare(b.fullName, 'cs'))
                .map((user) => (
                  <option key={user.id} value={user.fullName}>
                    {user.fullName}
                  </option>
                ))}
            </select>
            <select
              value={dayFilter}
              onChange={(e) => setDayFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              <option value="all">Den: Vše</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                <option key={day} value={String(day)}>
                  {day}.
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
            <Button
              className="bg-green-600 text-white px-4 py-2 rounded-lg text-xs font-medium ml-2 shadow-sm hover:bg-green-700"
              onClick={() => exportAttendanceToXls(filteredData)}
            >
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
        <AttendanceTable data={filteredData} onRowClick={setEditRecord} />
        <SalesTable data={filteredData} pohodaTrzby={pohodaTrzby} motivaceProdukty={motivaceProdukty} onRowClick={setEditRecord} />

        {/* Edit modal */}
        {editRecord && (
          <AttendanceEditModal record={editRecord} onClose={() => setEditRecord(null)} />
        )}

        {/* Bottom panels */}
        <div className="grid grid-cols-1 gap-6">
          <AbsenceRequests />
        </div>
      </div>
    </main>
  );
}
