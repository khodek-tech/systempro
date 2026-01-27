'use client';

import { Button } from '@/components/ui/button';
import { AttendanceRecord } from '@/types';

interface AbsenceRequestsProps {
  data: AttendanceRecord[];
}

export function AbsenceRequests({ data }: AbsenceRequestsProps) {
  const absenceData = data.filter((d) => d.absNote !== '');

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h4 className="text-base font-bold text-orange-600 mb-5">
        Žádosti o volno / lékař
      </h4>
      <div className="space-y-4">
        {absenceData.map((row, index) => (
          <div
            key={index}
            className="p-5 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center"
          >
            <div>
              <p className="text-sm font-medium text-orange-700 mb-1">
                {row.user} ({row.store})
              </p>
              <p className="text-base font-semibold text-slate-800">
                {row.abs}: {row.date}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="bg-white text-orange-600 text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-orange-600 hover:text-white transition-all"
            >
              Schválit
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
