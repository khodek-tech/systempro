'use client';

import { Users } from 'lucide-react';
import { usePresenceStore } from '@/stores/presence-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { PresenceStatus } from '@/types';

export function PresenceModule() {
  const { activeRoleId } = useAuthStore();
  const { getTodayPresence } = usePresenceStore();

  const records = activeRoleId ? getTodayPresence(activeRoleId) : [];

  const getStatusLabel = (status: PresenceStatus): string => {
    switch (status) {
      case 'present':
        return 'V práci';
      case 'absent':
        return 'Nepřítomen';
      case 'excused':
        return 'Schválená absence';
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-slate-100 flex items-center gap-3">
        <div className="bg-blue-50 w-10 h-10 rounded-lg flex items-center justify-center">
          <Users className="w-5 h-5 text-blue-500" aria-hidden="true" />
        </div>
        <span className="text-lg font-semibold text-slate-800">Přítomnost</span>
        {records.length > 0 && (
          <span className="text-sm text-slate-500 ml-auto">
            {records.filter((r) => r.status === 'present').length}/{records.length}
          </span>
        )}
      </div>

      {/* Seznam */}
      {records.length === 0 ? (
        <div className="p-4 text-center text-sm text-slate-500">
          Žádní zaměstnanci ke zobrazení
        </div>
      ) : (
        <div className="divide-y divide-slate-100">
          {records.map((record) => (
            <div key={record.userId} className="p-3 flex items-center gap-3">
              {/* Status dot */}
              <div
                className={cn(
                  'w-3 h-3 rounded-full flex-shrink-0',
                  record.status === 'present' && 'bg-green-500',
                  record.status === 'absent' && 'bg-red-500',
                  record.status === 'excused' && 'bg-orange-500'
                )}
                role="img"
                aria-label={getStatusLabel(record.status)}
              />

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="text-sm font-medium text-slate-700 truncate">
                  {record.userName}
                </div>
                <div className="text-xs text-slate-500 truncate">
                  {record.status === 'excused' && record.absenceType
                    ? record.absenceType
                    : record.storeName || 'Bez prodejny'}
                </div>
              </div>

              {/* Screen reader only status */}
              <span className="sr-only">{getStatusLabel(record.status)}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
