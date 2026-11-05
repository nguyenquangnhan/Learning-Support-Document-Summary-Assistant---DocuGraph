import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Users, Plus, KeyRound, Swords, FileText, CheckCircle2 } from "lucide-react-native";

export default function GroupsScreen() {
  const router = useRouter();
  const [pinInput, setPinInput] = useState("");

  const groups = [
    {
      id: "g1",
      name: "Nhóm Giải tích 1 - K22",
      group_code: "MATH22",
      members_count: 5,
      documents_count: 3,
      description: "Kho bài tập và tóm tắt công thức thi giữa kỳ",
    },
    {
      id: "g2",
      name: "Cơ sở dữ liệu & Neo4j",
      group_code: "DB2026",
      members_count: 8,
      documents_count: 5,
      description: "Thực hành thiết kế lược đồ quan hệ và đồ thị",
    },
  ];

  return (
    <ScrollView className="flex-1 bg-slate-900 p-4">
      {/* Join via PIN 6 chars */}
      <View className="bg-slate-800 p-4 rounded-2xl mb-6 border border-slate-700">
        <Text className="text-base font-bold text-white mb-1">Gia nhập nhóm học tập</Text>
        <Text className="text-slate-400 text-xs mb-3">
          Nhập mã PIN 6 ký tự được trưởng nhóm chia sẻ để mở kho học liệu Zero-Token.
        </Text>

        <View className="flex-row space-x-2">
          <View className="flex-1 flex-row items-center bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 mr-2">
            <KeyRound size={16} color="#818CF8" />
            <TextInput
              placeholder="MÃ PIN 6 SỐ"
              placeholderTextColor="#64748B"
              className="flex-1 text-white text-sm font-bold ml-2 tracking-widest uppercase"
              maxLength={6}
              value={pinInput}
              onChangeText={setPinInput}
            />
          </View>
          <TouchableOpacity className="bg-indigo-600 px-4 py-2.5 rounded-xl justify-center items-center">
            <Text className="text-white text-xs font-semibold">Gia nhập</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Quick Launch Quiz Battle */}
      <TouchableOpacity
        className="bg-gradient-to-r from-violet-600 to-indigo-600 p-4 rounded-2xl mb-6 flex-row items-center justify-between border border-indigo-500/40"
        onPress={() => router.push("/battle/MATH22")}
      >
        <View className="flex-row items-center flex-1 mr-2">
          <View className="bg-white/20 p-3 rounded-xl mr-3">
            <Swords size={24} color="#FFFFFF" />
          </View>
          <View className="flex-1">
            <Text className="text-white font-bold text-sm">Phòng Đấu trí Trắc nghiệm (Quiz Battle)</Text>
            <Text className="text-indigo-200 text-xs mt-0.5">
              Thi đấu trực tiếp nhiều người, đồng hồ 10s/câu & bảng xếp hạng live!
            </Text>
          </View>
        </View>
      </TouchableOpacity>

      {/* Groups List */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-white">Nhóm của bạn</Text>
        <TouchableOpacity className="flex-row items-center">
          <Plus size={14} color="#818CF8" />
          <Text className="text-indigo-400 text-xs font-semibold ml-1">Tạo nhóm mới</Text>
        </TouchableOpacity>
      </View>

      <View className="space-y-3 mb-10">
        {groups.map((group) => (
          <View key={group.id} className="bg-slate-800 p-4 rounded-xl border border-slate-700 mb-3">
            <View className="flex-row justify-between items-start">
              <View className="flex-1 mr-2">
                <Text className="text-white font-semibold text-sm">{group.name}</Text>
                <Text className="text-slate-400 text-xs mt-1">{group.description}</Text>
              </View>
              <View className="bg-slate-700/80 px-2.5 py-1 rounded-md">
                <Text className="text-indigo-300 font-mono text-xs font-bold">{group.group_code}</Text>
              </View>
            </View>

            {/* Zero token shared notice */}
            <View className="mt-3 pt-3 border-t border-slate-700/60 flex-row justify-between items-center">
              <View className="flex-row items-center">
                <Users size={14} color="#94A3B8" />
                <Text className="text-slate-400 text-xs ml-1.5">{group.members_count} thành viên</Text>
                <FileText size={14} color="#94A3B8" className="ml-3" />
                <Text className="text-slate-400 text-xs ml-1.5">{group.documents_count} tài liệu</Text>
              </View>
              <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded">
                <CheckCircle2 size={12} color="#10B981" />
                <Text className="text-emerald-400 text-[10px] ml-1 font-medium">Zero-Token</Text>
              </View>
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

