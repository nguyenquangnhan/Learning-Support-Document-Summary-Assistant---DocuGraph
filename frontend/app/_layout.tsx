import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import "../global.css";

const queryClient = new QueryClient();

export default function RootLayout() {
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
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)/login" options={{ title: "Đăng nhập", headerShown: false }} />
          <Stack.Screen name="(auth)/register" options={{ title: "Đăng ký", headerShown: false }} />
          <Stack.Screen name="(auth)/forgot-password" options={{ title: "Quên mật khẩu" }} />
          <Stack.Screen name="(auth)/verify-otp" options={{ title: "Xác thực OTP" }} />
          <Stack.Screen name="document/[id]" options={{ title: "Tài liệu & Tóm tắt" }} />
          <Stack.Screen name="battle/[roomCode]" options={{ title: "Đấu trí Quiz Battle" }} />
        </Stack>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}

