'use client';

import { useState } from 'react';
import { X, Calendar, Clock, FileText, User, MessageSquare, Check } from 'lucide-react';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { AbsenceRequestStatus } from '@/types';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function StatusBadge({ status }: { status: AbsenceRequestStatus }) {
  const config = {
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: Clock,
      label: 'Čeká na schválení',
    },
    approved: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: Check,
      label: 'Schváleno',
    },
    rejected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: X,
      label: 'Zamítnuto',
    },
  };

  const { bg, text, icon: Icon, label } = config[status];

  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${bg} ${text}`}>
      <Icon className="w-3.5 h-3.5" />
      {label}
    </span>
  );
}

export function ApprovalDetailModal() {
  const { selectedApprovalRequestId, closeApprovalDetail, absenceRequests, approveAbsence, rejectAbsence } =
    useAbsenceStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();

  const [approverNote, setApproverNote] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const request = absenceRequests.find((r) => r.id === selectedApprovalRequestId);

  if (!request || !currentUser) return null;

  const userName = getUserById(request.userId)?.fullName || 'Neznámý uživatel';
  const approverName = request.approvedBy ? getUserById(request.approvedBy)?.fullName : undefined;
  const isPending = request.status === 'pending';
  const isDoctor = request.type === 'Lékař';
  const dateRange =
    request.dateFrom === request.dateTo
      ? formatDate(request.dateFrom)
      : `${formatDate(request.dateFrom)} - ${formatDate(request.dateTo)}`;

  const handleApprove = async () => {
    setIsProcessing(true);
    await approveAbsence(request.id, currentUser.id, approverNote.trim() || undefined);
    setIsProcessing(false);
    closeApprovalDetail();
  };

  const handleReject = async () => {
    setIsProcessing(true);
    await rejectAbsence(request.id, currentUser.id, approverNote.trim() || undefined);
    setIsProcessing(false);
    closeApprovalDetail();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={closeApprovalDetail}>
      <div
        className="bg-white max-w-lg w-full mx-4 rounded-2xl p-8 shadow-lg animate-in fade-in duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-slate-800">Detail žádosti</h2>
          <button
            onClick={closeApprovalDetail}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {/* Employee */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <User className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Zaměstnanec</div>
              <div className="font-semibold text-slate-800">{userName}</div>
            </div>
          </div>

          {/* Type + Status */}
          <div className="flex items-center justify-between">
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Typ absence</div>
              <div className="font-semibold text-slate-800">{request.type}</div>
            </div>
            <StatusBadge status={request.status} />
          </div>

          {/* Date */}
          <div className="flex items-center gap-3">
            <div className="bg-slate-100 p-2 rounded-lg">
              <Calendar className="w-4 h-4 text-slate-500" />
            </div>
            <div>
              <div className="text-xs font-medium text-slate-400 uppercase tracking-wide">Termín</div>
              <div className="font-semibold text-slate-800">
                {dateRange}
                {isDoctor && request.timeFrom && request.timeTo && (
                  <span className="text-slate-500 font-medium ml-2">
                    {request.timeFrom} - {request.timeTo}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Requester note */}
          {request.note && (
            <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-3">
              <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-slate-400 mb-1">Poznámka žadatele</div>
                <span>{request.note}</span>
              </div>
            </div>
          )}

          {/* Existing approver note (for already processed requests) */}
          {request.approverNote && !isPending && (
            <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-3">
              <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
              <div>
                <div className="text-xs font-medium text-blue-400 mb-1">
                  Vyjádření{approverName ? ` (${approverName})` : ''}
                </div>
                <span>{request.approverNote}</span>
              </div>
            </div>
          )}

          {/* Approver note input (for pending requests) */}
          {isPending && (
            <div>
              <label className="text-xs font-medium text-slate-400 uppercase tracking-wide mb-2 block">
                Poznámka schvalovatele
              </label>
              <textarea
                value={approverNote}
                onChange={(e) => setApproverNote(e.target.value)}
                placeholder="Volitelná poznámka k rozhodnutí..."
                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-base font-medium outline-none resize-none focus:border-orange-300 transition-colors"
                rows={3}
              />
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="mt-6">
          {isPending ? (
            <div className="flex items-center gap-3">
              <button
                onClick={handleReject}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Zamítnout
              </button>
              <button
                onClick={handleApprove}
                disabled={isProcessing}
                className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold bg-green-600 text-white hover:bg-green-700 transition-all active:scale-[0.98] disabled:opacity-50"
              >
                Schválit
              </button>
            </div>
          ) : (
            <button
              onClick={closeApprovalDetail}
              className="w-full px-4 py-2.5 rounded-lg text-sm font-medium bg-slate-100 text-slate-700 hover:bg-slate-200 transition-all"
            >
              Zavřít
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
