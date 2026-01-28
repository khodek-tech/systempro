import { create } from 'zustand';
import { AbsenceType, AbsenceFormData } from '@/types';

interface AbsenceState {
  formData: AbsenceFormData;
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
}

const initialFormData: AbsenceFormData = {
  type: 'Dovolená',
  dateFrom: '',
  dateTo: '',
  timeFrom: '',
  timeTo: '',
  note: '',
};

export const useAbsenceStore = create<AbsenceState & AbsenceActions>((set, get) => ({
  // Initial state
  formData: { ...initialFormData },

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

    // Reset form after successful submission
    set({ formData: { ...initialFormData } });

    return { success: true };
  },

  resetForm: () => set({ formData: { ...initialFormData } }),
}));
