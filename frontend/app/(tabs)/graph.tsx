import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { ArrowLeft, Plus, Minus, Maximize2, Sparkles, X, BookOpen } from 'lucide-react-native';

export default function GraphScreen() {
  const [activeTab, setActiveTab] = useState<'mindmap' | 'graph'>('graph');
  const [selectedConcept, setSelectedConcept] = useState(true);

  return (
    <View className="flex-1 bg-slate-50 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center border-b border-slate-200 pb-3 bg-white">
        <TouchableOpacity className="p-1 mr-2">
          <ArrowLeft size={22} color="#334155" />
        </TouchableOpacity>
        <View>
          <Text className="text-xs text-slate-400 uppercase font-semibold">KHÔNG GIAN KIẾN THỨC</Text>
          <Text className="text-base font-bold text-slate-800">Đồ thị tri thức: Hệ Điều Hành</Text>
        </View>
      </View>

      {/* Tabs Switcher */}
      <View className="flex-row p-3 bg-white border-b border-slate-100">
        <TouchableOpacity 
          onPress={() => setActiveTab('mindmap')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'mindmap' ? 'bg-indigo-50 border border-indigo-200' : 'bg-slate-100'}`}
        >
          <Text className={`text-xs font-semibold ${activeTab === 'mindmap' ? 'text-indigo-600' : 'text-slate-500'}`}>Mindmap (Cây)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('graph')}
          className={`flex-1 py-2 rounded-xl items-center ml-2 ${activeTab === 'graph' ? 'bg-indigo-600' : 'bg-slate-100'}`}
        >
          <Text className={`text-xs font-semibold ${activeTab === 'graph' ? 'text-white' : 'text-slate-500'}`}>Concept Graph (Mạng lưới)</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Mockup */}
      <View className="flex-1 relative bg-slate-50 justify-center items-center p-4">
        <Text className="absolute top-3 left-4 text-xs text-slate-400 font-medium">4 khái niệm • 3 liên kết</Text>

        {/* Canvas Visual Graph */}
        <View className="w-full items-center">
          <View className="bg-indigo-600 px-6 py-3 rounded-2xl shadow-md mb-8">
            <Text className="text-white font-bold text-sm">Tiến trình (Process)</Text>
          </View>

          <View className="flex-row justify-around w-full mb-8">
            <View className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Text className="text-slate-700 font-semibold text-xs">Tài nguyên</Text>
            </View>
            <View className="bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm">
              <Text className="text-slate-700 font-semibold text-xs">Luồng (Thread)</Text>
            </View>
          </View>

          <View className="bg-indigo-50 border-2 border-indigo-500 px-6 py-3 rounded-2xl shadow-sm">
            <Text className="text-indigo-700 font-bold text-sm">✦ Deadlock</Text>
          </View>
        </View>

        {/* Zoom Controls */}
        <View className="absolute left-4 bottom-6 bg-white border border-slate-200 rounded-xl shadow-sm overflow-hidden">
          <TouchableOpacity className="p-2 border-b border-slate-100"><Plus size={18} color="#475569" /></TouchableOpacity>
          <TouchableOpacity className="p-2 border-b border-slate-100"><Minus size={18} color="#475569" /></TouchableOpacity>
          <TouchableOpacity className="p-2"><Maximize2 size={18} color="#475569" /></TouchableOpacity>
        </View>
      </View>

      {/* Bottom Sheet Concept Detail */}
      {selectedConcept && (
        <View className="bg-white rounded-t-3xl border-t border-slate-200 p-5 shadow-2xl">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-xs font-bold text-indigo-600 uppercase tracking-wider">KHÁI NIỆM ĐANG CHỌN</Text>
              <Text className="text-lg font-bold text-slate-900">Deadlock (Khóa chết)</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedConcept(false)} className="p-1 bg-slate-100 rounded-full">
              <X size={16} color="#64748B" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-600 text-xs leading-relaxed mb-4">
            Trạng thái một tập hợp tiến trình bị tắc nghẽn vô hạn do mỗi tiến trình giữ tài nguyên và chờ tài nguyên khác.
          </Text>

          <View className="bg-slate-50 p-3 rounded-xl border border-slate-200 flex-row items-center mb-4">
            <BookOpen size={16} color="#6366F1" className="mr-2" />
            <Text className="text-xs text-slate-600 font-medium flex-1">
              Trích xuất từ <Text className="font-bold text-slate-800">Trang 38, Giáo trình HĐH Bách Khoa</Text>
            </Text>
          </View>

          <TouchableOpacity className="flex-row items-center justify-center bg-indigo-50 py-3 rounded-xl border border-indigo-200">
            <Sparkles size={16} color="#4F46E5" className="mr-2" />
            <Text className="text-indigo-600 font-bold text-xs">Hỏi thêm AI về khái niệm này →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}