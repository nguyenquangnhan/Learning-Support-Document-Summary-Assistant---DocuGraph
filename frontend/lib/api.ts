import axios from "axios";
import { Platform } from "react-native";
import { useAuthStore } from "../stores/authStore";

const defaultUrl =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";

const rawApiUrl = (process.env.EXPO_PUBLIC_API_URL || defaultUrl).replace(/\/+$/, "");
const baseURL = rawApiUrl.endsWith("/api/v1") ? rawApiUrl : `${rawApiUrl}/api/v1`;

export const api = axios.create({
  baseURL,
  timeout: 15000,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const { sessionToken, user } = useAuthStore.getState();
  if (sessionToken) {
    config.headers.Authorization = `Bearer ${sessionToken}`;
  }
  if (user?.id) {
    config.headers["X-User-Id"] = user.id;
  }
  return config;
});

export default api;
