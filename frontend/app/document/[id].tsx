import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Volume2, Share2, ExternalLink, Code2, GitFork, HelpCircle, Users } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function DocumentSummaryScreen() {
  const router = useRouter();

  return (
    <View className="flex-1 bg-white pt-12">
      {/* Top Header Navigation */}
      <View className="px-4 flex-row items-center justify-between pb-3 border-b border-slate-100">
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>

        <View className="items-center flex-1 mx-2">
          <Text className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">TÀI LIỆU HỌC TẬP</Text>
          <Text className="text-xs font-bold text-slate-800" numberOfLines={1}>
            Tóm tắt: Hệ Điều Hành - C4
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity className="p-2 bg-indigo-50 rounded-full">
            <Volume2 size={18} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity className="p-2">
            <Share2 size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading Progress Line */}
      <View className="w-full bg-slate-100 h-1">
        <View className="bg-indigo-600 h-1 w-[45%]" />
      </View>

      {/* Main Content Body */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Chapter Header */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-indigo-600 uppercase">CHƯƠNG 04</Text>
          <Text className="text-xs text-slate-400 font-medium">45% đã đọc</Text>
        </View>

        <Text className="text-xl font-black text-slate-900 leading-tight mb-6">
          Chương 4: Quản lý Tiến trình và Khóa chết (Deadlock)
        </Text>

        {/* Section Heading */}
        <Text className="text-sm font-bold text-slate-900 mb-3">Điều kiện xảy ra Deadlock</Text>

        {/* Bullet Points */}
        <View className="space-y-3 mb-6">
          <View className="flex-row items-start">
            <Text className="text-indigo-600 font-bold mr-2 text-base">•</Text>
            <Text className="text-xs text-slate-700 leading-relaxed flex-1">
              <Text className="font-bold text-slate-900">Mutual Exclusion:</Text> Tài nguyên chỉ do một tiến trình sử dụng.
            </Text>
          </View>

          <View className="flex-row items-start">
            <Text className="text-indigo-600 font-bold mr-2 text-base">•</Text>
            <Text className="text-xs text-slate-700 leading-relaxed flex-1">
              <Text className="font-bold text-slate-900">Hold and Wait:</Text> Giữ tài nguyên và chờ tài nguyên khác.
            </Text>
          </View>

          <View className="flex-row items-start">
            <Text className="text-indigo-600 font-bold mr-2 text-base">•</Text>
            <Text className="text-xs text-slate-700 leading-relaxed flex-1">
              <Text className="font-bold text-slate-900">No Preemption:</Text> Không thể thu hồi tài nguyên cưỡng chế.
            </Text>
          </View>

          <View className="flex-row items-start">
            <Text className="text-indigo-600 font-bold mr-2 text-base">•</Text>
            <Text className="text-xs text-slate-700 leading-relaxed flex-1">
              <Text className="font-bold text-slate-900">Circular Wait:</Text> Các tiến trình chờ nhau thành vòng.
            </Text>
          </View>
        </View>

        {/* Code Snippet Box */}
        <View className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6">
          <View className="flex-row justify-between items-center mb-2 pb-2 border-b border-slate-200">
            <Text className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">SEMAPHORE</Text>
            <Code2 size={14} color="#64748B" />
          </View>

          <Text className="font-mono text-xs text-indigo-700 leading-relaxed">
            wait(S);    <Text className="text-slate-400">// chiếm tài nguyên</Text>{'\n'}
            <Text className="text-slate-400">/* vùng tới hạn */</Text>{'\n'}
            signal(S);  <Text className="text-slate-400">// giải phóng</Text>
          </Text>
        </View>

        {/* Citation Chip Badge */}
        <TouchableOpacity className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 self-start flex-row items-center mb-8">
          <Text className="text-xs font-bold text-indigo-700 mr-1.5">[Trang 24, Mục 3.2]</Text>
          <ExternalLink size={12} color="#4F46E5" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Floating Quick Actions Toolbar */}
      <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row space-x-2">
        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/graph')}
          className="flex-1 bg-indigo-50/80 py-3 rounded-2xl items-center justify-center"
        >
          <GitFork size={18} color="#4F46E5" className="mb-1" />
          <Text className="text-[11px] font-bold text-indigo-600">Vẽ Mindmap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/battle')}
          className="flex-1 py-3 rounded-2xl items-center justify-center bg-white"
        >
          <HelpCircle size={18} color="#475569" className="mb-1" />
          <Text className="text-[11px] font-bold text-slate-600">Sinh Quiz</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/(tabs)/groups')}
          className="flex-1 py-3 rounded-2xl items-center justify-center bg-white"
        >
          <Users size={18} color="#475569" className="mb-1" />
          <Text className="text-[11px] font-bold text-slate-600">Lưu vào Nhóm</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}