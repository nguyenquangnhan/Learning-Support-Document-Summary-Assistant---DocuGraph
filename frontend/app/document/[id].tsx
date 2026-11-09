import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, ActivityIndicator, Share } from 'react-native';
import { ArrowLeft, Volume2, Share2, ExternalLink, Code2, GitFork, HelpCircle, Users, MessageSquare } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';

export default function DocumentSummaryScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [activeTab, setActiveTab] = useState<'tldr' | 'detailed'>('detailed');

  const { data: doc, isLoading, isError } = useQuery({
    queryKey: ['document', id],
    queryFn: async () => {
      if (!id || id === 'doc-123') {
        return {
          id: 'doc-123',
          title: 'Hệ Điều Hành - Chương 4: Quản lý Tiến trình',
          num_pages: 45,
          summary_tldr: 'Chương 4 tập trung vào điều kiện và thuật toán kiểm soát khóa chết (Deadlock), bao gồm Mutual Exclusion, Hold and Wait, No Preemption và Circular Wait.',
          summary_detailed: '### 1. Khái niệm Deadlock\nTình huống hai hay nhiều tiến trình bị chặn vĩnh viễn vì mỗi tiến trình đang chờ tài nguyên do tiến trình kia nắm giữ.\n\n### 2. Bốn điều kiện Coffman:\n• Mutual Exclusion: Tài nguyên chỉ do 1 tiến trình sử dụng tại 1 thời điểm.\n• Hold and Wait: Tiến trình giữ tài nguyên và chờ cấp thêm tài nguyên khác.\n• No Preemption: Tài nguyên không thể bị thu hồi cưỡng bức.\n• Circular Wait: Tồn tại chu trình chờ đợi tài nguyên khép kín.\n\n### 3. Giải pháp Semaphore:\nSử dụng biến nguyên Semaphore để đồng bộ hóa quyền truy cập tài nguyên.',
        };
      }
      const response = await api.get(`/documents/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const handleShare = async () => {
    if (doc?.title) {
      await Share.share({
        message: `Tóm tắt tài liệu: ${doc.title}\n\n${doc.summary_tldr || ''}`,
      });
    }
  };

  if (isLoading) {
    return (
      <View className="flex-1 bg-white items-center justify-center">
        <ActivityIndicator size="large" color="#4F46E5" />
        <Text className="text-slate-500 font-medium text-xs mt-3">Đang tải bản tóm tắt tri thức...</Text>
      </View>
    );
  }

  const title = doc?.title || 'Tài liệu học tập';
  const tldr = doc?.summary_tldr || 'Chưa có bản tóm tắt ngắn.';
  const detailed = doc?.summary_detailed || tldr;

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
            {title}
          </Text>
        </View>

        <View className="flex-row items-center space-x-2">
          <TouchableOpacity className="p-2 bg-indigo-50 rounded-full">
            <Volume2 size={18} color="#4F46E5" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleShare} className="p-2">
            <Share2 size={18} color="#475569" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Reading Progress Line */}
      <View className="w-full bg-slate-100 h-1">
        <View className="bg-indigo-600 h-1 w-[60%]" />
      </View>

      {/* Summary Type Switcher */}
      <View className="flex-row px-5 pt-3 pb-2 border-b border-slate-100 space-x-3">
        <TouchableOpacity
          onPress={() => setActiveTab('detailed')}
          className={`py-1.5 px-3 rounded-xl border ${
            activeTab === 'detailed'
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'detailed' ? 'text-white' : 'text-slate-600'}`}>
            Tóm tắt chi tiết
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('tldr')}
          className={`py-1.5 px-3 rounded-xl border ${
            activeTab === 'tldr'
              ? 'bg-indigo-600 border-indigo-600'
              : 'bg-slate-50 border-slate-200'
          }`}
        >
          <Text className={`text-xs font-bold ${activeTab === 'tldr' ? 'text-white' : 'text-slate-600'}`}>
            TL;DR Rút gọn
          </Text>
        </TouchableOpacity>
      </View>

      {/* Main Content Body */}
      <ScrollView className="flex-1 px-5 pt-4" showsVerticalScrollIndicator={false}>
        {/* Chapter Header */}
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-indigo-600 uppercase">
            {doc?.num_pages ? `${doc.num_pages} TRANG TÀI LIỆU` : 'TỔNG QUAN'}
          </Text>
          <Text className="text-xs text-slate-400 font-medium">Đã phân tích</Text>
        </View>

        <Text className="text-xl font-black text-slate-900 leading-tight mb-4">
          {title}
        </Text>

        {/* Summary text content */}
        <View className="bg-slate-50 border border-slate-100 rounded-2xl p-4 mb-6">
          <Text className="text-xs text-slate-700 leading-relaxed font-normal whitespace-pre-line">
            {activeTab === 'detailed' ? detailed : tldr}
          </Text>
        </View>

        {/* Citation Chip Badge */}
        <TouchableOpacity className="bg-indigo-50 border border-indigo-200 rounded-xl px-3 py-2 self-start flex-row items-center mb-8">
          <Text className="text-xs font-bold text-indigo-700 mr-1.5">[Trích dẫn trang 1 - {doc?.num_pages || 1}]</Text>
          <ExternalLink size={12} color="#4F46E5" />
        </TouchableOpacity>
      </ScrollView>

      {/* Bottom Floating Quick Actions Toolbar */}
      <View className="bg-white border-t border-slate-100 px-4 py-3 flex-row space-x-2">
        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(tabs)/graph', params: { documentId: doc?.id } })}
          className="flex-1 bg-indigo-50/80 py-3 rounded-2xl items-center justify-center"
        >
          <GitFork size={18} color="#4F46E5" className="mb-1" />
          <Text className="text-[11px] font-bold text-indigo-600">Vẽ Mindmap</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push({ pathname: '/(tabs)/chat', params: { documentId: doc?.id } })}
          className="flex-1 py-3 rounded-2xl items-center justify-center bg-indigo-600 shadow-sm"
        >
          <MessageSquare size={18} color="#FFFFFF" className="mb-1" />
          <Text className="text-[11px] font-bold text-white">Hỏi đáp AI</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={() => router.push('/battle')}
          className="flex-1 py-3 rounded-2xl items-center justify-center bg-white border border-slate-200"
        >
          <HelpCircle size={18} color="#475569" className="mb-1" />
          <Text className="text-[11px] font-bold text-slate-600">Sinh Quiz</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}