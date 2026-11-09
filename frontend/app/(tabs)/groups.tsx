import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Copy, UserPlus, FileText, CheckCircle, Eye, GitFork, Download, Upload, Swords } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function GroupScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-slate-50 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center justify-between pb-3">
        <TouchableOpacity className="p-1">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <View className="items-center">
          <Text className="text-xs text-slate-400 font-semibold uppercase">KHÔNG GIAN HỌC CHUNG</Text>
          <Text className="text-base font-bold text-slate-800">Nhóm học tập</Text>
        </View>
        <View className="w-6" />
      </View>

      <View className="p-4">
        {/* Title & Group Info */}
        <Text className="text-2xl font-black text-slate-900 mb-3">Ôn thi Hệ Điều Hành - Nhóm 23SE</Text>
        
        <View className="flex-row items-center justify-between mb-4">
          <View className="flex-row items-center bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-200">
            <Text className="text-indigo-700 font-bold text-xs mr-2">Mã nhóm: VKU23S</Text>
            <Copy size={14} color="#4F46E5" />
          </View>
          <Text className="text-xs text-slate-400 font-medium">Nhóm riêng tư</Text>
        </View>

        {/* Members */}
        <View className="flex-row items-center justify-between mb-6 bg-white p-3 rounded-2xl border border-slate-200">
          <View className="flex-row items-center">
            <View className="flex-row -space-x-2 mr-3">
              <View className="w-8 h-8 rounded-full bg-indigo-500 border-2 border-white items-center justify-center">
                <Text className="text-white text-xs font-bold">M</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-emerald-500 border-2 border-white items-center justify-center">
                <Text className="text-white text-xs font-bold">T</Text>
              </View>
              <View className="w-8 h-8 rounded-full bg-slate-700 border-2 border-white items-center justify-center">
                <Text className="text-white text-xs font-bold">+9</Text>
              </View>
            </View>
            <Text className="text-xs text-slate-600 font-medium">12 thành viên</Text>
          </View>
          <TouchableOpacity className="flex-row items-center">
            <UserPlus size={14} color="#2563EB" className="mr-1" />
            <Text className="text-xs text-blue-600 font-bold">+ Thêm bạn</Text>
          </TouchableOpacity>
        </View>

        {/* Resources Card */}
        <Text className="text-sm font-bold text-slate-800 mb-2">Kho tài nguyên chung</Text>
        <Text className="text-xs text-slate-400 mb-3">(Xử lý 1 lần - Zero Token)</Text>

        <View className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-6">
          <View className="flex-row items-center mb-3">
            <View className="p-2 bg-red-50 rounded-xl mr-3">
              <FileText size={24} color="#EF4444" />
            </View>
            <View className="flex-1">
              <Text className="font-bold text-slate-800 text-sm">Slide Kien Truc May Tinh - Chuong 2</Text>
              <Text className="text-xs text-slate-400">Minh (Trưởng nhóm)</Text>
            </View>
          </View>

          <View className="flex-row items-center bg-emerald-50 p-2 rounded-xl mb-4">
            <CheckCircle size={14} color="#059669" className="mr-1.5" />
            <Text className="text-xs text-emerald-700 font-bold">AI Processed - Sẵn sàng</Text>
          </View>

          <View className="flex-row space-x-2 mb-3">
            <TouchableOpacity className="flex-1 bg-indigo-50 py-2.5 rounded-xl flex-row items-center justify-center border border-indigo-100">
              <Eye size={14} color="#4F46E5" className="mr-1.5" />
              <Text className="text-indigo-600 font-bold text-xs">Xem Tóm tắt</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-indigo-50 py-2.5 rounded-xl flex-row items-center justify-center border border-indigo-100">
              <GitFork size={14} color="#4F46E5" className="mr-1.5" />
              <Text className="text-indigo-600 font-bold text-xs">Xem Mindmap</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity className="py-2.5 items-center flex-row justify-center">
            <Download size={14} color="#64748B" className="mr-1.5" />
            <Text className="text-xs text-slate-500 font-medium">Lưu về máy học offline</Text>
          </TouchableOpacity>
        </View>

        {/* Upload Button */}
        <TouchableOpacity className="border-2 border-dashed border-indigo-200 bg-indigo-50/50 p-4 rounded-2xl flex-row items-center justify-center mb-6">
          <Upload size={18} color="#4F46E5" className="mr-2" />
          <Text className="text-indigo-600 font-bold text-xs">Tải tài liệu mới lên nhóm</Text>
        </TouchableOpacity>

        {/* Action Battle Room */}
        <TouchableOpacity 
          onPress={() => router.push('/battle')}
          className="bg-indigo-600 py-4 rounded-2xl flex-row items-center justify-center shadow-md shadow-indigo-200"
        >
          <Swords size={20} color="#FFF" className="mr-2" />
          <Text className="text-white font-bold text-sm">Tạo phòng Đấu trí Trắc nghiệm nhóm</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}