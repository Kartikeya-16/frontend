import { create } from "zustand";
import axios from "axios";

interface BackendStatusState {
  isConnected: boolean;
  isChecking: boolean;
  apiUrl: string;
  errorMessage: string | null;
  setConnected: (connected: boolean, errorMessage?: string) => void;
  checkHealth: () => Promise<boolean>;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export const useBackendStatus = create<BackendStatusState>((set, get) => ({
  isConnected: false,
  isChecking: false,
  apiUrl: API_BASE,
  errorMessage: null,

  setConnected: (connected: boolean, errorMessage?: string) => {
    set({
      isConnected: connected,
      errorMessage: connected ? null : (errorMessage || "Unable to reach backend"),
    });
  },

  checkHealth: async () => {
    set({ isChecking: true });
    try {
      const res = await axios.get(`${get().apiUrl}/health`, { timeout: 3000 });
      const ok = res.status >= 200 && res.status < 300;
      set({
        isConnected: ok,
        isChecking: false,
        errorMessage: ok ? null : "Backend health check failed",
      });
      return ok;
    } catch (err: any) {
      set({
        isConnected: false,
        isChecking: false,
        errorMessage: err?.message || "Backend is offline",
      });
      return false;
    }
  },
}));
