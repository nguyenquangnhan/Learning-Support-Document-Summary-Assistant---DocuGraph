import { create } from 'zustand';

interface GraphNode {
  id: string;
  label: string;
  type: 'concept' | 'entity' | 'keyword';
  description?: string;
  sourcePages?: number[];
}

interface GraphEdge {
  id: string;
  source: string;
  target: string;
  label: string;
  weight?: number;
}

interface GraphState {
  nodes: GraphNode[];
  edges: GraphEdge[];
  selectedNode: GraphNode | null;
  viewMode: 'tree' | 'network';
  documentId: string | null;
  isLoading: boolean;
  error: string | null;

  setGraphData: (nodes: GraphNode[], edges: GraphEdge[]) => void;
  setSelectedNode: (node: GraphNode | null) => void;
  setViewMode: (mode: 'tree' | 'network') => void;
  setDocumentId: (id: string) => void;
  setLoading: (loading: boolean) => void;
  setError: (error: string | null) => void;
  reset: () => void;
}

export const useGraphStore = create<GraphState>((set) => ({
  nodes: [],
  edges: [],
  selectedNode: null,
  viewMode: 'tree',
  documentId: null,
  isLoading: false,
  error: null,

  setGraphData: (nodes, edges) => set({ nodes, edges }),
  setSelectedNode: (node) => set({ selectedNode: node }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setDocumentId: (id) => set({ documentId: id }),
  setLoading: (loading) => set({ isLoading: loading }),
  setError: (error) => set({ error }),
  reset: () => set({
    nodes: [],
    edges: [],
    selectedNode: null,
    documentId: null,
    isLoading: false,
    error: null,
  }),
}));
