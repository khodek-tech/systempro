import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { AbsenceType, AbsenceFormData, AbsenceRequest, AbsenceRequestStatus, RoleType } from '@/types';
import { MOCK_ABSENCE_REQUESTS } from '@/lib/mock-data';
import {
  getUserPrimaryRoleType,
  canApproveUser,
  validateApproverPermission,
} from '@/lib/absence-helpers';
import { STORAGE_KEYS } from '@/lib/constants';

interface AbsenceState {
  formData: AbsenceFormData;
  absenceRequests: AbsenceRequest[];
  // View mode
  absenceViewMode: 'card' | 'view';
  approvalViewMode: 'card' | 'view';
  // Filters
  myRequestsMonthFilter: string;
  myRequestsYearFilter: string;
  myRequestsStatusFilter: AbsenceRequestStatus | 'all';
  approvalFilter: AbsenceRequestStatus | 'all';
  approvalMonthFilter: string;
  approvalYearFilter: string;
}

interface AbsenceActions {
  // Form field actions
  setAbsenceType: (type: AbsenceType) => void;
  setDateFrom: (date: string) => void;
  setDateTo: (date: string) => void;
  setTimeFrom: (time: string) => void;
  setTimeTo: (time: string) => void;
  setNote: (note: string) => void;

  // Computed
  showTimeSection: () => boolean;

  // Submit actions
  submitAbsence: () => { success: boolean; error?: string };
  resetForm: () => void;

  // Absence request actions
  submitAbsenceRequest: (userId: string) => { success: boolean; error?: string };
  approveAbsence: (requestId: string, approverId: string) => { success: boolean; error?: string };
  rejectAbsence: (requestId: string, approverId: string) => { success: boolean; error?: string };

  // Getters
  getMyRequests: (userId: string) => AbsenceRequest[];
  getFilteredMyRequests: (userId: string) => AbsenceRequest[];
  getPendingRequestsForApproval: (approverId: string, roleType: RoleType) => AbsenceRequest[];
  getAllRequestsForApproval: (approverId: string, roleType: RoleType) => AbsenceRequest[];
  getRequestsByStatus: (approverId: string, roleType: RoleType, status: AbsenceRequestStatus | 'all') => AbsenceRequest[];
  getFilteredRequestsForApproval: (approverId: string, roleType: RoleType) => AbsenceRequest[];

  // View mode actions
  openAbsenceView: () => void;
  closeAbsenceView: () => void;
  openApprovalView: () => void;
  closeApprovalView: () => void;

  // Notification methods
  getUnseenProcessedRequestsCount: (userId: string) => number;
  markMyRequestsAsSeen: (userId: string) => void;

  // Filter actions
  setMyRequestsMonthFilter: (month: string) => void;
  setMyRequestsYearFilter: (year: string) => void;
  setMyRequestsStatusFilter: (status: AbsenceRequestStatus | 'all') => void;
  setApprovalFilter: (filter: AbsenceRequestStatus | 'all') => void;
  setApprovalMonthFilter: (month: string) => void;
  setApprovalYearFilter: (year: string) => void;
}

const initialFormData: AbsenceFormData = {
  type: 'Dovolená',
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  note: '',
};

export const useAbsenceStore = create<AbsenceState & AbsenceActions>()(
  persist(
    (set, get) => ({
      // Initial state
      formData: { ...initialFormData },
      absenceRequests: MOCK_ABSENCE_REQUESTS,
      absenceViewMode: 'card',
      approvalViewMode: 'card',
      myRequestsMonthFilter: 'all',
      myRequestsYearFilter: 'all',
      myRequestsStatusFilter: 'all',
      approvalFilter: 'all',
      approvalMonthFilter: 'all',
      approvalYearFilter: 'all',

      // Form field actions
      setAbsenceType: (type) =>
        set((state) => ({
          formData: { ...state.formData, type },
        })),

      setDateFrom: (dateFrom) =>
        set((state) => ({
          formData: { ...state.formData, dateFrom },
        })),

      setDateTo: (dateTo) =>
        set((state) => ({
          formData: { ...state.formData, dateTo },
        })),

      setTimeFrom: (timeFrom) =>
        set((state) => ({
          formData: { ...state.formData, timeFrom },
        })),

      setTimeTo: (timeTo) =>
        set((state) => ({
          formData: { ...state.formData, timeTo },
        })),

      setNote: (note) =>
        set((state) => ({
          formData: { ...state.formData, note },
        })),

      // Computed
      showTimeSection: () => get().formData.type === 'Lékař',

      // Submit actions
      submitAbsence: () => {
        const { formData } = get();

        if (!formData.dateFrom || !formData.dateTo) {
          return { success: false, error: 'Vyplňte data od a do!' };
        }

        // Validate dateFrom <= dateTo
        if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
          return { success: false, error: 'Datum od nemůže být po datu do!' };
        }

        // Reset form after successful submission
        set({ formData: { ...initialFormData } });

        return { success: true };
      },

      resetForm: () => set({ formData: { ...initialFormData } }),

      // Absence request actions
      submitAbsenceRequest: (userId: string) => {
        const { formData } = get();

        if (!formData.dateFrom || !formData.dateTo) {
          return { success: false, error: 'Vyplňte data od a do!' };
        }

        // Validate dateFrom <= dateTo
        if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
          return { success: false, error: 'Datum od nemůže být po datu do!' };
        }

        if (formData.type === 'Lékař' && (!formData.timeFrom || !formData.timeTo)) {
          return { success: false, error: 'Vyplňte čas od a do!' };
        }

        const newRequest: AbsenceRequest = {
          id: `abs-req-${crypto.randomUUID()}`,
          userId,
          type: formData.type,
          dateFrom: formData.dateFrom,
          dateTo: formData.dateTo,
          timeFrom: formData.type === 'Lékař' ? formData.timeFrom : undefined,
          timeTo: formData.type === 'Lékař' ? formData.timeTo : undefined,
          note: formData.note,
          status: 'pending',
          createdAt: new Date().toISOString(),
        };

        set((state) => ({
          absenceRequests: [...state.absenceRequests, newRequest],
          formData: { ...initialFormData },
        }));

        return { success: true };
      },

      approveAbsence: (requestId: string, approverId: string) => {
        const { absenceRequests } = get();
        const request = absenceRequests.find((r) => r.id === requestId);

        if (!request) {
          return { success: false, error: 'Žádost nenalezena' };
        }

        if (request.status !== 'pending') {
          return { success: false, error: 'Žádost již byla vyřízena' };
        }

        // Validate approver has permission
        const permissionCheck = validateApproverPermission(approverId, request.userId);
        if (!permissionCheck.valid) {
          return { success: false, error: permissionCheck.error || 'Nemáte oprávnění schvalovat tuto žádost' };
        }

        set((state) => ({
          absenceRequests: state.absenceRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'approved' as AbsenceRequestStatus,
                  approvedBy: approverId,
                  approvedAt: new Date().toISOString(),
                  seenByUser: false,
                }
              : r
          ),
        }));

        return { success: true };
      },

      rejectAbsence: (requestId: string, approverId: string) => {
        const { absenceRequests } = get();
        const request = absenceRequests.find((r) => r.id === requestId);

        if (!request) {
          return { success: false, error: 'Žádost nenalezena' };
        }

        if (request.status !== 'pending') {
          return { success: false, error: 'Žádost již byla vyřízena' };
        }

        // Validate approver has permission
        const permissionCheck = validateApproverPermission(approverId, request.userId);
        if (!permissionCheck.valid) {
          return { success: false, error: permissionCheck.error || 'Nemáte oprávnění zamítnout tuto žádost' };
        }

        set((state) => ({
          absenceRequests: state.absenceRequests.map((r) =>
            r.id === requestId
              ? {
                  ...r,
                  status: 'rejected' as AbsenceRequestStatus,
                  approvedBy: approverId,
                  approvedAt: new Date().toISOString(),
                  seenByUser: false,
                }
              : r
          ),
        }));

        return { success: true };
      },

      // Getters
      getMyRequests: (userId: string) => {
        const { absenceRequests } = get();
        return absenceRequests
          .filter((r) => r.userId === userId)
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getFilteredMyRequests: (userId: string) => {
        const { absenceRequests, myRequestsMonthFilter, myRequestsYearFilter, myRequestsStatusFilter } = get();
        return absenceRequests
          .filter((r) => {
            if (r.userId !== userId) return false;

            const requestDate = new Date(r.dateFrom);
            const requestMonth = String(requestDate.getMonth() + 1).padStart(2, '0');
            const requestYear = String(requestDate.getFullYear());

            if (myRequestsMonthFilter !== 'all' && requestMonth !== myRequestsMonthFilter) return false;
            if (myRequestsYearFilter !== 'all' && requestYear !== myRequestsYearFilter) return false;
            if (myRequestsStatusFilter !== 'all' && r.status !== myRequestsStatusFilter) return false;

            return true;
          })
          .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      },

      getPendingRequestsForApproval: (approverId: string, roleType: RoleType) => {
        return get().getRequestsByStatus(approverId, roleType, 'pending');
      },

      getAllRequestsForApproval: (approverId: string, roleType: RoleType) => {
        return get().getRequestsByStatus(approverId, roleType, 'all');
      },

      getRequestsByStatus: (approverId: string, roleType: RoleType, status: AbsenceRequestStatus | 'all') => {
        const { absenceRequests } = get();

        return absenceRequests
          .filter((request) => {
            // Exclude own requests
            if (request.userId === approverId) return false;

            // Filter by status if specified
            if (status !== 'all' && request.status !== status) return false;

            // Check if user is a subordinate
            const userRoleType = getUserPrimaryRoleType(request.userId);
            if (!userRoleType) return false;

            return canApproveUser(roleType, userRoleType);
          })
          .sort((a, b) => {
            // Pending first, then by date
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
      },

      getFilteredRequestsForApproval: (approverId: string, roleType: RoleType) => {
        const { absenceRequests, approvalMonthFilter, approvalYearFilter, approvalFilter } = get();

        return absenceRequests
          .filter((request) => {
            // Exclude own requests
            if (request.userId === approverId) return false;

            // Check if user is a subordinate
            const userRoleType = getUserPrimaryRoleType(request.userId);
            if (!userRoleType) return false;
            if (!canApproveUser(roleType, userRoleType)) return false;

            // Filter by month
            const requestDate = new Date(request.dateFrom);
            const requestMonth = String(requestDate.getMonth() + 1).padStart(2, '0');
            const requestYear = String(requestDate.getFullYear());

            if (approvalMonthFilter !== 'all' && requestMonth !== approvalMonthFilter) return false;
            if (approvalYearFilter !== 'all' && requestYear !== approvalYearFilter) return false;
            if (approvalFilter !== 'all' && request.status !== approvalFilter) return false;

            return true;
          })
          .sort((a, b) => {
            // Pending first, then by date
            if (a.status === 'pending' && b.status !== 'pending') return -1;
            if (a.status !== 'pending' && b.status === 'pending') return 1;
            return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
          });
      },

      // View mode actions
      openAbsenceView: () => set({ absenceViewMode: 'view' }),
      closeAbsenceView: () => set({ absenceViewMode: 'card' }),
      openApprovalView: () => set({ approvalViewMode: 'view' }),
      closeApprovalView: () => set({ approvalViewMode: 'card' }),

      // Notification methods
      getUnseenProcessedRequestsCount: (userId: string) => {
        const { absenceRequests } = get();
        return absenceRequests.filter(
          (r) => r.userId === userId && r.status !== 'pending' && r.seenByUser === false
        ).length;
      },

      markMyRequestsAsSeen: (userId: string) => {
        set((state) => ({
          absenceRequests: state.absenceRequests.map((r) =>
            r.userId === userId && r.status !== 'pending' ? { ...r, seenByUser: true } : r
          ),
        }));
      },

      // Filter actions
      setMyRequestsMonthFilter: (month: string) => set({ myRequestsMonthFilter: month }),
      setMyRequestsYearFilter: (year: string) => set({ myRequestsYearFilter: year }),
      setMyRequestsStatusFilter: (status: AbsenceRequestStatus | 'all') => set({ myRequestsStatusFilter: status }),
      setApprovalFilter: (filter: AbsenceRequestStatus | 'all') => set({ approvalFilter: filter }),
      setApprovalMonthFilter: (month: string) => set({ approvalMonthFilter: month }),
      setApprovalYearFilter: (year: string) => set({ approvalYearFilter: year }),
    }),
    {
      name: STORAGE_KEYS.ABSENCE,
      partialize: (state) => ({
        absenceRequests: state.absenceRequests,
      }),
    }
  )
);
