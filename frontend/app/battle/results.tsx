import React from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Award, Bookmark, RotateCcw } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function ResultsScreen() {
  const router = useRouter();

  return (
    <ScrollView className="flex-1 bg-slate-50 pt-12 p-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View>
          <Text className="text-xs text-slate-400 font-bold uppercase">ĐẦU TRÍ TRẮC NGHIỆM</Text>
          <Text className="text-base font-bold text-slate-800">Kết quả trận đấu</Text>
        </View>
        <TouchableOpacity onPress={() => router.replace('/(tabs)/groups')} className="p-1">
          <X size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Podium Vinh danh */}
      <View className="items-center my-6">
        <Text className="text-2xl font-black text-slate-900 mb-1">Trận đấu kết thúc!</Text>
        <Text className="text-xs text-slate-500 font-medium mb-6">Một trận đấu hay, cả nhóm cùng tiến bộ.</Text>

        <View className="flex-row items-end justify-center w-full px-4">
          {/* Rank 2 */}
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-emerald-500 border-2 border-white items-center justify-center mb-1">
              <Text className="text-white font-bold text-xs">M</Text>
            </View>
            <Text className="text-xs font-bold text-slate-800">Minh (Bạn)</Text>
            <Text className="text-[10px] text-slate-400 font-bold mb-2">980 pts</Text>
            <View className="w-full bg-slate-200 h-20 rounded-t-xl items-center justify-center">
              <Text className="text-lg font-black text-slate-500">2</Text>
            </View>
          </View>

          {/* Rank 1 */}
          <View className="items-center flex-1 mx-2">
            <Award size={24} color="#D97706" className="mb-1" />
            <View className="w-16 h-16 rounded-full bg-indigo-600 border-2 border-white items-center justify-center mb-1">
              <Text className="text-white font-bold text-base">T</Text>
            </View>
            <Text className="text-sm font-bold text-slate-900">Tuấn</Text>
            <Text className="text-xs text-indigo-600 font-bold mb-2">1250 pts</Text>
            <View className="w-full bg-amber-400 h-28 rounded-t-xl items-center justify-center">
              <Text className="text-2xl font-black text-white">1</Text>
            </View>
          </View>

          {/* Rank 3 */}
          <View className="items-center flex-1">
            <View className="w-12 h-12 rounded-full bg-pink-500 border-2 border-white items-center justify-center mb-1">
              <Text className="text-white font-bold text-xs">L</Text>
            </View>
            <Text className="text-xs font-bold text-slate-800">Linh</Text>
            <Text className="text-[10px] text-slate-400 font-bold mb-2">850 pts</Text>
            <View className="w-full bg-amber-100 h-16 rounded-t-xl items-center justify-center">
              <Text className="text-lg font-black text-amber-700">3</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Stats Card */}
      <View className="bg-white p-4 rounded-2xl border border-slate-200 mb-6">
        <Text className="text-sm font-bold text-indigo-600 mb-1">Thứ hạng của bạn: #2</Text>
        <Text className="text-xs text-slate-500 font-medium">Số câu đúng: 8/10 câu • Thời gian trung bình: 3.2s</Text>
      </View>

      {/* Action Buttons */}
      <TouchableOpacity className="bg-indigo-600 py-3.5 rounded-2xl flex-row items-center justify-center mb-3">
        <Bookmark size={18} color="#FFF" className="mr-2" />
        <Text className="text-white font-bold text-xs">Lưu bộ câu hỏi & Sổ tay câu sai</Text>
      </TouchableOpacity>

      <TouchableOpacity 
        onPress={() => router.push('/battle')}
        className="bg-white border border-slate-200 py-3.5 rounded-2xl flex-row items-center justify-center mb-8"
      >
        <RotateCcw size={18} color="#475569" className="mr-2" />
        <Text className="text-slate-700 font-bold text-xs">Chơi lại trận mới</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}