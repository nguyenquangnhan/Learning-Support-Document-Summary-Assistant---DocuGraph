import React from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { useRouter } from "expo-router";
import { Swords, Users } from "lucide-react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function BattleTabScreen() {
  const router = useRouter();

  return (
    <SafeAreaView className="flex-1 bg-slate-50 px-5 pt-5" edges={["top"]}>
      <Text className="text-2xl font-bold text-slate-900">Đấu trí</Text>
      <Text className="mt-1 text-sm text-slate-500">
        Ôn tập và thử thách kiến thức cùng bạn bè.
      </Text>

      <View className="mt-6 rounded-2xl border border-slate-200 bg-white p-5">
        <View className="mb-4 h-12 w-12 items-center justify-center rounded-xl bg-indigo-50">
          <Swords size={24} color="#2447BA" />
        </View>
        <Text className="text-base font-bold text-slate-900">
          Quiz Battle
        </Text>
        <Text className="mt-1 text-sm leading-5 text-slate-500">
          Tham gia phòng đấu trí trực tiếp và cùng bạn bè trả lời câu hỏi.
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          className="mt-5 flex-row items-center justify-center rounded-xl bg-blue-700 py-3"
          onPress={() => router.push("/battle/MATH22")}
        >
          <Users size={17} color="#FFFFFF" />
          <Text className="ml-2 text-sm font-semibold text-white">
            Vào phòng đấu
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
