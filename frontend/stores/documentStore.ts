import { create } from "zustand";

export interface DocumentItem {
  id: string;
  title: string;
  file_type: string;
  file_size?: number;
  num_pages: number;
  status: string;
  summary_tldr?: string;
  summary_detailed?: string;
  created_at: string;
}

interface DocumentState {
  documents: DocumentItem[];
  selectedDocument: DocumentItem | null;
  setDocuments: (docs: DocumentItem[]) => void;
  setSelectedDocument: (doc: DocumentItem | null) => void;
  addDocument: (doc: DocumentItem) => void;
}

export const useDocumentStore = create<DocumentState>((set) => ({
  documents: [],
  selectedDocument: null,
  setDocuments: (documents) => set({ documents }),
  setSelectedDocument: (selectedDocument) => set({ selectedDocument }),
  addDocument: (doc) => set((state) => ({ documents: [doc, ...state.documents] })),
}));

