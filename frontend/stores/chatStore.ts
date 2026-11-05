import { create } from 'zustand';

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  citations?: Array<{
    pageNumber: number;
    text: string;
    documentId: string;
  }>;
  timestamp: Date;
  isStreaming?: boolean;
}

interface ChatState {
  messages: ChatMessage[];
  documentId: string | null;
  isStreaming: boolean;
  error: string | null;

  addMessage: (message: ChatMessage) => void;
  updateLastMessage: (content: string, done?: boolean) => void;
  setDocumentId: (id: string | null) => void;
  setStreaming: (streaming: boolean) => void;
  setError: (error: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  messages: [],
  documentId: null,
  isStreaming: false,
  error: null,

  addMessage: (message) =>
    set((state) => ({ messages: [...state.messages, message] })),

  updateLastMessage: (content, done = false) =>
    set((state) => {
      const msgs = [...state.messages];
      if (msgs.length > 0) {
        msgs[msgs.length - 1] = {
          ...msgs[msgs.length - 1],
          content,
          isStreaming: !done,
        };
      }
      return { messages: msgs, isStreaming: !done };
    }),

  setDocumentId: (id) => set({ documentId: id }),
  setStreaming: (streaming) => set({ isStreaming: streaming }),
  setError: (error) => set({ error }),
  clearMessages: () => set({ messages: [], error: null }),
}));
