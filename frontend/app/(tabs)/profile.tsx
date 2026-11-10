import React from "react";
import { Pressable, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { LogIn, LogOut, ShieldCheck, UserPlus } from "lucide-react-native";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileTabScreen() {
  const router = useRouter();
  const { user, logout } = useAuthStore();
  const displayName = user?.full_name?.trim() || "Khách (Demo Mode)";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-5" edges={["top"]}>
      <Text className="text-2xl font-bold text-slate-900">Tài khoản & Bảo mật</Text>

      <View className="mt-6 flex-row items-center rounded-2xl border border-slate-200 bg-white p-4">
        <View className="mr-3 h-12 w-12 items-center justify-center rounded-full bg-blue-100">
          <Text className="text-lg font-bold text-blue-800">
            {displayName.charAt(0).toLocaleUpperCase()}
          </Text>
        </View>
        <View className="flex-1">
          <Text className="text-base font-semibold text-slate-900">
            {displayName}
          </Text>
          <Text className="mt-0.5 text-sm text-slate-500">
            {user?.email || "Chưa đăng nhập Supabase Auth"}
          </Text>
        </View>
      </View>

      <View className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-4">
        <View className="flex-row items-center gap-2">
          <ShieldCheck size={18} color="#047857" />
          <Text className="text-sm font-bold text-emerald-800">
            Supabase BaaS + Row-Level Security (RLS)
          </Text>
        </View>
        <Text className="mt-1 text-xs text-emerald-700">
          URL: https://wfibadajisvzpyezkraw.supabase.co
        </Text>
        <Text className="mt-0.5 text-xs text-emerald-700">
          Trạng thái phiên: {user ? `Đã xác thực (UID: ${user.id.slice(0, 8)}...)` : "Chế độ Khách"}
        </Text>
      </View>

      <View className="mt-6 gap-3">
        {user ? (
          <Pressable
            onPress={async () => {
              await logout();
              router.replace("/(auth)/login");
            }}
            className="flex-row items-center justify-center gap-2 rounded-xl bg-red-600 py-3.5"
          >
            <LogOut size={16} color="#FFFFFF" />
            <Text className="text-sm font-semibold text-white">Đăng xuất tài khoản</Text>
          </Pressable>
        ) : (
          <>
            <Pressable
              onPress={() => router.push("/(auth)/login")}
              className="flex-row items-center justify-center gap-2 rounded-xl bg-blue-700 py-3.5"
            >
              <LogIn size={16} color="#FFFFFF" />
              <Text className="text-sm font-semibold text-white">Mở giao diện Đăng nhập</Text>
            </Pressable>
            <Pressable
              onPress={() => router.push("/(auth)/register")}
              className="flex-row items-center justify-center gap-2 rounded-xl border border-blue-700 bg-white py-3.5"
            >
              <UserPlus size={16} color="#1D4ED8" />
              <Text className="text-sm font-semibold text-blue-700">Mở giao diện Đăng ký</Text>
            </Pressable>
          </>
        )}
      </View>
    </SafeAreaView>
  );
}
