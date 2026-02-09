'use client';

import { toast } from 'sonner';
import { Circle, CircleCheck, Play, Square } from 'lucide-react';
import { Role } from '@/types';
import { cn } from '@/lib/utils';

interface AttendanceModuleProps {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplaceName: string;
  activeRole: Role | null;
  onToggleAttendance: () => Promise<{ success: boolean; error?: string }>;
  onKasaConfirm: (confirmed: boolean) => void;
}

export function AttendanceModule({
  isInWork,
  kasaConfirmed,
  workplaceName,
  activeRole,
  onToggleAttendance,
  onKasaConfirm,
}: AttendanceModuleProps) {
  const handleAttendanceClick = async () => {
    const result = await onToggleAttendance();
    if (!result.success && result.error) {
      toast.error(result.error);
    }
  };

  // Only show kasa confirmation for Prodavač
  const showKasaConfirmation = activeRole?.type === 'prodavac';

  return (
    <div className="hidden md:flex items-center space-x-6 shrink-0">
      {/* Kasa & Odvody badge - only for Prodavač */}
      {showKasaConfirmation && (
        <button
          onClick={() => onKasaConfirm(!kasaConfirmed)}
          role="switch"
          aria-checked={kasaConfirmed}
          aria-label={kasaConfirmed ? 'Kasa a odvody potvrzeny' : 'Potvrdit kasu a odvody'}
          className={cn(
            'flex items-center space-x-2.5 px-5 py-2.5 rounded-full border transition-all whitespace-nowrap',
            kasaConfirmed
              ? 'bg-green-50 border-green-100'
              : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
          )}
        >
          {kasaConfirmed ? (
            <CircleCheck className="w-5 h-5 text-green-500" aria-hidden="true" />
          ) : (
            <Circle className="w-5 h-5 text-slate-400" aria-hidden="true" />
          )}
          <span
            className={cn(
              'text-base font-medium',
              kasaConfirmed ? 'text-green-700' : 'text-slate-500'
            )}
          >
            Kasa & Odvody OK
          </span>
        </button>
      )}

      {/* Status & Workplace display */}
      <div className="flex flex-col items-end" role="status" aria-live="polite">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full animate-pulse',
              isInWork ? 'bg-green-500' : 'bg-red-500'
            )}
            aria-hidden="true"
          />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isInWork ? 'V práci' : 'Mimo práci'}
          </span>
        </div>
        <span className="text-base font-semibold text-slate-700">{workplaceName}</span>
      </div>

      {/* Attendance button */}
      <button
        onClick={handleAttendanceClick}
        aria-label={isInWork ? 'Zaznamenat odchod z práce' : 'Zaznamenat příchod do práce'}
        className={cn(
          'flex items-center space-x-2.5 px-7 py-3 rounded-xl font-bold text-base transition-all transform active:scale-95',
          isInWork
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
        )}
      >
        {isInWork ? (
          <Square className="w-5 h-5 fill-current" aria-hidden="true" />
        ) : (
          <Play className="w-5 h-5 fill-current" aria-hidden="true" />
        )}
        <span>{isInWork ? 'ODCHOD' : 'PŘÍCHOD'}</span>
      </button>
    </div>
  );
}
