// DocuGraph AI – TypeScript type definitions

// ── Document ──────────────────────────────────────────────────────────────────
export type DocumentStatus =
  | "uploading"
  | "ocr_processing"
  | "graph_building"
  | "ready"
  | "failed";

export interface Document {
  id: string;
  owner_id: string;
  title: string;
  file_url?: string;
  page_count?: number;
  status: DocumentStatus;
  summary_md?: string;
  mindmap_json?: MindmapData;
  created_at: string;
}

// ── Mindmap / Knowledge Graph ─────────────────────────────────────────────────
export interface MindmapNode {
  id: string;
  label: string;
  level: number;
  definition?: string;
  example?: string;
}

export interface MindmapEdge {
  from: string;
  to: string;
  label?: string;
}

export interface MindmapData {
  nodes: MindmapNode[];
  edges: MindmapEdge[];
}

// ── Quiz ──────────────────────────────────────────────────────────────────────
export type BloomLevel = "remember" | "understand" | "apply";

export interface QuizQuestion {
  id: string;
  question: string;
  options: [string, string, string, string];
  correct_idx: 0 | 1 | 2 | 3;
  explanation: string;
  bloom_level: BloomLevel;
  source_page?: number;
}

// ── Study Group ───────────────────────────────────────────────────────────────
export interface StudyGroup {
  id: string;
  name: string;
  group_code: string;
  host_id: string;
  member_count: number;
  created_at: string;
}

// ── Battle Room ───────────────────────────────────────────────────────────────
export type RoomStatus = "waiting" | "playing" | "finished";

export interface BattleRoom {
  id: string;
  group_id: string;
  host_id: string;
  pin_code: string;
  status: RoomStatus;
  time_per_q: number;
  current_q: number;
}

// ── Chat ──────────────────────────────────────────────────────────────────────
export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  pinned_doc_ids?: string[];
}

