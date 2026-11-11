import React, { useEffect, useRef } from "react";
import { View, StyleSheet, ActivityIndicator, TouchableOpacity, Platform } from "react-native";
import { WebView } from "react-native-webview";
import { ZoomIn, ZoomOut, Maximize2 } from "lucide-react-native";

export interface CanvasNode {
  id: string;
  label: string;
  type?: string;
  level?: number;
  definition?: string;
  formula?: string;
  page_number?: number;
  color?: string;
  parent_id?: string;
}

export interface CanvasEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  confidence?: number;
}

interface GraphCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  mode?: "mindmap" | "graph";
  onNodeSelect?: (node: CanvasNode) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  nodes,
  edges,
  mode = "graph",
  onNodeSelect,
}) => {
  const webViewRef = useRef<WebView>(null);
  const iframeRef = useRef<any>(null);
  const isWeb = Platform.OS === "web";

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

  // Web: lắng nghe postMessage từ iframe
  useEffect(() => {
    if (!isWeb || typeof window === "undefined") return;
    const listener = (event: MessageEvent) => {
      if (iframeRef.current && event.source !== iframeRef.current.contentWindow) return;
      handleCanvasMessage(event.data);
    };
    window.addEventListener("message", listener);
    return () => window.removeEventListener("message", listener);
  }, [isWeb, onNodeSelect]);

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

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=4.0, user-scalable=yes">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js"></script>
        <style>
          * { box-sizing: border-box; }
          body { margin: 0; padding: 0; background-color: #0B0F19; overflow: hidden; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          #cy { width: 100vw; height: 100vh; display: block; }
        </style>
      </head>
      <body>
        <div id="cy"></div>
        <script>
          const isMindmap = ${isMindmap ? "true" : "false"};
          const elements = ${JSON.stringify(elements).replace(/<\/script>/gi, "<\\/script>")};

          const styles = [
            {
              selector: 'node',
              style: {
                'background-color': 'data(color)',
                'label': 'data(label)',
                'color': '#FFFFFF',
                'font-size': '12px',
                'font-weight': '600',
                'text-valign': 'center',
                'text-halign': 'center',
                'text-wrap': 'wrap',
                'text-max-width': '120px',
                'width': 70,
                'height': 45,
                'shape': 'round-rectangle',
                'corner-radius': '10px',
                'border-width': 2,
                'border-color': '#FFFFFF',
                'border-opacity': 0.35,
                'shadow-blur': 12,
                'shadow-color': '#000000',
                'shadow-opacity': 0.4
              }
            },
            // Mindmap Root Node (Level 0)
            {
              selector: 'node[level = 0]',
              style: {
                'background-color': '#4F46E5',
                'font-size': '14px',
                'font-weight': 'bold',
                'width': 130,
                'height': 52,
                'border-width': 3,
                'border-color': '#A5B4FC',
                'border-opacity': 0.9,
                'corner-radius': '14px'
              }
            },
            // Mindmap Topic (Level 1)
            {
              selector: 'node[level = 1]',
              style: {
                'background-color': '#10B981',
                'font-size': '12px',
                'width': 105,
                'height': 42,
                'border-width': 2,
                'border-color': '#6EE7B7'
              }
            },
            // Mindmap Subtopic (Level 2)
            {
              selector: 'node[level = 2]',
              style: {
                'background-color': '#F59E0B',
                'font-size': '11px',
                'width': 95,
                'height': 38,
                'border-width': 1.5,
                'border-color': '#FDE68A'
              }
            },
            // Mindmap Detail Leaf (Level 3)
            {
              selector: 'node[level = 3]',
              style: {
                'background-color': '#06B6D4',
                'font-size': '10px',
                'width': 85,
                'height': 32,
                'border-width': 1,
                'border-color': '#67E8F9'
              }
            },
            // Concept Graph Specific Styling
            {
              selector: 'node[type = "Formula"]',
              style: {
                'background-color': '#EC4899',
                'border-color': '#F472B6',
                'shape': 'hexagon',
                'width': 65,
                'height': 65
              }
            },
            {
              selector: 'node[type = "Theorem"]',
              style: {
                'background-color': '#8B5CF6',
                'border-color': '#C4B5FD',
                'shape': 'diamond',
                'width': 65,
                'height': 65
              }
            },
            // Edges Styling
            {
              selector: 'edge',
              style: {
                'width': isMindmap ? 2.5 : 2,
                'line-color': isMindmap ? '#475569' : '#334155',
                'target-arrow-color': isMindmap ? '#94A3B8' : '#64748B',
                'target-arrow-shape': 'triangle',
                'arrow-scale': 1.1,
                'curve-style': isMindmap ? 'unbundled-bezier' : 'bezier',
                'label': 'data(label)',
                'color': '#94A3B8',
                'font-size': '10px',
                'text-rotation': 'autorotate',
                'text-margin-y': -8
              }
            },
            // Selected node highlight
            {
              selector: ':selected',
              style: {
                'border-width': 4,
                'border-color': '#FBBF24',
                'border-opacity': 1.0,
                'shadow-blur': 25,
                'shadow-color': '#FBBF24',
                'shadow-opacity': 0.8
              }
            }
          ];

          const layoutConfig = isMindmap
            ? {
                name: 'breadthfirst',
                directed: true,
                roots: '#mm_root',
                padding: 40,
                spacingFactor: 1.45,
                animate: true,
                animationDuration: 600,
                avoidOverlap: true
              }
            : {
                name: 'cose',
                animate: true,
                animationDuration: 600,
                padding: 35,
                nodeRepulsion: 5000,
                idealEdgeLength: 80
              };

          const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: elements,
            style: styles,
            layout: layoutConfig,
            minZoom: 0.3,
            maxZoom: 3.5,
            wheelSensitivity: 0.25
          });

          // Center and fit nicely
          cy.ready(function() {
            setTimeout(function() {
              cy.fit(null, 35);
            }, 100);
          });

          // Gửi message cho cả Native WebView và Web iframe
          function sendToHost(payload) {
            payload.source = 'docugraph-canvas';
            const msg = JSON.stringify(payload);
            if (window.ReactNativeWebView && window.ReactNativeWebView.postMessage) {
              window.ReactNativeWebView.postMessage(msg);
            } else if (window.parent && window.parent !== window) {
              window.parent.postMessage(msg, '*');
            }
          }

          // Node tap listener
          cy.on('tap', 'node', function(evt) {
            sendToHost({ type: 'NODE_SELECTED', data: evt.target.data() });
          });

          // Background tap (deselect)
          cy.on('tap', function(evt) {
            if (evt.target === cy) {
              sendToHost({ type: 'DESELECT' });
            }
          });

          // External commands from React Native
          window.zoomIn = function() {
            cy.zoom(cy.zoom() * 1.3);
          };
          window.zoomOut = function() {
            cy.zoom(cy.zoom() / 1.3);
          };
          window.fitGraph = function() {
            cy.fit(null, 35);
          };
        </script>
      </body>
    </html>
  `;

  const runCanvasCommand = (fn: "zoomIn" | "zoomOut" | "fitGraph") => {
    if (isWeb) {
      try {
        iframeRef.current?.contentWindow?.[fn]?.();
      } catch (e) {}
    } else {
      webViewRef.current?.injectJavaScript(`window.${fn}(); true;`);
    }
  };

  const handleZoomIn = () => runCanvasCommand("zoomIn");
  const handleZoomOut = () => runCanvasCommand("zoomOut");
  const handleFit = () => runCanvasCommand("fitGraph");

  return (
    <View style={styles.container}>
      {isWeb ? (
        React.createElement("iframe", {
          ref: iframeRef,
          srcDoc: htmlContent,
          title: "DocuGraph Knowledge Canvas",
          style: { border: "none", width: "100%", height: "100%", minHeight: "100%", backgroundColor: "#0B0F19", display: "block" },
        })
      ) : (
        <WebView
          ref={webViewRef}
          originWhitelist={["*"]}
          source={{ html: htmlContent }}
          onMessage={(event) => handleCanvasMessage(event.nativeEvent.data)}
          renderLoading={() => <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />}
          startInLoadingState
        />
      )}

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
