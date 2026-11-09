import { create } from "zustand";
import { supabase } from "../lib/supabase";

interface User {
  id: string;
  email: string;
  full_name?: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  sessionToken: null,
  isLoading: true,
  setUser: (user) => set({ user }),
  setSessionToken: (sessionToken) => set({ sessionToken }),
  logout: async () => {
    await supabase.auth.signOut();
    set({ user: null, sessionToken: null });
  },
  initializeAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        set({
          user: {
            id: session.user.id,
            email: session.user.email || "",
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0],
          },
          sessionToken: session.access_token,
          isLoading: false,
        });
      } else {
        set({ user: null, sessionToken: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          set({
            user: {
              id: session.user.id,
              email: session.user.email || "",
              full_name:
                session.user.user_metadata?.full_name ||
                session.user.email?.split("@")[0],
            },
            sessionToken: session.access_token,
          });
        } else {
          set({ user: null, sessionToken: null });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
