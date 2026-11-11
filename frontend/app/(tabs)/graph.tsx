import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator, ScrollView, Alert } from 'react-native';
import { ArrowLeft, Sparkles, X, BookOpen, RefreshCw, Layers, GitFork } from 'lucide-react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../../lib/api';
import { sl } from '../../src/core/di/injection_container';
import { GraphCanvas, CanvasNode, CanvasEdge } from '../../components/graph/GraphCanvas';

export default function GraphScreen() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { documentId } = useLocalSearchParams<{ documentId?: string }>();
  const [activeTab, setActiveTab] = useState<'mindmap' | 'graph'>('mindmap');
  const [selectedNode, setSelectedNode] = useState<CanvasNode | null>(null);
  const [currentDocId, setCurrentDocId] = useState<string | null>(documentId || null);

  // 1. Fetch available user documents for selection
  const { data: documents = [] } = useQuery({
    queryKey: ['documents_list_for_graph'],
    queryFn: async () => {
      const resEither = await sl.getDocumentsUseCase.call();
      return resEither.fold(
        () => [],
        (list) => list
      );
    },
  });

  // Effective Document ID
  const effectiveDocId = currentDocId || (documents.length > 0 ? documents[0].id : null);
  const currentDoc = documents.find((d) => d.id === effectiveDocId);

  // 2. Fetch Graph / Mindmap Data based on activeTab
  const { data: graphData, isLoading, refetch } = useQuery({
    queryKey: ['graph', effectiveDocId, activeTab],
    queryFn: async () => {
      if (!effectiveDocId) return { nodes: [], edges: [] };
      try {
        const res = await api.get(`/graph/${effectiveDocId}`, {
          params: { mode: activeTab },
        });
        if (res.data && res.data.nodes) {
          return res.data;
        }
      } catch (e) {
        console.warn('Failed to fetch graph from backend:', e);
      }
      return { nodes: [], edges: [] };
    },
    enabled: !!effectiveDocId,
  });

  // 3. Mutation: Regenerate Mindmap & Graph with AI & Neo4j
  const regenerateMutation = useMutation({
    mutationFn: async () => {
      if (!effectiveDocId) throw new Error("Chưa chọn tài liệu");
      const res = await api.post(`/graph/${effectiveDocId}/generate`, null, {
        params: { mode: activeTab },
      });
      return res.data;
    },
    onSuccess: (newData) => {
      queryClient.setQueryData(['graph', effectiveDocId, activeTab], newData);
      queryClient.invalidateQueries({ queryKey: ['graph', effectiveDocId] });
    },
    onError: (err: any) => {
      Alert.alert("Lỗi", err?.message || "Không thể tạo lại sơ đồ bằng Neo4j");
    },
  });

  const nodes: CanvasNode[] = graphData?.nodes || [];
  const edges: CanvasEdge[] = graphData?.edges || [];

  return (
    <View className="flex-1 bg-slate-900 pt-12">
      {/* Header */}
      <View className="px-4 flex-row items-center justify-between border-b border-slate-800 pb-3 bg-slate-900">
        <View className="flex-row items-center flex-1 mr-2">
          <TouchableOpacity onPress={() => router.back()} className="p-1 mr-2">
            <ArrowLeft size={22} color="#94A3B8" />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-[10px] text-indigo-400 uppercase font-bold tracking-wider">
              KHÔNG GIAN KIẾN THỨC • NEO4J GRAPH
            </Text>
            <Text className="text-sm font-bold text-white" numberOfLines={1}>
              {currentDoc?.title || (effectiveDocId ? "Đồ thị tài liệu" : "Đồ thị tổng quan")}
            </Text>
          </View>
        </View>

        {/* Regenerate AI & Neo4j Button */}
        {effectiveDocId && (
          <TouchableOpacity
            onPress={() => regenerateMutation.mutate()}
            disabled={regenerateMutation.isPending || isLoading}
            className="flex-row items-center bg-indigo-600/30 border border-indigo-500/50 px-3 py-1.5 rounded-xl active:bg-indigo-600/50"
          >
            {regenerateMutation.isPending ? (
              <ActivityIndicator size="small" color="#818CF8" />
            ) : (
              <>
                <RefreshCw size={13} color="#818CF8" className="mr-1.5" />
                <Text className="text-[11px] font-bold text-indigo-300">Tạo lại AI</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Horizontal Document Switcher Chips (if user has multiple documents) */}
      {documents.length > 1 && (
        <View className="bg-slate-950/70 border-b border-slate-800/80 py-2 px-3">
          <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
            {documents.map((doc) => {
              const isSelected = doc.id === effectiveDocId;
              return (
                <TouchableOpacity
                  key={doc.id}
                  onPress={() => {
                    setCurrentDocId(doc.id);
                    setSelectedNode(null);
                  }}
                  className={`mr-2 px-3 py-1.5 rounded-xl border flex-row items-center ${
                    isSelected
                      ? 'bg-indigo-600/30 border-indigo-500'
                      : 'bg-slate-800/60 border-slate-700/60'
                  }`}
                >
                  <BookOpen size={12} color={isSelected ? '#A5B4FC' : '#94A3B8'} className="mr-1.5" />
                  <Text
                    numberOfLines={1}
                    className={`text-xs max-w-[140px] font-medium ${
                      isSelected ? 'text-indigo-200 font-bold' : 'text-slate-400'
                    }`}
                  >
                    {doc.title}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Mode Switcher Tabs */}
      <View className="flex-row p-2.5 bg-slate-900 border-b border-slate-800">
        <TouchableOpacity
          onPress={() => {
            setActiveTab('mindmap');
            setSelectedNode(null);
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ${
            activeTab === 'mindmap'
              ? 'bg-indigo-600 border border-indigo-500 shadow-sm'
              : 'bg-slate-800/80'
          }`}
        >
          <GitFork size={15} color={activeTab === 'mindmap' ? '#FFFFFF' : '#94A3B8'} className="mr-1.5" />
          <Text className={`text-xs font-bold ${activeTab === 'mindmap' ? 'text-white' : 'text-slate-400'}`}>
            Mindmap Hình Cây (Neo4j)
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => {
            setActiveTab('graph');
            setSelectedNode(null);
          }}
          className={`flex-1 py-2.5 rounded-xl items-center flex-row justify-center ml-2 ${
            activeTab === 'graph'
              ? 'bg-indigo-600 border border-indigo-500 shadow-sm'
              : 'bg-slate-800/80'
          }`}
        >
          <Layers size={15} color={activeTab === 'graph' ? '#FFFFFF' : '#94A3B8'} className="mr-1.5" />
          <Text className={`text-xs font-bold ${activeTab === 'graph' ? 'text-white' : 'text-slate-400'}`}>
            Concept Graph Mạng Lưới
          </Text>
        </TouchableOpacity>
      </View>

      {/* Canvas Interactive Cytoscape Area */}
      <View className="flex-1 relative bg-slate-950">
        {isLoading || regenerateMutation.isPending ? (
          <View className="flex-1 items-center justify-center">
            <ActivityIndicator size="large" color="#6366F1" />
            <Text className="text-indigo-300 text-xs font-semibold mt-3">
              {regenerateMutation.isPending
                ? "AI đang phân tích & nạp Sơ đồ vào Neo4j..."
                : "Đang tải Sơ đồ từ Neo4j Knowledge Graph..."}
            </Text>
          </View>
        ) : nodes.length === 0 ? (
          <View className="flex-1 items-center justify-center px-8">
            <BookOpen size={36} color="#6366F1" />
            <Text className="text-white font-bold text-base mt-3 text-center">
              Chưa có Sơ đồ cho tài liệu này
            </Text>
            <Text className="text-slate-400 text-xs text-center mt-1.5 leading-5 mb-5">
              Hệ thống có thể tự động bóc tách Sơ đồ Tư duy phân cấp và Đồ thị liên kết khái niệm bằng AI & Neo4j.
            </Text>
            {effectiveDocId && (
              <TouchableOpacity
                onPress={() => regenerateMutation.mutate()}
                className="bg-indigo-600 py-3 px-5 rounded-xl flex-row items-center"
              >
                <Sparkles size={16} color="#FFFFFF" className="mr-2" />
                <Text className="text-white font-bold text-xs">Trích xuất Mindmap bằng Neo4j</Text>
              </TouchableOpacity>
            )}
          </View>
        ) : (
          <>
            <View className="absolute top-3 left-4 z-10 bg-slate-900/80 px-2.5 py-1 rounded-lg border border-slate-800">
              <Text className="text-[11px] text-slate-300 font-semibold">
                {nodes.length} nút • {edges.length} liên kết • {activeTab === 'mindmap' ? 'Cây phân cấp' : 'Mạng lưới'}
              </Text>
            </View>
            <GraphCanvas
              nodes={nodes}
              edges={edges}
              mode={activeTab}
              onNodeSelect={(node) => setSelectedNode(node)}
            />
          </>
        )}
      </View>

      {/* Bottom Sheet Node Detail */}
      {selectedNode && (
        <View className="bg-slate-900 rounded-t-3xl border-t border-slate-800 p-5 shadow-2xl">
          <View className="flex-row justify-between items-start mb-2">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center mb-1">
                <View
                  style={{
                    backgroundColor:
                      selectedNode.level === 0
                        ? '#4F46E5'
                        : selectedNode.level === 1
                        ? '#10B981'
                        : selectedNode.level === 2
                        ? '#F59E0B'
                        : '#06B6D4',
                  }}
                  className="px-2 py-0.5 rounded-md mr-2"
                >
                  <Text className="text-[10px] font-black text-white uppercase tracking-wider">
                    {selectedNode.type || `CẤP ${selectedNode.level ?? 1}`}
                  </Text>
                </View>
                {selectedNode.formula && (
                  <View className="bg-pink-950 border border-pink-700 px-2 py-0.5 rounded-md">
                    <Text className="text-[10px] font-bold text-pink-300">Công thức</Text>
                  </View>
                )}
              </View>
              <Text className="text-base font-bold text-white">{selectedNode.label}</Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)} className="p-1.5 bg-slate-800 rounded-full">
              <X size={16} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <Text className="text-slate-300 text-xs leading-relaxed mb-3">
            {selectedNode.definition || 'Nội dung khái niệm được trích xuất từ tài liệu học tập trong Neo4j.'}
          </Text>

          {selectedNode.formula ? (
            <View className="bg-slate-950 p-2.5 rounded-xl border border-pink-800/40 mb-3">
              <Text className="text-[10px] text-pink-400 font-bold mb-1">CÔNG THỨC TOÁN HỌC:</Text>
              <Text className="text-xs font-mono text-pink-200">{selectedNode.formula}</Text>
            </View>
          ) : null}

          {selectedNode.page_number ? (
            <View className="bg-slate-800/80 p-2.5 rounded-xl border border-slate-700 flex-row items-center mb-3">
              <BookOpen size={14} color="#818CF8" className="mr-2" />
              <Text className="text-xs text-slate-300 font-medium flex-1">
                Trích xuất từ <Text className="font-bold text-indigo-300">Trang {selectedNode.page_number}</Text>
              </Text>
            </View>
          ) : null}

          <TouchableOpacity
            onPress={() =>
              router.push({
                pathname: '/(tabs)/chat',
                params: {
                  initialQuery: `Giải thích chi tiết về "${selectedNode.label}" và mối liên hệ trong bài học?`,
                  documentId: effectiveDocId || undefined,
                },
              })
            }
            className="flex-row items-center justify-center bg-indigo-600 py-3 rounded-xl shadow-sm active:bg-indigo-700"
          >
            <Sparkles size={16} color="#FFFFFF" className="mr-2" />
            <Text className="text-white font-bold text-xs">Hỏi thêm AI về chủ đề này →</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}
