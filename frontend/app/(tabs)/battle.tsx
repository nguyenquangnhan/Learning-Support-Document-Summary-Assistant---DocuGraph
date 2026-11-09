import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { X, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';

export default function BattleScreen() {
  const router = useRouter();
  const [selectedOption, setSelectedOption] = useState<number | null>(2);

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center justify-between pb-2">
        <View>
          <Text className="text-xs text-slate-400 font-bold uppercase">ĐẦU TRÍ TRẮC NGHIỆM</Text>
          <Text className="text-sm font-bold text-slate-800">Hệ Điều Hành</Text>
        </View>
        <TouchableOpacity onPress={() => router.back()} className="p-1">
          <X size={20} color="#64748B" />
        </TouchableOpacity>
      </View>

      {/* Room Status */}
      <View className="px-4 flex-row justify-between items-center mb-4">
        <Text className="text-xs font-bold text-indigo-600">PIN: 8392</Text>
        <Text className="text-xs text-emerald-600 font-medium">● 12/20 Đang thi đấu</Text>
      </View>

      {/* Timer Semi-Circle */}
      <View className="items-center mb-6">
        <View className="w-32 h-16 border-t-8 border-l-8 border-r-8 border-amber-400 rounded-t-full items-center justify-end pb-1">
          <Text className="text-2xl font-black text-slate-900">15</Text>
          <Text className="text-[10px] text-slate-400 font-semibold">giây còn lại</Text>
        </View>
      </View>

      {/* Question Card */}
      <View className="px-4 flex-1">
        <View className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm mb-4">
          <Text className="text-xs font-bold text-indigo-600 uppercase mb-2">CÂU 3 / 10</Text>
          <Text className="text-base font-bold text-slate-900 leading-snug mb-4">
            Hiện tượng Deadlock xảy ra khi thỏa mãn đồng thời bao nhiêu điều kiện?
          </Text>

          <View className="bg-amber-50 px-3 py-1.5 rounded-full border border-amber-200 self-start flex-row items-center">
            <Zap size={12} color="#D97706" className="mr-1" />
            <Text className="text-xs text-amber-700 font-bold">+120 pts (Thưởng tốc độ!)</Text>
          </View>
        </View>

        {/* Options */}
        {['2 điều kiện', '3 điều kiện', '4 điều kiện', '5 điều kiện'].map((opt, idx) => (
          <TouchableOpacity
            key={idx}
            onPress={() => {
              setSelectedOption(idx);
              if (idx === 2) router.push('/battle/results');
            }}
            className={`p-4 rounded-2xl border mb-3 flex-row items-center ${
              selectedOption === idx ? 'bg-indigo-50 border-indigo-600' : 'bg-white border-slate-200'
            }`}
          >
            <View className={`w-8 h-8 rounded-xl items-center justify-center mr-3 ${
              selectedOption === idx ? 'bg-indigo-600' : 'bg-slate-100'
            }`}>
              <Text className={`font-bold text-xs ${selectedOption === idx ? 'text-white' : 'text-slate-600'}`}>
                {String.fromCharCode(65 + idx)}
              </Text>
            </View>
            <Text className="font-semibold text-slate-800 text-sm flex-1">{opt}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Live Leaderboard */}
      <View className="bg-white p-4 border-t border-slate-200">
        <View className="flex-row justify-between items-center mb-2">
          <Text className="text-xs font-bold text-slate-400 uppercase">BẢNG XẾP HẠNG TRỰC TIẾP</Text>
          <Text className="text-[10px] text-emerald-600 font-bold">● LIVE</Text>
        </View>
        <View className="flex-row justify-around">
          <Text className="text-xs font-bold text-slate-700">Tuấn: 1250 pts</Text>
          <Text className="text-xs font-bold text-indigo-600">Minh (Bạn): 980 pts</Text>
          <Text className="text-xs font-bold text-slate-700">Linh: 850 pts</Text>
        </View>
      </View>
    </View>
  );
}