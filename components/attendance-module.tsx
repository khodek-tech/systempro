'use client';

import { Circle, CircleCheck, Play, Square, ChevronDown } from 'lucide-react';
import { WorkplaceType } from '@/types';
import { stores } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface AttendanceModuleProps {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplace: WorkplaceType;
  onToggleAttendance: () => { success: boolean; error?: string };
  onKasaConfirm: (confirmed: boolean) => void;
  onWorkplaceChange: (workplace: WorkplaceType) => void;
}

export function AttendanceModule({
  isInWork,
  kasaConfirmed,
  workplace,
  onToggleAttendance,
  onKasaConfirm,
  onWorkplaceChange,
}: AttendanceModuleProps) {
  const handleAttendanceClick = () => {
    const result = onToggleAttendance();
    if (!result.success && result.error) {
      alert(`⚠️ CHYBA: ${result.error}`);
    }
  };

  return (
    <div className="hidden md:flex items-center space-x-6">
      {/* Kasa & Odvody badge */}
      <button
        onClick={() => onKasaConfirm(!kasaConfirmed)}
        className={cn(
          'flex items-center space-x-2.5 px-5 py-2.5 rounded-full border transition-all',
          kasaConfirmed
            ? 'bg-green-50 border-green-100'
            : 'bg-slate-50 border-slate-200 opacity-60 hover:opacity-100'
        )}
      >
        {kasaConfirmed ? (
          <CircleCheck className="w-5 h-5 text-green-500" />
        ) : (
          <Circle className="w-5 h-5 text-slate-400" />
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

      {/* Status & Store selector */}
      <div className="flex flex-col items-end">
        <div className="flex items-center space-x-1.5 text-slate-400">
          <div
            className={cn(
              'w-2.5 h-2.5 rounded-full animate-pulse',
              isInWork ? 'bg-green-500' : 'bg-red-500'
            )}
          />
          <span className="text-xs font-bold uppercase tracking-wider">
            {isInWork ? 'V práci' : 'Mimo práci'}
          </span>
        </div>
        <div className="relative group">
          <select
            value={workplace}
            onChange={(e) => onWorkplaceChange(e.target.value as WorkplaceType)}
            disabled={isInWork}
            className="appearance-none bg-transparent pr-6 text-base font-semibold text-slate-700 outline-none cursor-pointer disabled:cursor-not-allowed disabled:opacity-50"
          >
            {stores.map((store) => (
              <option key={store.value} value={store.value}>
                {store.label}
              </option>
            ))}
          </select>
          <ChevronDown className="absolute right-0 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 pointer-events-none group-hover:translate-y-[-45%] transition-transform" />
        </div>
      </div>

      {/* Attendance button */}
      <button
        onClick={handleAttendanceClick}
        className={cn(
          'flex items-center space-x-2.5 px-7 py-3 rounded-xl font-bold text-base transition-all transform active:scale-95',
          isInWork
            ? 'bg-red-600 hover:bg-red-700 text-white shadow-lg shadow-red-200'
            : 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-lg shadow-emerald-200'
        )}
      >
        {isInWork ? (
          <Square className="w-5 h-5 fill-current" />
        ) : (
          <Play className="w-5 h-5 fill-current" />
        )}
        <span>{isInWork ? 'ODCHOD' : 'PŘÍCHOD'}</span>
      </button>
    </div>
  );
}
