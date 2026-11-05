import { create } from "zustand";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  setUser: (user) => set({ user }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
  logout: () => set({ user: null, sessionToken: null }),
}));

