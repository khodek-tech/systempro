import { create } from 'zustand';
import type { RealtimeChannel } from '@supabase/supabase-js';
import { AbsenceType, AbsenceFormData, AbsenceRequest, AbsenceRequestStatus, RoleType } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { mapDbToAbsenceRequest, mapAbsenceRequestToDb } from '@/lib/supabase/mappers';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import {
  getUserPrimaryRoleType,
  canApproveUser,
  validateApproverPermission,
} from './absence-helpers';

interface AbsenceState {
  formData: AbsenceFormData;
  absenceRequests: AbsenceRequest[];
  _loaded: boolean;
  _loading: boolean;
  _realtimeChannel: RealtimeChannel | null;
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
  // Fetch
  fetchAbsenceRequests: () => Promise<void>;

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
  submitAbsenceRequest: (userId: string) => Promise<{ success: boolean; error?: string }>;
  deleteAbsenceRequest: (requestId: string, userId: string) => Promise<{ success: boolean; error?: string }>;
  approveAbsence: (requestId: string, approverId: string) => Promise<{ success: boolean; error?: string }>;
  rejectAbsence: (requestId: string, approverId: string) => Promise<{ success: boolean; error?: string }>;

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
  markMyRequestsAsSeen: (userId: string) => Promise<void>;

  // Filter actions
  setMyRequestsMonthFilter: (month: string) => void;
  setMyRequestsYearFilter: (year: string) => void;
  setMyRequestsStatusFilter: (status: AbsenceRequestStatus | 'all') => void;
  setApprovalFilter: (filter: AbsenceRequestStatus | 'all') => void;
  setApprovalMonthFilter: (month: string) => void;
  setApprovalYearFilter: (year: string) => void;

  // Realtime
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
}

const initialFormData: AbsenceFormData = {
  type: 'Dovolená',
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  note: '',
};

export const useAbsenceStore = create<AbsenceState & AbsenceActions>()((set, get) => ({
  // Initial state
  formData: { ...initialFormData },
  absenceRequests: [],
  _loaded: false,
  _loading: false,
  _realtimeChannel: null,
  absenceViewMode: 'card',
  approvalViewMode: 'card',
  myRequestsMonthFilter: 'all',
  myRequestsYearFilter: 'all',
  myRequestsStatusFilter: 'all',
  approvalFilter: 'all',
  approvalMonthFilter: 'all',
  approvalYearFilter: 'all',

  // Fetch
  fetchAbsenceRequests: async () => {
    set({ _loading: true });
    const supabase = createClient();
    const { data, error } = await supabase.from('zadosti_o_absenci').select('*');
    if (!error && data) {
      set({ absenceRequests: data.map(mapDbToAbsenceRequest), _loaded: true, _loading: false });
    } else {
      logger.error('Failed to fetch absence requests');
      set({ _loading: false });
    }
  },

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
  submitAbsenceRequest: async (userId: string) => {
    const { formData } = get();

    if (!formData.dateFrom || !formData.dateTo) {
      return { success: false, error: 'Vyplňte data od a do!' };
    }

    // Validate dateFrom is not in the past
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(formData.dateFrom) < today) {
      return { success: false, error: 'Nelze podat žádost na datum v minulosti!' };
    }

    // Validate dateFrom <= dateTo
    if (new Date(formData.dateFrom) > new Date(formData.dateTo)) {
      return { success: false, error: 'Datum od nemůže být po datu do!' };
    }

    // Check for overlapping requests (pending or approved)
    const { absenceRequests } = get();
    const newFrom = new Date(formData.dateFrom).getTime();
    const newTo = new Date(formData.dateTo).getTime();
    const overlapping = absenceRequests.find(
      (r) =>
        r.userId === userId &&
        (r.status === 'pending' || r.status === 'approved') &&
        new Date(r.dateFrom).getTime() <= newTo &&
        new Date(r.dateTo).getTime() >= newFrom
    );
    if (overlapping) {
      return { success: false, error: 'Na vybrané dny již existuje žádost o absenci!' };
    }

    if (formData.type === 'Lékař') {
      if (!formData.timeFrom || !formData.timeTo) {
        return { success: false, error: 'Vyplňte čas od a do!' };
      }
      const timeRegex = /^([01]\d|2[0-3]):[0-5]\d$/;
      if (!timeRegex.test(formData.timeFrom) || !timeRegex.test(formData.timeTo)) {
        return { success: false, error: 'Čas musí být ve formátu HH:mm (např. 08:30).' };
      }
      if (formData.timeFrom >= formData.timeTo) {
        return { success: false, error: 'Čas do musí být po čase od!' };
      }
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

    const dbData = mapAbsenceRequestToDb(newRequest);

    const supabase = createClient();
    const { error } = await supabase.from('zadosti_o_absenci').insert(dbData);
    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      absenceRequests: [...state.absenceRequests, newRequest],
      formData: { ...initialFormData },
    }));

    return { success: true };
  },

  deleteAbsenceRequest: async (requestId: string, userId: string) => {
    const { absenceRequests } = get();
    const request = absenceRequests.find((r) => r.id === requestId);

    if (!request) {
      return { success: false, error: 'Žádost nenalezena' };
    }

    if (request.userId !== userId) {
      return { success: false, error: 'Nemáte oprávnění smazat tuto žádost' };
    }

    if (request.status !== 'pending') {
      return { success: false, error: 'Lze zrušit pouze žádosti čekající na schválení' };
    }

    const supabase = createClient();
    const { error } = await supabase.from('zadosti_o_absenci').delete().eq('id', requestId);

    if (error) {
      logger.error('Failed to delete absence request');
      toast.error('Nepodařilo se zrušit žádost');
      return { success: false, error: error.message };
    }

    set((state) => ({
      absenceRequests: state.absenceRequests.filter((r) => r.id !== requestId),
    }));

    toast.success('Žádost byla zrušena');
    return { success: true };
  },

  approveAbsence: async (requestId: string, approverId: string) => {
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

    const approvedAt = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase.from('zadosti_o_absenci').update({
      stav: 'approved',
      schvalil: approverId,
      zpracovano: approvedAt,
      precteno_zamestnancem: false,
    }).eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      absenceRequests: state.absenceRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'approved' as AbsenceRequestStatus,
              approvedBy: approverId,
              approvedAt,
              seenByUser: false,
            }
          : r
      ),
    }));

    return { success: true };
  },

  rejectAbsence: async (requestId: string, approverId: string) => {
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

    const processedAt = new Date().toISOString();
    const supabase = createClient();
    const { error } = await supabase.from('zadosti_o_absenci').update({
      stav: 'rejected',
      schvalil: approverId,
      zpracovano: processedAt,
      precteno_zamestnancem: false,
    }).eq('id', requestId);

    if (error) {
      return { success: false, error: error.message };
    }

    set((state) => ({
      absenceRequests: state.absenceRequests.map((r) =>
        r.id === requestId
          ? {
              ...r,
              status: 'rejected' as AbsenceRequestStatus,
              approvedBy: approverId,
              approvedAt: processedAt,
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

  markMyRequestsAsSeen: async (userId: string) => {
    const supabase = createClient();
    const { error } = await supabase.from('zadosti_o_absenci')
      .update({ precteno_zamestnancem: true })
      .eq('id_zamestnance', userId)
      .neq('stav', 'pending');

    if (error) {
      logger.error('Failed to mark absence requests as seen');
      toast.error('Nepodařilo se označit žádosti jako přečtené');
      return;
    }

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

  // Realtime
  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();

    const channel = supabase
      .channel('absence-realtime')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'zadosti_o_absenci',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            const newRequest = mapDbToAbsenceRequest(payload.new);
            const exists = get().absenceRequests.some((r) => r.id === newRequest.id);
            if (!exists) {
              set({ absenceRequests: [...get().absenceRequests, newRequest] });
            }
          } else if (payload.eventType === 'UPDATE') {
            const updated = mapDbToAbsenceRequest(payload.new);
            set({
              absenceRequests: get().absenceRequests.map((r) =>
                r.id === updated.id ? updated : r,
              ),
            });
          } else if (payload.eventType === 'DELETE') {
            const oldId = payload.old?.id;
            if (oldId) {
              set({ absenceRequests: get().absenceRequests.filter((r) => r.id !== oldId) });
            }
          }
        },
      )
      .subscribe((status, err) => {
        if (err) logger.error(`[absence-realtime] ${status}:`, err);
        if (status === 'SUBSCRIBED' && get()._loaded) {
          get().fetchAbsenceRequests();
        }
      });

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },
}));
