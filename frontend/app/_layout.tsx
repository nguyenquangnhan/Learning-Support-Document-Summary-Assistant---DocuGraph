import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useAuthStore } from "../stores/authStore";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
  const router = useRouter();
  const segments = useSegments();
  const { user, isGuest, isLoading, initializeAuth } = useAuthStore();

  useEffect(() => {
    initializeAuth();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuthGroup = segments[0] === "(auth)";
    if (!user && !isGuest && !inAuthGroup) {
      router.replace("/(auth)/login");
    } else if (user && inAuthGroup) {
      router.replace("/(tabs)");
    }
  }, [user, isGuest, isLoading, segments]);

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerStyle: { backgroundColor: "#0F172A" },
            headerTintColor: "#F8FAFC",
            headerTitleStyle: { fontWeight: "bold" },
            contentStyle: { backgroundColor: "#0F172A" },
          }}
        >
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="document/[id]" options={{ title: "Tài liệu & Tóm tắt" }} />
          <Stack.Screen name="battle/[roomCode]" options={{ title: "Đấu trí Quiz Battle" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
