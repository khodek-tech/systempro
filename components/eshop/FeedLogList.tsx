'use client';

import { useState } from 'react';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, XCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { useEshopFeedStore } from '@/features/eshop/eshop-feed-store';

interface FeedLogListProps {
  feedId: number;
  onBack: () => void;
}

export function FeedLogList({ feedId, onBack }: FeedLogListProps) {
  const { feedConfigs, getLogsForFeed } = useEshopFeedStore();
  const feedConfig = feedConfigs.find((fc) => fc.id === feedId);
  const logs = getLogsForFeed(feedId);

  const [expandedLogId, setExpandedLogId] = useState<number | null>(null);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Zpět na feedy
        </button>
        <h3 className="text-lg font-bold text-slate-800">
          Historie importů — {feedConfig?.name ?? 'Feed'}
        </h3>
      </div>

      {/* Logs */}
      {logs.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500 font-medium">Zatím žádné importy</p>
          <p className="text-sm text-slate-400 mt-1">
            Po prvním importu se zde zobrazí historie
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Datum
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Typ
                </th>
                <th className="text-left px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Stav
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Nových
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Aktualizováno
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Chyb
                </th>
                <th className="text-right px-5 py-3 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Trvání
                </th>
                <th className="w-10 px-3 py-3" />
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => {
                const isExpanded = expandedLogId === log.id;
                const duration = log.completedAt && log.startedAt
                  ? Math.round((new Date(log.completedAt).getTime() - new Date(log.startedAt).getTime()) / 1000)
                  : null;
                const errorDetails = (log.details as { errors?: { row: number; message: string }[] })?.errors;

                return (
                  <LogRow
                    key={log.id}
                    log={log}
                    duration={duration}
                    isExpanded={isExpanded}
                    errorDetails={errorDetails}
                    onToggle={() => setExpandedLogId(isExpanded ? null : log.id)}
                  />
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// =============================================================================
// LOG ROW
// =============================================================================

function LogRow({
  log,
  duration,
  isExpanded,
  errorDetails,
  onToggle,
}: {
  log: { id: number; startedAt: string; type: string; status: string; newProducts: number; updatedProducts: number; errors: number };
  duration: number | null;
  isExpanded: boolean;
  errorDetails?: { row: number; message: string }[];
  onToggle: () => void;
}) {
  const StatusIcon = {
    success: CheckCircle2,
    error: XCircle,
    partial: AlertTriangle,
  }[log.status] ?? Clock;

  const statusColor = {
    success: 'text-green-600',
    error: 'text-red-600',
    partial: 'text-orange-600',
  }[log.status] ?? 'text-slate-400';

  const statusLabel = {
    success: 'Úspěch',
    error: 'Chyba',
    partial: 'Částečný',
  }[log.status] ?? log.status;

  return (
    <>
      <tr
        className="border-b border-slate-100 hover:bg-slate-50 cursor-pointer transition-colors"
        onClick={onToggle}
      >
        <td className="px-5 py-3 text-sm font-medium text-slate-600">
          {new Date(log.startedAt).toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          })}
        </td>
        <td className="px-5 py-3">
          <span className="text-xs font-semibold text-slate-500 uppercase">
            {log.type === 'manual' ? 'Ruční' : 'Plánovaný'}
          </span>
        </td>
        <td className="px-5 py-3">
          <span className={`inline-flex items-center gap-1 text-xs font-semibold ${statusColor}`}>
            <StatusIcon className="w-3.5 h-3.5" />
            {statusLabel}
          </span>
        </td>
        <td className="px-5 py-3 text-right">
          <span className="text-sm font-bold text-green-600">
            {log.newProducts > 0 ? `+${log.newProducts}` : '0'}
          </span>
        </td>
        <td className="px-5 py-3 text-right">
          <span className="text-sm font-bold text-blue-600">
            {log.updatedProducts > 0 ? log.updatedProducts : '0'}
          </span>
        </td>
        <td className="px-5 py-3 text-right">
          <span className={`text-sm font-bold ${log.errors > 0 ? 'text-red-600' : 'text-slate-400'}`}>
            {log.errors}
          </span>
        </td>
        <td className="px-5 py-3 text-right text-sm text-slate-500">
          {duration !== null ? (duration < 60 ? `${duration}s` : `${Math.floor(duration / 60)}m ${duration % 60}s`) : '—'}
        </td>
        <td className="px-3 py-3">
          {errorDetails && errorDetails.length > 0 && (
            isExpanded
              ? <ChevronUp className="w-4 h-4 text-slate-400" />
              : <ChevronDown className="w-4 h-4 text-slate-400" />
          )}
        </td>
      </tr>
      {isExpanded && errorDetails && errorDetails.length > 0 && (
        <tr>
          <td colSpan={8} className="px-5 py-3 bg-red-50/50">
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              {errorDetails.slice(0, 50).map((err, idx) => (
                <div key={idx} className="flex items-center gap-2 text-xs">
                  <span className="font-mono text-slate-500 w-16 shrink-0">Řádek {err.row}</span>
                  <span className="text-red-600">{err.message}</span>
                </div>
              ))}
              {errorDetails.length > 50 && (
                <p className="text-xs text-slate-400 mt-1">
                  ...a dalších {errorDetails.length - 50} chyb
                </p>
              )}
            </div>
          </td>
        </tr>
      )}
    </>
  );
}
