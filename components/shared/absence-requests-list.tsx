'use client';

import { useState } from 'react';
import { Clock, CheckCircle, XCircle, Calendar, FileText, Inbox, Trash2 } from 'lucide-react';
import { AbsenceRequest, AbsenceRequestStatus } from '@/types';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatCreatedAt(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('cs-CZ', { day: '2-digit', month: '2-digit' });
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

function RequestCard({ request }: { request: AbsenceRequest }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { currentUser } = useAuthStore();
  const { deleteAbsenceRequest } = useAbsenceStore();

  const isDoctor = request.type === 'Lékař';
  const isPending = request.status === 'pending';
  const dateRange =
    request.dateFrom === request.dateTo
      ? formatDate(request.dateFrom)
      : `${formatDate(request.dateFrom)} - ${formatDate(request.dateTo)}`;

  const handleDelete = async () => {
    if (!currentUser) return;
    setDeleting(true);
    await deleteAbsenceRequest(request.id, currentUser.id);
    setDeleting(false);
    setShowConfirm(false);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-slate-800">{request.type}</span>
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
        <div className="flex items-center gap-2">
          {isPending && (
            <button
              onClick={() => setShowConfirm(true)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
              title="Zrušit žádost"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <StatusBadge status={request.status} />
        </div>
      </div>

      {request.note && (
        <div className="flex items-start gap-2 text-sm text-slate-600 bg-slate-50 rounded-lg p-2.5">
          <FileText className="w-3.5 h-3.5 mt-0.5 text-slate-400 flex-shrink-0" />
          <span>{request.note}</span>
        </div>
      )}

      <div className="text-xs text-slate-400">Vytvořeno: {formatCreatedAt(request.createdAt)}</div>

      {showConfirm && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 rounded-lg p-3">
          <span className="text-sm font-medium text-red-700">Opravdu chcete zrušit tuto žádost?</span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowConfirm(false)}
              className="px-3 py-1.5 text-sm font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
              disabled={deleting}
            >
              Ne
            </button>
            <button
              onClick={handleDelete}
              className="px-3 py-1.5 text-sm font-semibold text-white bg-red-600 rounded-lg hover:bg-red-700 transition-all disabled:opacity-50"
              disabled={deleting}
            >
              {deleting ? 'Mažu...' : 'Ano, zrušit'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-slate-200 rounded-xl p-10 flex flex-col items-center justify-center text-center space-y-3">
      <div className="bg-slate-100 w-16 h-16 rounded-full flex items-center justify-center">
        <Inbox className="w-8 h-8 text-slate-400" />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-slate-700">Žádné žádosti</h3>
        <p className="text-sm text-slate-500 mt-1">Pro vybrané období nebyly nalezeny žádné žádosti o absenci.</p>
      </div>
    </div>
  );
}

export function AbsenceRequestsList() {
  const { currentUser } = useAuthStore();
  const { getFilteredMyRequests } = useAbsenceStore();

  const requests = currentUser ? getFilteredMyRequests(currentUser.id) : [];

  if (requests.length === 0) {
    return <EmptyState />;
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-slate-800">Moje žádosti</h3>
      <div className="space-y-3">
        {requests.map((request) => (
          <RequestCard key={request.id} request={request} />
        ))}
      </div>
    </div>
  );
}
