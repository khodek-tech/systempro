'use client';

import { ModuleDefinition, ModuleConfig } from '@/shared/types';
import { cn } from '@/lib/utils';
import {
  Info,
  Wallet,
  Send,
  Umbrella,
  ClipboardCheck,
  CheckSquare,
  ChartColumnIncreasing,
  Clock,
  Calendar,
  Users,
} from 'lucide-react';

interface ModuleSettingsCardProps {
  module: ModuleDefinition;
  config: ModuleConfig | undefined;
  onClick: () => void;
}

const iconMap: Record<string, React.ElementType> = {
  Info,
  Wallet,
  Send,
  Umbrella,
  ClipboardCheck,
  CheckSquare,
  ChartColumnIncreasing,
  Clock,
  Calendar,
  Users,
};

const colorSchemes: Record<string, { bg: string; text: string; activeDot: string }> = {
  'cash-info': { bg: 'bg-blue-50', text: 'text-blue-500', activeDot: 'bg-blue-500' },
  'sales': { bg: 'bg-emerald-50', text: 'text-emerald-500', activeDot: 'bg-emerald-500' },
  'collect': { bg: 'bg-purple-50', text: 'text-purple-500', activeDot: 'bg-purple-500' },
  'absence-report': { bg: 'bg-orange-50', text: 'text-orange-500', activeDot: 'bg-orange-500' },
  'absence-approval': { bg: 'bg-teal-50', text: 'text-teal-500', activeDot: 'bg-teal-500' },
  'tasks': { bg: 'bg-violet-50', text: 'text-violet-500', activeDot: 'bg-violet-500' },
  'kpi-dashboard': { bg: 'bg-indigo-50', text: 'text-indigo-500', activeDot: 'bg-indigo-500' },
  'reports': { bg: 'bg-cyan-50', text: 'text-cyan-500', activeDot: 'bg-cyan-500' },
  'attendance': { bg: 'bg-amber-50', text: 'text-amber-500', activeDot: 'bg-amber-500' },
  'shifts': { bg: 'bg-blue-50', text: 'text-blue-500', activeDot: 'bg-blue-500' },
  'presence': { bg: 'bg-sky-50', text: 'text-sky-500', activeDot: 'bg-sky-500' },
};

export function ModuleSettingsCard({ module, config, onClick }: ModuleSettingsCardProps) {
  const IconComponent = iconMap[module.icon] || Info;
  const colors = colorSchemes[module.id] || { bg: 'bg-slate-50', text: 'text-slate-500', activeDot: 'bg-slate-500' };
  const isEnabled = config?.enabled ?? false;

  return (
    <button
      onClick={onClick}
      className={cn(
        'w-full h-[140px] flex flex-col items-center justify-center gap-3',
        'bg-white border border-slate-200 rounded-xl p-4',
        'hover:shadow-md hover:-translate-y-1 transition-all duration-300',
        'cursor-pointer group'
      )}
    >
      <div
        className={cn(
          'w-12 h-12 rounded-xl flex items-center justify-center',
          'transition-transform duration-300 group-hover:scale-110',
          colors.bg
        )}
      >
        <IconComponent className={cn('w-6 h-6', colors.text)} />
      </div>
      <span className="text-sm font-semibold text-slate-700 text-center leading-tight">
        {module.name}
      </span>
      <div
        className={cn(
          'w-2.5 h-2.5 rounded-full transition-colors',
          isEnabled ? colors.activeDot : 'bg-slate-300'
        )}
        title={isEnabled ? 'Aktivní' : 'Neaktivní'}
      />
    </button>
  );
}
