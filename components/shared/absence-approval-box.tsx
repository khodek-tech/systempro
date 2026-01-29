'use client';

import { ClipboardCheck } from 'lucide-react';
import { useAbsenceStore } from '@/stores/absence-store';
import { useAuthStore } from '@/stores/auth-store';
import { RoleType } from '@/types';

export function AbsenceApprovalCard() {
  const { currentUser } = useAuthStore();
  const { getActiveRoleType } = useAuthStore();
  const { getRequestsByStatus, openApprovalView } = useAbsenceStore();

  const roleType = getActiveRoleType();

  if (!currentUser || !roleType) {
    return null;
  }

  const pendingCount = getRequestsByStatus(currentUser.id, roleType as RoleType, 'pending').length;

  return (
    <button
      onClick={openApprovalView}
      className="group relative bg-white border border-slate-100 rounded-[40px] p-10 flex flex-col items-center justify-center space-y-8 transition-all duration-500 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.08)] hover:-translate-y-2 active:scale-95 w-full aspect-square md:aspect-auto md:min-h-[380px] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-orange-50 w-32 h-32 sm:w-36 sm:h-36 rounded-[36px] flex items-center justify-center transition-all duration-500 group-hover:scale-110 group-hover:rotate-3 z-10">
        <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-orange-50" />
        <div className="relative text-orange-500 transition-transform duration-500 group-hover:scale-110">
          <ClipboardCheck className="w-[72px] h-[72px]" strokeWidth={1.2} />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-3 z-10">
        <div className="flex items-center gap-3">
          <span className="text-3xl font-extrabold tracking-tight transition-colors duration-300 text-orange-600">
            Schvalování
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-bold bg-orange-500 text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="w-12 h-1.5 bg-slate-100 rounded-full group-hover:w-20 group-hover:bg-orange-500 transition-all duration-500 opacity-50" />
      </div>
    </button>
  );
}

// Keep old export for backward compatibility during transition
export const AbsenceApprovalBox = AbsenceApprovalCard;
