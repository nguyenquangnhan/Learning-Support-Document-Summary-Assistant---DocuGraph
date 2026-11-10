import { Platform } from "react-native";
import { createClient } from "@supabase/supabase-js";
import { secureStorageAdapter } from "../src/core/storage/secure_storage";

export const SUPABASE_URL =
  process.env.EXPO_PUBLIC_SUPABASE_URL ||
  "https://wfibadajisvzpyezkraw.supabase.co";

export const SUPABASE_ANON_KEY =
  process.env.EXPO_PUBLIC_SUPABASE_KEY ||
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ||
  "sb_publishable_vAtN1SySYpLS7R4xkXgK8Q_4dNqiPvm";

const isServer = typeof window === "undefined";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: secureStorageAdapter,
    autoRefreshToken: !isServer,
    persistSession: !isServer,
    detectSessionInUrl: !isServer && Platform.OS === "web",
  },
});
