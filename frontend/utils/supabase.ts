import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://wfibadajisvzpyezkraw.supabase.co";

const supabaseKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  "sb_publishable_vAtN1SySYpLS7R4xkXgK8Q_4dNqiPvm";

const isServer = typeof window === "undefined";

// Safe AsyncStorage wrapper to prevent "window is not defined" during Expo Web SSR
const ssrSafeAsyncStorage = {
  getItem: (key: string) => (isServer ? Promise.resolve(null) : AsyncStorage.getItem(key)),
  setItem: (key: string, value: string) =>
    isServer ? Promise.resolve() : AsyncStorage.setItem(key, value),
  removeItem: (key: string) =>
    isServer ? Promise.resolve() : AsyncStorage.removeItem(key),
};

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    storage: ssrSafeAsyncStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: !isServer && Platform.OS === "web",
  },
});
