import React, { useState } from "react";
import { View, Text, TouchableOpacity, Modal } from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery } from "@tanstack/react-query";
import { ZoomIn, ZoomOut, Maximize2, Sparkles, X, BookOpen } from "lucide-react-native";
import { GraphCanvas } from "../../components/graph/GraphCanvas";
import { api } from "../../lib/api";

export default function GraphScreen() {
  const { docId } = useLocalSearchParams();
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [mode, setMode] = useState<"graph" | "tree">("graph");

  // Mock initial sample nodes if docId is not set
  const sampleNodes = [
    { id: "n1", label: "Hàm số liên tục", type: "Concept", definition: "Hàm số f(x) được gọi là liên tục tại điểm x0 nếu giới hạn lim f(x) khi x tiến đến x0 bằng f(x0)." },
    { id: "n2", label: "Định lý Weierstrass", type: "Theorem", definition: "Mọi hàm liên tục trên đoạn [a, b] đều đạt giá trị lớn nhất và nhỏ nhất trên đoạn đó." },
    { id: "n3", label: "Đạo hàm cấp 1", type: "Formula", definition: "Tỉ số biến thiên f'(x) = lim (f(x+h) - f(x))/h khi h tiến tới 0." },
    { id: "n4", label: "Quy tắc L'Hôpital", type: "Theorem", definition: "Khử dạng vô định 0/0 và vô cùng/vô cùng bằng cách lấy đạo hàm tử và mẫu." },
  ];

  const sampleEdges = [
    { id: "e1", source: "n1", target: "n2", label: "dẫn_tới" },
    { id: "e1_2", source: "n1", target: "n3", label: "mở_rộng" },
    { id: "e2", source: "n3", target: "n4", label: "áp_dụng" },
  ];

  const { data: graphData } = useQuery({
    queryKey: ["graph", docId],
    queryFn: async () => {
      if (!docId) return { nodes: sampleNodes, edges: sampleEdges };
      try {
        const res = await api.get(`/graph/${docId}`);
        return res.data.nodes?.length ? res.data : { nodes: sampleNodes, edges: sampleEdges };
      } catch (e) {
        return { nodes: sampleNodes, edges: sampleEdges };
      }
    },
  });

  const nodes = graphData?.nodes || sampleNodes;
  const edges = graphData?.edges || sampleEdges;

  return (
    <View className="flex-1 bg-slate-900">
      {/* Top Controls: Mode Switcher */}
      <View className="flex-row justify-between items-center px-4 py-3 bg-slate-800/80 border-b border-slate-700/60 z-10">
        <View className="flex-row bg-slate-900 p-1 rounded-xl border border-slate-700">
          <TouchableOpacity
            className={`px-3 py-1.5 rounded-lg ${mode === "graph" ? "bg-indigo-600" : ""}`}
            onPress={() => setMode("graph")}
          >
            <Text className={`text-xs font-semibold ${mode === "graph" ? "text-white" : "text-slate-400"}`}>
              Đồ thị Mạng lưới
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className={`px-3 py-1.5 rounded-lg ${mode === "tree" ? "bg-indigo-600" : ""}`}
            onPress={() => setMode("tree")}
          >
            <Text className={`text-xs font-semibold ${mode === "tree" ? "text-white" : "text-slate-400"}`}>
              Sơ đồ Cây (Tree)
            </Text>
          </TouchableOpacity>
        </View>

        {/* Zoom & Canvas controls */}
        <View className="flex-row space-x-1">
          <TouchableOpacity className="bg-slate-700 p-2 rounded-lg">
            <ZoomIn size={16} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-slate-700 p-2 rounded-lg">
            <ZoomOut size={16} color="#CBD5E1" />
          </TouchableOpacity>
          <TouchableOpacity className="bg-slate-700 p-2 rounded-lg">
            <Maximize2 size={16} color="#CBD5E1" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Interactive Cytoscape Canvas */}
      <View className="flex-1">
        <GraphCanvas nodes={nodes} edges={edges} onNodeSelect={(node) => setSelectedNode(node)} />
      </View>

      {/* Selected Node BottomSheet Modal */}
      {selectedNode && (
        <View className="absolute bottom-4 left-4 right-4 bg-slate-800 border border-indigo-500/40 p-4 rounded-2xl shadow-2xl">
          <View className="flex-row justify-between items-start">
            <View className="flex-1 mr-2">
              <View className="flex-row items-center space-x-2">
                <Text className="text-base font-bold text-white">{selectedNode.label}</Text>
                <View className="bg-indigo-500/20 px-2 py-0.5 rounded ml-2">
                  <Text className="text-indigo-400 text-[10px] font-semibold">{selectedNode.type}</Text>
                </View>
              </View>
              <Text className="text-slate-300 text-xs mt-2 leading-relaxed">
                {selectedNode.definition || "Chạm để xem liên kết đa bước với các định lý khác."}
              </Text>
            </View>
            <TouchableOpacity onPress={() => setSelectedNode(null)} className="p-1">
              <X size={18} color="#94A3B8" />
            </TouchableOpacity>
          </View>

          <View className="flex-row space-x-2 mt-4 pt-3 border-t border-slate-700/60">
            <TouchableOpacity className="flex-1 bg-indigo-600 py-2.5 px-3 rounded-xl flex-row justify-center items-center">
              <Sparkles size={14} color="#FFFFFF" />
              <Text className="text-white text-xs font-semibold ml-1.5">Hỏi thêm AI</Text>
            </TouchableOpacity>
            <TouchableOpacity className="flex-1 bg-slate-700 py-2.5 px-3 rounded-xl flex-row justify-center items-center">
              <BookOpen size={14} color="#CBD5E1" />
              <Text className="text-slate-200 text-xs font-medium ml-1.5">Xem trang nguồn</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

