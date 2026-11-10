/**
 * DocuGraph AI – Hardware-Backed Secure Storage Adapter
 * Course Alignment: Week 10 (Mobile Security Best Practices: iOS Keychain / Android Keystore)
 * Uses expo-secure-store on Native iOS/Android, with SSR-safe AsyncStorage fallback on Web.
 */
import { Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as SecureStore from "expo-secure-store";

const isServer = typeof window === "undefined";

export const secureStorageAdapter = {
  getItem: async (key: string): Promise<string | null> => {
    if (isServer) return null;
    if (Platform.OS !== "web") {
      try {
        return await SecureStore.getItemAsync(key);
      } catch {
        return AsyncStorage.getItem(key);
      }
    }
    return AsyncStorage.getItem(key);
  },

  setItem: async (key: string, value: string): Promise<void> => {
    if (isServer) return;
    if (Platform.OS !== "web") {
      try {
        await SecureStore.setItemAsync(key, value);
        return;
      } catch {
        // Fallback if payload > 2048 bytes limit on older Android Keystore
        await AsyncStorage.setItem(key, value);
        return;
      }
    }
    await AsyncStorage.setItem(key, value);
  },

  removeItem: async (key: string): Promise<void> => {
    if (isServer) return;
    if (Platform.OS !== "web") {
      try {
        await SecureStore.deleteItemAsync(key);
        return;
      } catch {
        await AsyncStorage.removeItem(key);
        return;
      }
    }
    await AsyncStorage.removeItem(key);
  },
};

