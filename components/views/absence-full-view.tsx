'use client';

import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AbsenceRequestForm } from '@/components/shared/absence-request-form';
import { AbsenceRequestsList } from '@/components/shared/absence-requests-list';
import { useAbsenceStore } from '@/stores/absence-store';
import { months, years } from '@/lib/mock-data';
import { AbsenceRequestStatus } from '@/types';

export function AbsenceFullView() {
  const {
    myRequestsMonthFilter,
    myRequestsYearFilter,
    myRequestsStatusFilter,
    closeAbsenceView,
    setMyRequestsMonthFilter,
    setMyRequestsYearFilter,
    setMyRequestsStatusFilter,
  } = useAbsenceStore();

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header with back button and filters */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closeAbsenceView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <h1 className="text-xl font-bold text-slate-800">Absence</h1>

          <div className="flex items-center space-x-3">
            <select
              value={myRequestsMonthFilter}
              onChange={(e) => setMyRequestsMonthFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={myRequestsYearFilter}
              onChange={(e) => setMyRequestsYearFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <select
              value={myRequestsStatusFilter}
              onChange={(e) => setMyRequestsStatusFilter(e.target.value as AbsenceRequestStatus | 'all')}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              <option value="all">Všechny stavy</option>
              <option value="pending">Čeká na schválení</option>
              <option value="approved">Schváleno</option>
              <option value="rejected">Zamítnuto</option>
            </select>
          </div>
        </div>

        {/* Two-column layout: form on left, list on right */}
        <div className="grid grid-cols-2 gap-6">
          <AbsenceRequestForm />
          <AbsenceRequestsList />
        </div>
      </div>
    </main>
  );
}
