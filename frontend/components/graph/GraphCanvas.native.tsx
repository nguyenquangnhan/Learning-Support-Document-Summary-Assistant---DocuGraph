import React, { useRef } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity } from "react-native";
import { WebView } from "react-native-webview";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react-native";
import { GraphCanvasProps, CanvasNode, CanvasEdge } from "./GraphCanvas.types";
import { generateGraphHtml } from "./graphHtml";

export { CanvasNode, CanvasEdge, GraphCanvasProps };

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  mode = "graph",
  onNodeSelect,
}) => {
  const webViewRef = useRef<WebView>(null);

  const handleCanvasMessage = (raw: any) => {
    try {
      const parsed = typeof raw === "string" ? JSON.parse(raw) : raw;
      if (!parsed || parsed.source !== "docugraph-canvas") return;
      if (parsed.type === "NODE_SELECTED" && onNodeSelect) {
        onNodeSelect(parsed.data);
      } else if (parsed.type === "DESELECT" && onNodeSelect) {
        onNodeSelect(null as any);
      }
    } catch (e) {}
  };

  const elements = [
    ...nodes.map((n) => ({
      data: {
        id: n.id,
        label: n.label || "Node",
        type: n.type || "Concept",
        level: n.level !== undefined ? n.level : 2,
        definition: n.definition || "",
        formula: n.formula || "",
        page_number: n.page_number || null,
        color: n.color || (n.level === 0 ? "#4F46E5" : n.level === 1 ? "#10B981" : n.level === 2 ? "#F59E0B" : "#06B6D4"),
      },
    })),
    ...edges.map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label || "",
      },
    })),
  ];

  const isMindmap = mode === "mindmap";
  const htmlContent = generateGraphHtml(elements, isMindmap);

  const handleZoomIn = () => {
    webViewRef.current?.injectJavaScript("window.zoomIn(); true;");
  };

  const handleZoomOut = () => {
    webViewRef.current?.injectJavaScript("window.zoomOut(); true;");
  };

  const handleFit = () => {
    webViewRef.current?.injectJavaScript("window.fitGraph(); true;");
  };

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={(event) => handleCanvasMessage(event.nativeEvent.data)}
        renderLoading={() => <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />}
        startInLoadingState
      />

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Fit) */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={handleZoomIn} style={styles.controlButton}>
          <ZoomIn size={18} color="#E2E8F0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleZoomOut} style={styles.controlButton}>
          <ZoomOut size={18} color="#E2E8F0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleFit} style={styles.controlButton}>
          <Maximize2 size={16} color="#E2E8F0" />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0B0F19",
  },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
  controlsContainer: {
    position: "absolute",
    bottom: 20,
    right: 16,
    flexDirection: "column",
    backgroundColor: "rgba(15, 23, 42, 0.85)",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#334155",
    padding: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
  controlButton: {
    padding: 10,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 10,
  },
});
