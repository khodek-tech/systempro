import { create } from 'zustand';
import { WorkplaceType } from '@/shared/types';
import { createClient } from '@/lib/supabase/client';
import { useAuthStore } from '@/core/stores/auth-store';
import { toast } from 'sonner';

interface AttendanceState {
  isInWork: boolean;
  kasaConfirmed: boolean;
  workplaceType: WorkplaceType;
  workplaceId: string;
  workplaceName: string;
  requiresKasa: boolean;
  // Track all checked-in users globally (user IDs)
  checkedInUsers: Set<string>;
}

interface AttendanceActions {
  // Actions
  toggleAttendance: () => Promise<{ success: boolean; error?: string }>;
  confirmKasa: (confirmed: boolean) => void;
  setWorkplace: (type: WorkplaceType, id: string, name: string, requiresKasa: boolean) => void;
  // Global check-in tracking
  checkInUser: (userId: string) => void;
  checkOutUser: (userId: string) => void;
  isUserCheckedIn: (userId: string) => boolean;
  getAllCheckedInUsers: () => string[];
}

export const useAttendanceStore = create<AttendanceState & AttendanceActions>((set, get) => ({
  // Initial state - empty values, will be set after auth-store hydration
  isInWork: false,
  kasaConfirmed: false,
  workplaceType: 'role',
  workplaceId: '',
  workplaceName: '',
  requiresKasa: false,
  checkedInUsers: new Set<string>(),

  // Actions
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
    const datum = `${now.getDate()}. ${now.getMonth() + 1}. ${now.getFullYear()}`;
    const cas = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const supabase = createClient();

    if (!isInWork) {
      // CHECK-IN: INSERT new record
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
        console.error('Failed to save check-in:', error);
        toast.error('Nepodařilo se zaznamenat příchod.');
        return { success: false, error: 'Chyba při ukládání příchodu.' };
      }

      set({ isInWork: true, kasaConfirmed: false });
      return { success: true };
    } else {
      // CHECK-OUT: UPDATE existing record
      // Find today's record with no odchod
      const { data: records, error: fetchError } = await supabase
        .from('dochazka')
        .select('id, prichod')
        .eq('datum', datum)
        .eq('zamestnanec', currentUser.fullName)
        .is('odchod', null)
        .limit(1);

      if (fetchError || !records || records.length === 0) {
        console.error('Failed to find check-in record:', fetchError);
        // Still allow local state change — record may have been created in a previous session
        set({ isInWork: false, kasaConfirmed: false });
        return { success: true };
      }

      const record = records[0];
      // Calculate hours worked
      let hodiny: string | null = null;
      if (record.prichod) {
        const [pH, pM] = record.prichod.split(':').map(Number);
        const [oH, oM] = cas.split(':').map(Number);
        const diffMinutes = (oH * 60 + oM) - (pH * 60 + pM);
        const hours = Math.floor(diffMinutes / 60);
        const mins = diffMinutes % 60;
        hodiny = `${hours}:${mins.toString().padStart(2, '0')}`;
      }

      const { error } = await supabase
        .from('dochazka')
        .update({ odchod: cas, hodiny })
        .eq('id', record.id);

      if (error) {
        console.error('Failed to save check-out:', error);
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
}));
