import React, { useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { GitFork, HelpCircle, Users, Volume2, Share2, Bookmark, CheckCircle2, ArrowLeft } from "lucide-react-native";
import { api } from "../../lib/api";

export default function DocumentDetailScreen() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const [summaryMode, setSummaryMode] = useState<"tldr" | "detailed">("detailed");

  const { data: document, isLoading } = useQuery({
    queryKey: ["document", id],
    queryFn: async () => {
      try {
        const res = await api.get(`/documents/${id}`);
        return res.data;
      } catch (e) {
        return {
          id: id,
          title: "Giáo trình Giải tích Nâng cao - Chương 2: Phép tính Vi phân",
          num_pages: 42,
          file_type: "pdf",
          status: "ready",
          summary_tldr: "Chương này tập trung vào định nghĩa tính liên tục, đạo hàm cấp một và ứng dụng quy tắc L'Hôpital để khử dạng vô định 0/0. Định lý Weierstrass bảo đảm sự tồn tại của giá trị cực trị trên đoạn đóng.",
          summary_detailed: `### 1. Tính liên tục & Giới hạn
- **Định nghĩa:** Hàm $f(x)$ liên tục tại $x_0$ khi $\\lim_{x \\to x_0} f(x) = f(x_0)$.
- **Định lý Weierstrass:** Mọi hàm liên tục trên $[a, b]$ đều đạt GTLN và GTNN.

### 2. Đạo hàm & Ý nghĩa hình học
- Đạo hàm thể hiện vận tốc tức thời và hệ số góc của tiếp tuyến:
  $$f'(x) = \\lim_{h \\to 0} \\frac{f(x+h) - f(x)}{h}$$

### 3. Quy tắc L'Hôpital
- Khử dạng vô định: khi $\\lim \\frac{f(x)}{g(x)} = \\frac{0}{0}$ hoặc $\\frac{\\infty}{\\infty}$, ta có:
  $$\\lim \\frac{f(x)}{g(x)} = \\lim \\frac{f'(x)}{g'(x)}$$
`,
        };
      }
    },
  });

  if (isLoading) {
    return (
      <View className="flex-1 bg-slate-900 justify-center items-center">
        <ActivityIndicator size="large" color="#6366F1" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-slate-900">
      <ScrollView className="flex-1 px-4 pt-4">
        {/* Document Title Header */}
        <View className="mb-4">
          <Text className="text-xl font-bold text-white leading-snug">{document?.title}</Text>
          <View className="flex-row items-center mt-2 space-x-2">
            <View className="bg-indigo-500/20 px-2 py-0.5 rounded">
              <Text className="text-indigo-400 text-xs font-semibold">{document?.num_pages} trang</Text>
            </View>
            <View className="bg-emerald-500/20 px-2 py-0.5 rounded ml-2">
              <Text className="text-emerald-400 text-xs font-semibold">Đã lập Đồ thị Tri thức</Text>
            </View>
          </View>
        </View>

        {/* Mode Switcher: TL;DR vs Detailed */}
        <View className="flex-row bg-slate-800 p-1 rounded-xl mb-4 border border-slate-700">
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${summaryMode === "tldr" ? "bg-indigo-600" : ""}`}
            onPress={() => setSummaryMode("tldr")}
          >
            <Text className={`text-xs font-semibold ${summaryMode === "tldr" ? "text-white" : "text-slate-400"}`}>
              Tóm tắt nhanh (TL;DR)
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`flex-1 py-2 rounded-lg items-center ${summaryMode === "detailed" ? "bg-indigo-600" : ""}`}
            onPress={() => setSummaryMode("detailed")}
          >
            <Text className={`text-xs font-semibold ${summaryMode === "detailed" ? "text-white" : "text-slate-400"}`}>
              Tóm tắt chi tiết (Bullet Points)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Audio Listen & Share Bar */}
        <View className="flex-row justify-between items-center bg-slate-800/60 p-3 rounded-xl mb-5 border border-slate-700/60">
          <TouchableOpacity className="flex-row items-center">
            <Volume2 size={16} color="#818CF8" />
            <Text className="text-indigo-300 text-xs font-medium ml-1.5">Nghe tóm tắt Audio (TTS)</Text>
          </TouchableOpacity>
          <View className="flex-row space-x-3">
            <TouchableOpacity className="mr-3">
              <Share2 size={16} color="#94A3B8" />
            </TouchableOpacity>
            <TouchableOpacity>
              <Bookmark size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Summary Content Body */}
        <View className="bg-slate-800/90 border border-slate-700 p-5 rounded-2xl mb-8">
          <Text className="text-slate-200 text-sm leading-relaxed">
            {summaryMode === "tldr" ? document?.summary_tldr : document?.summary_detailed}
          </Text>
        </View>
      </ScrollView>

      {/* Floating Action Bar: Mindmap, Quiz, Save Group */}
      <View className="p-4 bg-slate-800/95 border-t border-slate-700 flex-row space-x-2">
        <TouchableOpacity
          className="flex-1 bg-indigo-600 py-3 px-2 rounded-xl flex-row justify-center items-center mr-2 active:opacity-80"
          onPress={() => router.push({ pathname: "/(tabs)/graph", params: { docId: document?.id } })}
        >
          <GitFork size={16} color="#FFFFFF" />
          <Text className="text-white text-xs font-bold ml-1.5">Vẽ Mindmap</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-slate-700 py-3 px-2 rounded-xl flex-row justify-center items-center mr-2 active:opacity-80"
          onPress={() => router.push(`/battle/room?docId=${document?.id}`)}
        >
          <HelpCircle size={16} color="#34D399" />
          <Text className="text-emerald-300 text-xs font-bold ml-1.5">Sinh Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="flex-1 bg-slate-700 py-3 px-2 rounded-xl flex-row justify-center items-center active:opacity-80"
          onPress={() => router.push("/(tabs)/groups")}
        >
          <Users size={16} color="#818CF8" />
          <Text className="text-indigo-300 text-xs font-bold ml-1.5">Lưu vào Nhóm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

