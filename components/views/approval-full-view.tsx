'use client';

import { ArrowLeft, ClipboardCheck, Clock, CheckCircle, XCircle, Calendar, FileText, User, Check, X, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';
import { AbsenceRequest, AbsenceRequestStatus, RoleType } from '@/types';
import { months, years } from '@/lib/mock-data';
import { ApprovalDetailModal } from '@/components/shared/approval-detail-modal';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCreatedAt(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
}

function getUserName(userId: string): string {
  const user = useUsersStore.getState().getUserById(userId);
  return user?.fullName || 'Neznámý uživatel';
}

function StatusBadge({ status }: { status: AbsenceRequestStatus }) {
  const config = {
    pending: {
      bg: 'bg-amber-50',
      text: 'text-amber-700',
      icon: Clock,
      label: 'Čeká',
    },
    approved: {
      bg: 'bg-green-50',
      text: 'text-green-700',
      icon: CheckCircle,
      label: 'Schváleno',
    },
    rejected: {
      bg: 'bg-red-50',
      text: 'text-red-700',
      icon: XCircle,
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

interface ApprovalRequestCardProps {
  request: AbsenceRequest;
  onApprove: (requestId: string) => void;
  onReject: (requestId: string) => void;
  onClick: (requestId: string) => void;
}

function ApprovalRequestCard({ request, onApprove, onReject, onClick }: ApprovalRequestCardProps) {
  const isDoctor = request.type === 'Lékař';
  const dateRange =
    request.dateFrom === request.dateTo
      ? formatDate(request.dateFrom)
      : `${formatDate(request.dateFrom)} - ${formatDate(request.dateTo)}`;
  const isPending = request.status === 'pending';

  return (
    <div
      className="bg-white border border-slate-200 rounded-xl p-4 space-y-3 cursor-pointer hover:border-slate-300 hover:shadow-sm transition-all"
      onClick={() => onClick(request.id)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-2">
            <User className="w-4 h-4 text-slate-400" />
            <span className="font-semibold text-slate-800">{getUserName(request.userId)}</span>
          </div>

          <div className="flex items-center gap-2 mb-1">
            <span className="font-medium text-slate-700">{request.type}</span>
          </div>
          <div className="flex items-center gap-1.5 text-sm text-slate-500">
            <Calendar className="w-3.5 h-3.5" />
            <span>{dateRange}</span>
            {isDoctor && request.timeFrom && request.timeTo && (
              <>
                <span className="text-slate-300">|</span>
                <Clock className="w-3.5 h-3.5" />
                <span>
                  {request.timeFrom} - {request.timeTo}
                </span>
              </>
            )}
          </div>
        </div>
        <StatusBadge status={request.status} />
      </div>

      {request.note && (
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">
          <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
          <span>{request.note}</span>
        </div>
      )}

      {request.approverNote && request.status !== 'pending' && (
        <div className="flex items-start gap-2 text-sm text-blue-600 bg-blue-50 rounded-lg p-2.5">
          <MessageSquare className="w-3.5 h-3.5 mt-0.5 text-blue-400 flex-shrink-0" />
          <span>{request.approverNote}</span>
        </div>
      )}

      <div className="flex items-center justify-between">
        <div className="text-xs text-slate-400">Vytvořeno: {formatCreatedAt(request.createdAt)}</div>

        {isPending && (
          <div className="flex items-center gap-2">
            <button
              onClick={(e) => { e.stopPropagation(); onReject(request.id); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 text-red-700 hover:bg-red-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
              Zamítnout
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onApprove(request.id); }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-600 text-white hover:bg-green-700 transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              Schválit
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export function ApprovalFullView() {
  const { currentUser, getActiveRoleType } = useAuthStore();
  const {
    approvalFilter,
    approvalMonthFilter,
    approvalYearFilter,
    closeApprovalView,
    setApprovalFilter,
    setApprovalMonthFilter,
    setApprovalYearFilter,
    getFilteredRequestsForApproval,
    approveAbsence,
    rejectAbsence,
    selectedApprovalRequestId,
    openApprovalDetail,
  } = useAbsenceStore();

  const roleType = getActiveRoleType();

  if (!currentUser || !roleType) {
    return null;
  }

  const requests = getFilteredRequestsForApproval(
    currentUser.id,
    roleType as RoleType
  );

  const handleApprove = async (requestId: string) => {
    await approveAbsence(requestId, currentUser.id);
  };

  const handleReject = async (requestId: string) => {
    await rejectAbsence(requestId, currentUser.id);
  };

  return (
    <main className="flex-1 p-6 overflow-y-auto bg-slate-50">
      <div className="space-y-6 pb-16 animate-in fade-in duration-300">
        {/* Header with back button and filters */}
        <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <Button
            onClick={closeApprovalView}
            variant="outline"
            className="px-4 py-2 rounded-lg text-xs font-medium"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zpět
          </Button>

          <h1 className="text-xl font-bold text-slate-800">Schvalování</h1>

          <div className="flex items-center space-x-3">
            <select
              value={approvalMonthFilter}
              onChange={(e) => setApprovalMonthFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {months.map((month) => (
                <option key={month.value} value={month.value}>
                  {month.label}
                </option>
              ))}
            </select>
            <select
              value={approvalYearFilter}
              onChange={(e) => setApprovalYearFilter(e.target.value)}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              {years.map((year) => (
                <option key={year.value} value={year.value}>
                  {year.label}
                </option>
              ))}
            </select>
            <select
              value={approvalFilter}
              onChange={(e) => setApprovalFilter(e.target.value as AbsenceRequestStatus | 'all')}
              className="bg-slate-50 font-medium text-xs rounded-lg px-3 py-2 outline-none border border-slate-200"
            >
              <option value="all">Všechny stavy</option>
              <option value="pending">Čeká na schválení</option>
              <option value="approved">Schváleno</option>
              <option value="rejected">Zamítnuto</option>
            </select>
          </div>
        </div>

        {/* Requests list */}
        <div className="space-y-3">
          {requests.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
              <ClipboardCheck className="w-16 h-16 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-500 font-medium">Žádné žádosti k zobrazení</p>
            </div>
          ) : (
            requests.map((request) => (
              <ApprovalRequestCard
                key={request.id}
                request={request}
                onApprove={handleApprove}
                onReject={handleReject}
                onClick={openApprovalDetail}
              />
            ))
          )}
        </div>
      </div>

      {selectedApprovalRequestId && <ApprovalDetailModal />}
    </main>
  );
}
