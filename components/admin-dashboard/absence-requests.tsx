'use client';

import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';
import { useUsersStore } from '@/stores/users-store';

export function AbsenceRequests() {
  const { absenceRequests, approveAbsence } = useAbsenceStore();
  const { currentUser } = useAuthStore();
  const { getUserById } = useUsersStore();

  const pendingRequests = absenceRequests.filter((r) => r.status === 'pending');

  const handleApprove = async (requestId: string) => {
    if (!currentUser) return;
    const result = await approveAbsence(requestId, currentUser.id);
    if (result.success) {
      toast.success('Žádost schválena');
    } else {
      toast.error(result.error || 'Nepodařilo se schválit žádost');
    }
  };

  return (
    <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-200">
      <h4 className="text-base font-bold text-orange-600 mb-5">
        Žádosti o volno / lékař
      </h4>
      <div className="space-y-4">
        {pendingRequests.length === 0 && (
          <p className="text-sm text-slate-400 text-center py-4">
            Žádné čekající žádosti
          </p>
        )}
        {pendingRequests.map((request) => {
          const user = getUserById(request.userId);
          const userName = user?.fullName || 'Neznámý';

          return (
            <div
              key={request.id}
              className="p-5 bg-orange-50 rounded-xl border border-orange-100 flex justify-between items-center"
            >
              <div>
                <p className="text-sm font-medium text-orange-700 mb-1">
                  {userName}
                </p>
                <p className="text-base font-semibold text-slate-800">
                  {request.type}: {request.dateFrom} — {request.dateTo}
                </p>
                {request.note && (
                  <p className="text-xs text-slate-500 mt-1">{request.note}</p>
                )}
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="bg-white text-orange-600 text-sm font-semibold px-5 py-2.5 rounded-lg shadow-sm hover:bg-orange-600 hover:text-white transition-all"
                onClick={() => handleApprove(request.id)}
              >
                Schválit
              </Button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
