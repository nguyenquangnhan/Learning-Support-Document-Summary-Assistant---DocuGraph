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

export interface GraphCanvasProps {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
  mode?: "mindmap" | "graph";
  onNodeSelect?: (node: CanvasNode) => void;
}

