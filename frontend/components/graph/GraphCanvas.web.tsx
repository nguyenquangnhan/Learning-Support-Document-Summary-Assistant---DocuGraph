import React, { useEffect, useRef } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const listener = (event: MessageEvent) => {
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      handleCanvasMessage(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [onNodeSelect]);

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

  const runCanvasCommand = (fn: "zoomIn" | "zoomOut" | "fitGraph") => {
    try {
      (iframeRef.current?.contentWindow as any)?.[fn]?.();
    } catch (e) {}
  };

  return (
    <View style={styles.container}>
      {React.createElement("iframe", {
        ref: iframeRef,
        srcDoc: htmlContent,
        title: "DocuGraph Knowledge Canvas",
        style: {
          border: "none",
          width: "100%",
          height: "100%",
          minHeight: "100%",
          backgroundColor: "#0B0F19",
          display: "block",
        },
      })}

      {/* Floating Canvas Controls (Zoom In, Zoom Out, Fit) */}
      <View style={styles.controlsContainer}>
        <TouchableOpacity onPress={() => runCanvasCommand("zoomIn")} style={styles.controlButton}>
          <ZoomIn size={18} color="#E2E8F0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => runCanvasCommand("zoomOut")} style={styles.controlButton}>
          <ZoomOut size={18} color="#E2E8F0" />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => runCanvasCommand("fitGraph")} style={styles.controlButton}>
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
