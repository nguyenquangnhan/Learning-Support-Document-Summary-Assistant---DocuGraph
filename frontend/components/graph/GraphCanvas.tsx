import React from "react";
import { View, StyleSheet, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";

interface GraphCanvasProps {
  nodes: Array<{ id: string; label: string; type: string; definition?: string }>;
  edges: Array<{ id: string; source: string; target: string; label: string }>;
  onNodeSelect?: (node: any) => void;
}

export const GraphCanvas: React.FC<GraphCanvasProps> = ({ nodes, edges, onNodeSelect }) => {
  const elements = [
    ...nodes.map((n) => ({
      data: {
        id: n.id,
        label: n.label,
        type: n.type,
        definition: n.definition || "",
      },
    })),
    ...edges.map((e) => ({
      data: {
        id: e.id,
        source: e.source,
        target: e.target,
        label: e.label,
      },
    })),
  ];

  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=3.0, user-scalable=yes">
        <script src="https://cdnjs.cloudflare.com/ajax/libs/cytoscape/3.30.2/cytoscape.min.js"></script>
        <style>
          body { margin: 0; padding: 0; background-color: #0F172A; overflow: hidden; }
          #cy { width: 100vw; height: 100vh; display: block; }
        </style>
      </head>
      <body>
        <div id="cy"></div>
        <script>
          const cy = cytoscape({
            container: document.getElementById('cy'),
            elements: ${JSON.stringify(elements)},
            style: [
              {
                selector: 'node',
                style: {
                  'background-color': '#6366F1',
                  'label': 'data(label)',
                  'color': '#FFFFFF',
                  'font-size': '12px',
                  'text-valign': 'center',
                  'text-halign': 'center',
                  'width': 60,
                  'height': 60,
                  'border-width': 2,
                  'border-color': '#818CF8'
                }
              },
              {
                selector: 'node[type = "Formula"]',
                style: {
                  'background-color': '#F59E0B',
                  'border-color': '#FBBF24'
                }
              },
              {
                selector: 'node[type = "Theorem"]',
                style: {
                  'background-color': '#10B981',
                  'border-color': '#34D399'
                }
              },
              {
                selector: 'edge',
                style: {
                  'width': 2,
                  'line-color': '#475569',
                  'target-arrow-color': '#94A3B8',
                  'target-arrow-shape': 'triangle',
                  'curve-style': 'bezier',
                  'label': 'data(label)',
                  'color': '#94A3B8',
                  'font-size': '10px'
                }
              }
            ],
            layout: {
              name: 'cose',
              animate: true,
              padding: 30
            }
          });

          cy.on('tap', 'node', function(evt){
            const node = evt.target;
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'NODE_SELECTED',
              data: node.data()
            }));
          });
        </script>
      </body>
    </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={["*"]}
        source={{ html: htmlContent }}
        onMessage={(event) => {
          try {
            const parsed = JSON.parse(event.nativeEvent.data);
            if (parsed.type === "NODE_SELECTED" && onNodeSelect) {
              onNodeSelect(parsed.data);
            }
          } catch (e) {}
        }}
        renderLoading={() => <ActivityIndicator size="large" color="#6366F1" style={styles.loader} />}
        startInLoadingState
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0F172A",
  },
  loader: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -20 }, { translateY: -20 }],
  },
});

