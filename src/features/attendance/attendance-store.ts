import { create } from 'zustand';
import { WorkplaceType } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/core/stores/auth-store';
import { toast } from 'sonner';
import { logger } from '@/lib/logger';
import { formatCzechDate } from '@/shared/utils';
import type { RealtimeChannel } from '@supabase/supabase-js';

interface AttendanceState {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  requiresKasa: boolean;
  // Track all checked-in users globally (employee names who have open records today)
  checkedInUsers: Set<string>;
  // Arrival times keyed by employee fullName
  arrivalTimes: Map<string, string>;
  _loaded: boolean;
  _realtimeChannel: RealtimeChannel | null;
}

interface AttendanceActions {
  fetchTodayAttendance: () => Promise<void>;
  toggleAttendance: () => Promise<{ success: boolean; error?: string }>;
  confirmKasa: (confirmed: boolean) => void;
  setWorkplace: (type: WorkplaceType, id: string, name: string, requiresKasa: boolean) => void;
  subscribeRealtime: () => void;
  unsubscribeRealtime: () => void;
  // Global check-in tracking
  checkInUser: (userId: string) => void;
  checkOutUser: (userId: string) => void;
  isUserCheckedIn: (userId: string) => boolean;
  getAllCheckedInUsers: () => string[];
  getArrivalTime: (fullName: string) => string | null;
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>((set, get) => ({
  // Initial state
  isInWork: false,
  kasaConfirmed: false,
  workplaceType: 'role',
  workplaceId: '',
  workplaceName: '',
  requiresKasa: false,
  checkedInUsers: new Set<string>(),
  arrivalTimes: new Map<string, string>(),
  _loaded: false,
  _realtimeChannel: null,

  fetchTodayAttendance: async () => {
    const supabase = createClient();
    const today = formatCzechDate(new Date());

    const { data, error } = await supabase
      .from('dochazka')
      .select('zamestnanec, odchod, prichod')
      .eq('datum', today);

    if (error) {
      logger.error('[attendance] Failed to fetch today attendance');
      return;
    }

    // Build set of checked-in users (have arrival, no departure) and their arrival times
    const checkedIn = new Set<string>();
    const arrivals = new Map<string, string>();
    for (const row of data || []) {
      if (!row.odchod) {
        checkedIn.add(row.zamestnanec);
        if (row.prichod) {
          arrivals.set(row.zamestnanec, row.prichod);
        }
      }
    }

    // Check if the current user is checked in
    const currentUser = useAuthStore.getState().currentUser;
    const isInWork = currentUser ? checkedIn.has(currentUser.fullName) : false;

    set({ checkedInUsers: checkedIn, arrivalTimes: arrivals, isInWork, _loaded: true });
  },

  toggleAttendance: async () => {
    const { isInWork, kasaConfirmed, requiresKasa, workplaceType, workplaceId, workplaceName } = get();

    // When checking out, require kasa confirmation only if workplace requires it
    if (isInWork && requiresKasa && !kasaConfirmed) {
      return { success: false, error: 'Před odchodem potvrďte stav kasy!' };
    }

    const currentUser = useAuthStore.getState().currentUser;
    if (!currentUser) {
      return { success: false, error: 'Uživatel není přihlášen.' };
    }

    const now = new Date();
    const datum = formatCzechDate(now);
    const cas = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const supabase = createClient();

    if (!isInWork) {
      // CHECK-IN: Check for existing open record to prevent duplicates
      const { data: existing } = await supabase
        .from('dochazka')
        .select('id')
        .eq('datum', datum)
        .eq('zamestnanec', currentUser.fullName)
        .is('odchod', null)
        .limit(1);

      if (existing && existing.length > 0) {
        toast.error('Dnešní příchod již byl zaznamenán.');
        return { success: false, error: 'Příchod byl již zaznamenán.' };
      }

      // INSERT new record (DB has unique partial index preventing duplicates)
      const { error } = await supabase.from('dochazka').insert({
        datum,
        prodejna: workplaceType === 'store' ? workplaceName : null,
        typ_pracoviste: workplaceType,
        id_pracoviste: workplaceId,
        nazev_pracoviste: workplaceName,
        zamestnanec: currentUser.fullName,
        prichod: cas,
      });

      if (error) {
        // Unique constraint violation = duplicate active check-in
        if (error.code === '23505') {
          toast.error('Dnešní příchod již byl zaznamenán.');
          return { success: false, error: 'Příchod byl již zaznamenán.' };
        }
        logger.error('Failed to save check-in');
        toast.error('Nepodařilo se zaznamenat příchod.');
        return { success: false, error: 'Chyba při ukládání příchodu.' };
      }

      set({ isInWork: true, kasaConfirmed: false });
      return { success: true };
    } else {
      // CHECK-OUT: UPDATE existing record
      const { data: records, error: fetchError } = await supabase
        .from('dochazka')
        .select('id, prichod')
        .eq('datum', datum)
        .eq('zamestnanec', currentUser.fullName)
        .is('odchod', null)
        .limit(1);

      if (fetchError || !records || records.length === 0) {
        logger.error('Failed to find check-in record');
        set({ isInWork: false, kasaConfirmed: false });
        return { success: true };
      }

      const record = records[0];
      let hodiny: string | null = null;
      if (record.prichod) {
        const [pH, pM] = record.prichod.split(':').map(Number);
        const [oH, oM] = cas.split(':').map(Number);
        let diffMinutes = (oH * 60 + oM) - (pH * 60 + pM);
        if (diffMinutes < 0) diffMinutes += 24 * 60;
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        hodiny = `${hours}:${mins.toString().padStart(2, '0')}`;
      }

      const { error } = await supabase
        .from('dochazka')
        .update({ odchod: cas, hodiny })
        .eq('id', record.id);

      if (error) {
        logger.error('Failed to save check-out');
        toast.error('Nepodařilo se zaznamenat odchod.');
        return { success: false, error: 'Chyba při ukládání odchodu.' };
      }

      set({ isInWork: false, kasaConfirmed: false });
      return { success: true };
    }
  },

  confirmKasa: (confirmed) => set({ kasaConfirmed: confirmed }),

  setWorkplace: (type, id, name, requiresKasa) => {
    set({
      workplaceType: type,
      workplaceId: id,
      workplaceName: name,
      requiresKasa,
    });
  },

  subscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();

    const supabase = createClient();
    const today = formatCzechDate(new Date());

    const channel = supabase
      .channel('attendance-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'dochazka',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new;
          if (row.datum === today && !row.odchod) {
            const newSet = new Set(get().checkedInUsers);
            newSet.add(row.zamestnanec);
            const newArrivals = new Map(get().arrivalTimes);
            if (row.prichod) {
              newArrivals.set(row.zamestnanec, row.prichod);
            }
            set({ checkedInUsers: newSet, arrivalTimes: newArrivals });
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'dochazka',
        },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const row = payload.new;
          if (row.datum === today && row.odchod) {
            const newSet = new Set(get().checkedInUsers);
            newSet.delete(row.zamestnanec);
            const newArrivals = new Map(get().arrivalTimes);
            newArrivals.delete(row.zamestnanec);
            set({ checkedInUsers: newSet, arrivalTimes: newArrivals });
          }
        },
      )
      .subscribe();

    set({ _realtimeChannel: channel });
  },

  unsubscribeRealtime: () => {
    get()._realtimeChannel?.unsubscribe();
    set({ _realtimeChannel: null });
  },

  // Global check-in tracking actions
  checkInUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.checkedInUsers);
      newSet.add(userId);
      return { checkedInUsers: newSet };
    });
  },

  checkOutUser: (userId) => {
    set((state) => {
      const newSet = new Set(state.checkedInUsers);
      newSet.delete(userId);
      return { checkedInUsers: newSet };
    });
  },

  isUserCheckedIn: (userId) => {
    return get().checkedInUsers.has(userId);
  },

  getAllCheckedInUsers: () => {
    return Array.from(get().checkedInUsers);
  },

  getArrivalTime: (fullName) => {
    return get().arrivalTimes.get(fullName) ?? null;
  },
}));
