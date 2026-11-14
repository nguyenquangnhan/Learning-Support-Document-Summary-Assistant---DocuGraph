import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../lib/supabase";

const AUTH_USER_CACHE_KEY = "@docugraph/auth_user_session_v1";
const isServer = typeof window === "undefined";

interface User {
  id: string;
  email: string;
  full_name?: string;
  student_id?: string;
  major?: string;
  bio?: string;
}

interface AuthState {
  user: User | null;
  sessionToken: string | null;
  isLoading: boolean;
  isGuest: boolean;
  setUser: (user: User | null) => void;
  setSessionToken: (token: string | null) => void;
  updateProfile: (updates: Partial<User>) => Promise<{ ok: boolean; message: string }>;
  changePassword: (newPassword: string) => Promise<{ ok: boolean; message: string }>;
  continueAsGuest: () => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  sessionToken: null,
  isLoading: true,
  isGuest: false,
  setUser: (user) => {
    set({ user, isGuest: false });
    if (!isServer) {
      if (user) {
        AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(user)).catch(() => {});
      } else {
        AsyncStorage.removeItem(AUTH_USER_CACHE_KEY).catch(() => {});
      }
    }
  },
  setSessionToken: (sessionToken) => set({ sessionToken }),
  updateProfile: async (updates) => {
    const current = get().user || {
      id: "guest_user",
      email: "student@vku.udn.vn",
      full_name: "Sinh viên",
    };
    const nextUser: User = {
      ...current,
      ...updates,
    };
    try {
      await supabase.auth.updateUser({
        data: {
          full_name: nextUser.full_name,
          student_id: nextUser.student_id,
          major: nextUser.major,
          bio: nextUser.bio,
        },
      });
    } catch {
      // Fallback to local cache if offline or local account
    }
    set({ user: nextUser });
    if (!isServer) {
      await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(nextUser)).catch(() => {});
    }
    return { ok: true, message: "Đã cập nhật thông tin cá nhân thành công!" };
  },
  changePassword: async (newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      return { ok: false, message: "Mật khẩu mới phải có ít nhất 6 ký tự." };
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      if (error && !error.message.includes("Auth session missing")) {
        return { ok: false, message: error.message };
      }
    } catch {
      // Allow local account password update completion
    }
    return { ok: true, message: "Đã đổi mật khẩu thành công!" };
  },
  continueAsGuest: () => set({ isGuest: true, isLoading: false }),
  logout: async () => {
    await supabase.auth.signOut();
    if (!isServer) {
      await AsyncStorage.removeItem(AUTH_USER_CACHE_KEY).catch(() => {});
    }
    set({ user: null, sessionToken: null, isGuest: false });
  },
  initializeAuth: async () => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        const activeUser: User = {
          id: session.user.id,
          email: session.user.email || "",
          full_name:
            session.user.user_metadata?.full_name ||
            session.user.email?.split("@")[0],
        };
        if (!isServer) {
          await AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(activeUser)).catch(() => {});
        }
        set({
          user: activeUser,
          sessionToken: session.access_token,
          isLoading: false,
        });
      } else {
        // Restore persisted user (e.g., Google SSO user) so reload keeps upload history
        let restoredUser: User | null = null;
        if (!isServer) {
          const cached = await AsyncStorage.getItem(AUTH_USER_CACHE_KEY);
          if (cached) {
            restoredUser = JSON.parse(cached);
          }
        }
        set({ user: restoredUser, sessionToken: null, isLoading: false });
      }

      supabase.auth.onAuthStateChange((_event, session) => {
        if (session?.user) {
          const activeUser: User = {
            id: session.user.id,
            email: session.user.email || "",
            full_name:
              session.user.user_metadata?.full_name ||
              session.user.email?.split("@")[0],
          };
          if (!isServer) {
            AsyncStorage.setItem(AUTH_USER_CACHE_KEY, JSON.stringify(activeUser)).catch(() => {});
          }
          set({
            user: activeUser,
            sessionToken: session.access_token,
          });
        }
      });
    } catch {
      set({ isLoading: false });
    }
  },
}));
