import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, TextInput, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { Camera, Upload, Search, FileText, CheckCircle2, Clock, Wifi, HardDrive } from "lucide-react-native";
import { api } from "../../lib/api";

export default function HomeScreen() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");

  const { data: documents = [], isLoading, refetch } = useQuery({
    queryKey: ["documents"],
    queryFn: async () => {
      try {
        const res = await api.get("/documents");
        return res.data;
      } catch (e) {
        return [];
      }
    },
  });

  const filteredDocs = documents.filter((d: any) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <ScrollView className="flex-1 bg-slate-900 px-4 pt-4">
      {/* Top Banner: Greeting & Offline Info */}
      <View className="bg-slate-800 p-4 rounded-2xl mb-5 border border-slate-700">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xl font-bold text-slate-100">Chào Minh 👋</Text>
          <View className="flex-row items-center space-x-2">
            <View className="flex-row items-center bg-emerald-500/10 px-2 py-1 rounded-full">
              <Wifi size={14} color="#10B981" />
              <Text className="text-emerald-400 text-xs ml-1">Trực tuyến</Text>
            </View>
          </View>
        </View>
        <Text className="text-slate-400 text-sm">
          Sẵn sàng khám phá Đồ thị Tri thức và ôn tập hôm nay chưa?
        </Text>
        <View className="flex-row items-center mt-3 pt-3 border-t border-slate-700/60">
          <HardDrive size={14} color="#94A3B8" />
          <Text className="text-slate-400 text-xs ml-1.5">
            Dung lượng ngoại tuyến: 24.5 MB đã lưu (IndexedDB / SQLite)
          </Text>
        </View>
      </View>

      {/* Quick Action Buttons */}
      <View className="flex-row space-x-3 mb-6">
        <TouchableOpacity
          className="flex-1 bg-indigo-600 p-4 rounded-xl flex-row items-center justify-center space-x-2 active:opacity-80"
          onPress={() => router.push("/document/new")}
        >
          <Upload size={20} color="#FFFFFF" />
          <Text className="text-white font-semibold ml-2">Tải PDF/DOCX</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-slate-800 border border-indigo-500/30 p-4 rounded-xl flex-row items-center justify-center space-x-2 active:opacity-80"
          onPress={() => router.push("/document/scan")}
        >
          <Camera size={20} color="#818CF8" />
          <Text className="text-indigo-300 font-semibold ml-2">Quét OCR</Text>
        </TouchableOpacity>
      </View>

      {/* Search Input */}
      <View className="flex-row items-center bg-slate-800 border border-slate-700 rounded-xl px-3 py-2.5 mb-5">
        <Search size={18} color="#94A3B8" />
        <TextInput
          placeholder="Tìm giáo trình, slide bài giảng..."
          placeholderTextColor="#64748B"
          className="flex-1 text-slate-100 ml-2 text-sm"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Recent Documents Header */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-base font-bold text-slate-200">Tài liệu gần đây</Text>
        <TouchableOpacity onPress={() => refetch()}>
          <Text className="text-indigo-400 text-xs">Làm mới</Text>
        </TouchableOpacity>
      </View>

      {/* Documents List */}
      {isLoading ? (
        <ActivityIndicator size="small" color="#6366F1" className="py-6" />
      ) : filteredDocs.length === 0 ? (
        <View className="bg-slate-800/40 border border-dashed border-slate-700 p-8 rounded-2xl items-center justify-center mb-10">
          <FileText size={40} color="#64748B" />
          <Text className="text-slate-400 text-sm mt-3 text-center">
            Chưa có tài liệu nào. Tải lên giáo trình để tạo Đồ thị Tri thức đầu tiên!
          </Text>
        </View>
      ) : (
        <View className="space-y-3 mb-10">
          {filteredDocs.map((doc: any) => (
            <TouchableOpacity
              key={doc.id}
              className="bg-slate-800 border border-slate-700/80 p-4 rounded-xl active:bg-slate-750"
              onPress={() => router.push(`/document/${doc.id}`)}
            >
              <View className="flex-row items-start justify-between">
                <View className="flex-row items-start flex-1 mr-3">
                  <View className="bg-indigo-500/10 p-2.5 rounded-lg mr-3">
                    <FileText size={20} color="#6366F1" />
                  </View>
                  <View className="flex-1">
                    <Text className="text-slate-100 font-semibold text-sm" numberOfLines={1}>
                      {doc.title}
                    </Text>
                    <View className="flex-row items-center mt-1 space-x-2">
                      <Clock size={12} color="#64748B" />
                      <Text className="text-slate-400 text-xs ml-1">
                        {doc.num_pages} trang • {doc.file_type.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Status Badge */}
                <View className="flex-row items-center bg-emerald-500/10 px-2 py-0.5 rounded">
                  <CheckCircle2 size={12} color="#10B981" />
                  <Text className="text-emerald-400 text-xs ml-1 font-medium">Sẵn sàng</Text>
                </View>
              </View>

              {/* Feature Badges */}
              <View className="flex-row items-center mt-3 pt-3 border-t border-slate-700/50 space-x-2">
                <View className="bg-slate-700 px-2 py-0.5 rounded">
                  <Text className="text-slate-300 text-[10px]">OCR Tiếng Việt</Text>
                </View>
                <View className="bg-slate-700 px-2 py-0.5 rounded">
                  <Text className="text-indigo-300 text-[10px]">Mindmap</Text>
                </View>
                <View className="bg-slate-700 px-2 py-0.5 rounded">
                  <Text className="text-emerald-300 text-[10px]">Quiz Auto</Text>
                </View>
                <View className="bg-slate-700 px-2 py-0.5 rounded">
                  <Text className="text-amber-300 text-[10px]">Offline</Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

