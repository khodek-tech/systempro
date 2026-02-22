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
      className="group relative bg-white border border-slate-100/60 rounded-[24px] sm:rounded-[32px] lg:rounded-[var(--module-card-radius)] p-6 sm:p-8 lg:p-[var(--module-card-pad)] flex flex-col items-center justify-center space-y-4 sm:space-y-6 lg:space-y-[var(--module-inner-gap)] transition-all duration-300 hover:shadow-elevation-card-hover hover:-translate-y-1 active:scale-[0.98] w-full aspect-square md:aspect-auto md:min-h-[280px] lg:min-h-0 lg:h-[var(--module-card-h)] overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-50/50 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <div className="relative bg-orange-50 w-20 h-20 sm:w-28 sm:h-28 lg:w-[var(--module-icon-size)] lg:h-[var(--module-icon-size)] rounded-2xl sm:rounded-3xl lg:rounded-[var(--module-icon-radius)] flex items-center justify-center transition-all duration-500 group-hover:scale-105 group-hover:rotate-1 z-10">
        <div className="absolute inset-0 blur-3xl opacity-0 group-hover:opacity-40 transition-opacity duration-500 rounded-full bg-orange-50" />
        <div className="relative text-orange-500 transition-transform duration-500 group-hover:scale-105">
          <ClipboardCheck className="w-10 h-10 sm:w-14 sm:h-14 lg:w-[var(--module-icon-inner)] lg:h-[var(--module-icon-inner)]" strokeWidth={1.2} />
        </div>
      </div>
      <div className="flex flex-col items-center space-y-3 z-10">
        <div className="flex items-center gap-3">
          <span className="text-xl sm:text-2xl lg:text-[length:var(--module-title-size)] font-extrabold tracking-tight transition-colors duration-300 text-orange-600">
            Schvalování
          </span>
          {pendingCount > 0 && (
            <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 rounded-full text-sm font-bold bg-orange-500 text-white">
              {pendingCount}
            </span>
          )}
        </div>
        <div className="w-8 h-0.5 bg-slate-200 rounded-full group-hover:w-16 group-hover:bg-orange-500 transition-all duration-500 opacity-50" />
      </div>
    </button>
  );
}

// Keep old export for backward compatibility during transition
export const AbsenceApprovalBox = AbsenceApprovalCard;
