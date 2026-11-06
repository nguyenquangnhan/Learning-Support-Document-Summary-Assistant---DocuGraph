import React from "react";
import { Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "../../stores/authStore";

export default function ProfileTabScreen() {
  const user = useAuthStore((state) => state.user);
  const displayName = user?.full_name?.trim() || "Minh";

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-5" edges={["top"]}>
      <Text className="text-2xl font-bold text-slate-900">Cá nhân</Text>
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
          {user?.email ? (
            <Text className="mt-0.5 text-sm text-slate-500">{user.email}</Text>
          ) : null}
        </View>
      </View>
    </SafeAreaView>
  );
}
