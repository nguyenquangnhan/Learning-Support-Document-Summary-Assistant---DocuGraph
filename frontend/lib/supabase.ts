import { createClient } from "@supabase/supabase-js";
import AsyncStorage from "@react-native-async-storage/async-storage";

const supabaseUrl =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://wfibadajisvzpyezkraw.supabase.co";

const supabaseAnonKey =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_vAtN1SySYpLS7R4xkXgK8Q_4dNqiPvm";

// SSR-safe storage adapter for Expo Router on Web/Node
const isServer = typeof window === "undefined";

const safeStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) return null;
    return AsyncStorage.getItem(key);
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) return;
    return AsyncStorage.setItem(key, value);
  },
  removeItem: async (key: string): Promise<void> => {
    if (isServer) return;
    return AsyncStorage.removeItem(key);
  },
};

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: safeStorage,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: false,
  },
});
