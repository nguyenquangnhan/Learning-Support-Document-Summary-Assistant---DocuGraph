import axios from "axios";

// Default to backend port 8000 (configurable via EXPO_PUBLIC_API_URL)
const API_URL = process.env.EXPO_PUBLIC_API_URL || "http://10.0.2.2:8000"; // 10.0.2.2 for Android emulator, localhost for iOS simulator

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
  headers: {
    "Content-Type": "application/json",
  },
});

