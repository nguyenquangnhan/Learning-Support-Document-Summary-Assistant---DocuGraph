import { create } from "zustand";
import AsyncStorage from "@react-native-async-storage/async-storage";

const THEME_CACHE_KEY = "@docugraph/theme_mode_v1";
const isServer = typeof window === "undefined";

interface ThemeState {
  isDarkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (dark: boolean) => void;
  initializeTheme: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDarkMode: false,
  toggleDarkMode: () => {
    const next = !get().isDarkMode;
    set({ isDarkMode: next });
    if (!isServer) {
      AsyncStorage.setItem(THEME_CACHE_KEY, next ? "dark" : "light").catch(() => {});
    }
  },
  setDarkMode: (dark) => {
    set({ isDarkMode: dark });
    if (!isServer) {
      AsyncStorage.setItem(THEME_CACHE_KEY, dark ? "dark" : "light").catch(() => {});
    }
  },
  initializeTheme: async () => {
    try {
      if (!isServer) {
        const saved = await AsyncStorage.getItem(THEME_CACHE_KEY);
        if (saved === "dark" || saved === "light") {
          set({ isDarkMode: saved === "dark" });
        }
      }
    } catch {
      // ignore
    }
  },
}));

