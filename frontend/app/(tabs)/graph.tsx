import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { ArrowLeft, Plus, Minus, Maximize2, Sparkles, X, BookOpen } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { GraphCanvas } from '../../components/graph/GraphCanvas';

export default function GraphScreen() {
  const router = useRouter();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const [activeTab, setActiveTab] = useState<'mindmap' | 'graph'>('graph');
  const [selectedNode, setSelectedNode] = useState<any>(null);

  const { data: graphData, isLoading } = useQuery({
    queryKey: ['graph', documentId],
    queryFn: async () => {
      if (documentId) {
        try {
          const res = await api.get(`/graph/${documentId}`);
          if (res.data && res.data.nodes && res.data.nodes.length > 0) {
            return res.data;
          }
        } catch {}
      }
      // Fallback sample graph
      return {
        nodes: [
          { id: 'n1', label: 'Tiến trình (Process)', type: 'Concept', definition: 'Một chương trình đang trong quá trình thực thi trên hệ điều hành.', page_number: 12 },
          { id: 'n2', label: 'Tài nguyên (Resource)', type: 'Concept', definition: 'CPU, bộ nhớ, thiết bị I/O được cấp phát cho tiến trình.', page_number: 14 },
          { id: 'n3', label: 'Luồng (Thread)', type: 'Concept', definition: 'Đơn vị xử lý cơ bản nhất bên trong một tiến trình.', page_number: 22 },
          { id: 'n4', label: 'Deadlock (Khóa chết)', type: 'Theorem', definition: 'Trạng thái tập hợp tiến trình chờ đợi lẫn nhau vô hạn.', page_number: 38 },
        ],
        edges: [
          { id: 'e1', source: 'n1', target: 'n2', label: 'yêu_cầu' },
          { id: 'e2', source: 'n1', target: 'n3', label: 'chứa' },
          { id: 'e3', source: 'n1', target: 'n4', label: 'dẫn_tới' },
        ],
      };
    },
  });

  const nodes = graphData?.nodes || [];
  const edges = graphData?.edges || [];

  return (
    <View className="flex-1 bg-slate-900 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center border-b border-slate-800 pb-3 bg-slate-900">
        <TouchableOpacity onPress={() => router.back()} className="p-1 mr-2">
          <ArrowLeft size={22} color="#94A3B8" />
        </TouchableOpacity>
        <View className="flex-1">
          <Text className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">KHÔNG GIAN KIẾN THỨC</Text>
          <Text className="text-sm font-bold text-white" numberOfLines={1}>
            {documentId ? `Đồ thị tri thức tài liệu` : 'Đồ thị tri thức tổng quan'}
          </Text>
        </View>
      </View>

      {/* Tabs Switcher */}
      <View className="flex-row p-3 bg-slate-900/90 border-b border-slate-800">
        <TouchableOpacity 
          onPress={() => setActiveTab('mindmap')}
          className={`flex-1 py-2 rounded-xl items-center ${activeTab === 'mindmap' ? 'bg-indigo-950 border border-indigo-700' : 'bg-slate-800'}`}
        >
          <Text className={`text-xs font-semibold ${activeTab === 'mindmap' ? 'text-indigo-400' : 'text-slate-400'}`}>Mindmap (Cây)</Text>
        </TouchableOpacity>
        <TouchableOpacity 
          onPress={() => setActiveTab('graph')}
          className={`flex-1 py-2 rounded-xl items-center ml-2 ${activeTab === 'graph' ? 'bg-indigo-600' : 'bg-slate-800'}`}
        >
          <Text className={`text-xs font-semibold ${activeTab === 'graph' ? 'text-white' : 'text-slate-400'}`}>Concept Graph (Mạng lưới)</Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Interactive Cytoscape Area */}
      <View className="flex-1 relative bg-slate-950">
        {isLoading ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-slate-400 text-xs mt-2">Đang dựng đồ thị tri thức...</Text>
          </View>
        ) : (
          <>
            <Text className="absolute top-3 left-4 text-xs text-slate-400 font-medium z-10">
              {nodes.length} khái niệm • {edges.length} liên kết
            </Text>
            <GraphCanvas 
              nodes={nodes} 
              edges={edges} 
              onNodeSelect={(node) => setSelectedNode(node)} 
            />
          </>
        )}
      </View>

      {/* Bottom Sheet Concept Detail */}
      {selectedNode && (
        <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 p-5 shadow-2xl">
          <View className="flex-row justify-between items-start mb-2">
            <View>
              <Text className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider">KHÁI NIỆM ĐANG CHỌN</Text>
              <Text className="text-base font-bold text-white">{selectedNode.label || selectedNode.name}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)} className="p-1 bg-slate-800 rounded-full">
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-300 text-xs leading-relaxed mb-4">
            {selectedNode.definition || 'Khái niệm được trích xuất từ tài liệu học tập.'}
          </Text>

          {selectedNode.page_number && (
            <View className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex-row items-center mb-4">
              <BookOpen size={14} color="#818CF8" className="mr-2" />
              <Text className="text-xs text-slate-300 font-medium flex-1">
                Trích xuất từ <Text className="font-bold text-indigo-300">Trang {selectedNode.page_number}</Text>
              </Text>
            </View>
          )}

          <TouchableOpacity 
            onPress={() => router.push({
              pathname: '/(tabs)/chat',
              params: {
                initialQuery: `Giải thích chi tiết về khái niệm "${selectedNode.label || selectedNode.name}" và các mối quan hệ liên quan?`,
                documentId,
              }
            })}
            className="flex-row items-center justify-center bg-indigo-600 py-3 rounded-xl shadow-sm"
          >
            <Sparkles size={16} color="#FFFFFF" className="mr-2" />
            <Text className="text-white font-bold text-xs">Hỏi thêm AI về khái niệm này →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}