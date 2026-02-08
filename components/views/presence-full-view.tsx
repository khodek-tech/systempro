'use client';

import { ArrowLeft, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePresenceStore } from '@/stores/presence-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { PresenceStatus } from '@/types';

function getStatusLabel(status: PresenceStatus): string {
  switch (status) {
    case 'present':
      return 'V práci';
    case 'absent':
      return 'Nepřítomen';
    case 'excused':
      return 'Schválená absence';
  }
}

export function PresenceFullView() {
  const { activeRoleId } = useAuthStore();
  const { getTodayPresence, closePresenceView } = usePresenceStore();

  const records = activeRoleId ? getTodayPresence(activeRoleId) : [];
  const presentCount = records.filter((r) => r.status === 'present').length;

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closePresenceView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <h1 className="text-xl font-bold text-slate-800">Přítomnost</h1>

          <div className="text-sm font-medium text-slate-500">
            {presentCount}/{records.length} přítomných
          </div>
        </div>

        {/* List */}
        {records.length === 0 ? (
          <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
            <Users className="w-16 h-16 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-500 font-medium">Žádní zaměstnanci ke zobrazení</p>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
            <div className="divide-y divide-slate-100">
              {records.map((record) => (
                <div key={record.userId} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors">
                  {/* Status dot */}
                  <div
                    className={cn(
                      'w-3.5 h-3.5 rounded-full flex-shrink-0',
                      record.status === 'present' && 'bg-green-500',
                      record.status === 'absent' && 'bg-red-500',
                      record.status === 'excused' && 'bg-orange-500'
                    )}
                    role="img"
                    aria-label={getStatusLabel(record.status)}
                  />

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-semibold text-slate-800">
                      {record.userName}
                    </div>
                    <div className="text-xs text-slate-500">
                      {record.status === 'excused' && record.absenceType
                        ? record.absenceType
                        : record.storeName || 'Bez prodejny'}
                    </div>
                  </div>

                  {/* Status label */}
                  <span
                    className={cn(
                      'text-xs font-semibold px-2.5 py-1 rounded-full',
                      record.status === 'present' && 'bg-green-50 text-green-700',
                      record.status === 'absent' && 'bg-red-50 text-red-700',
                      record.status === 'excused' && 'bg-orange-50 text-orange-700'
                    )}
                  >
                    {getStatusLabel(record.status)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
