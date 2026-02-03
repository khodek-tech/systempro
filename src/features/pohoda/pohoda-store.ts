import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface PohodaCredentials {
  url: string;
  username: string;
  password: string;
  ico: string;
}

export interface PohodaConnectionStatus {
  isConnected: boolean;
  lastCheck: string | null;
  companyName: string | null;
  error: string | null;
}

export interface PohodaSklad {
  id: string;
  ids: string;
  name: string;
  text?: string;
}

interface PohodaState {
  // Credentials (persistované)
  credentials: PohodaCredentials;

  // Connection status
  connectionStatus: PohodaConnectionStatus;

  // Data
  sklady: PohodaSklad[];

  // Loading states
  isTestingConnection: boolean;
  isLoadingSklady: boolean;
  isExporting: boolean;
  isUploading: boolean;
  isGenerating: boolean;
  isGeneratingVsechnySklady: boolean;

  // Progress
  generateProgress: string | null;
  generateError: string | null;
  generateVsechnySkladyProgress: string | null;
  generateVsechnySkladyError: string | null;

  // Upload
  lastUploadedFile: string | null;

  // Navigation
  pohodaView: 'settings' | 'detail';
}

interface PohodaActions {
  setCredentials: (credentials: Partial<PohodaCredentials>) => void;
  setConnectionStatus: (status: Partial<PohodaConnectionStatus>) => void;
  setSklady: (sklady: PohodaSklad[]) => void;
  setIsTestingConnection: (loading: boolean) => void;
  setIsLoadingSklady: (loading: boolean) => void;
  setIsExporting: (loading: boolean) => void;
  setIsUploading: (loading: boolean) => void;
  setIsGenerating: (loading: boolean) => void;
  setGenerateProgress: (progress: string | null) => void;
  setGenerateError: (error: string | null) => void;
  setIsGeneratingVsechnySklady: (loading: boolean) => void;
  setGenerateVsechnySkladyProgress: (progress: string | null) => void;
  setGenerateVsechnySkladyError: (error: string | null) => void;
  setLastUploadedFile: (filename: string | null) => void;
  clearCredentials: () => void;
  setPohodaView: (view: 'settings' | 'detail') => void;
}

const defaultCredentials: PohodaCredentials = {
  url: 'http://2HSER.ipodnik.com:4444',
  username: '',
  password: '',
  ico: '',
};

const defaultConnectionStatus: PohodaConnectionStatus = {
  isConnected: false,
  lastCheck: null,
  companyName: null,
  error: null,
};

export const usePohodaStore = create<PohodaState & PohodaActions>()(
  persist(
    (set) => ({
      // Initial state
      credentials: defaultCredentials,
      connectionStatus: defaultConnectionStatus,
      sklady: [],
      isTestingConnection: false,
      isLoadingSklady: false,
      isExporting: false,
      isUploading: false,
      isGenerating: false,
      generateProgress: null,
      generateError: null,
      isGeneratingVsechnySklady: false,
      generateVsechnySkladyProgress: null,
      generateVsechnySkladyError: null,
      lastUploadedFile: null,
      pohodaView: 'settings',

      // Actions
      setCredentials: (credentials) =>
        set((state) => ({
          credentials: { ...state.credentials, ...credentials },
        })),

      setConnectionStatus: (status) =>
        set((state) => ({
          connectionStatus: { ...state.connectionStatus, ...status },
        })),

      setSklady: (sklady) => set({ sklady }),

      setIsTestingConnection: (isTestingConnection) =>
        set({ isTestingConnection }),
      setIsLoadingSklady: (isLoadingSklady) => set({ isLoadingSklady }),
      setIsExporting: (isExporting) => set({ isExporting }),
      setIsUploading: (isUploading) => set({ isUploading }),
      setIsGenerating: (isGenerating) => set({ isGenerating }),
      setGenerateProgress: (generateProgress) => set({ generateProgress }),
      setGenerateError: (generateError) => set({ generateError }),
      setIsGeneratingVsechnySklady: (isGeneratingVsechnySklady) =>
        set({ isGeneratingVsechnySklady }),
      setGenerateVsechnySkladyProgress: (generateVsechnySkladyProgress) =>
        set({ generateVsechnySkladyProgress }),
      setGenerateVsechnySkladyError: (generateVsechnySkladyError) =>
        set({ generateVsechnySkladyError }),
      setLastUploadedFile: (lastUploadedFile) => set({ lastUploadedFile }),

      clearCredentials: () =>
        set({
          credentials: defaultCredentials,
          connectionStatus: defaultConnectionStatus,
          sklady: [],
        }),

      setPohodaView: (pohodaView) => set({ pohodaView }),
    }),
    {
      name: 'pohoda-credentials',
      // Persist only credentials (not sensitive in this context as it's admin-only)
      partialize: (state) => ({
        credentials: state.credentials,
      }),
    }
  )
);
