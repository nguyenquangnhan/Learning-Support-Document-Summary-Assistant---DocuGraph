/**
 * DocuGraph AI – Multiplayer Battle Room API client
 * Server điều phối câu hỏi theo đồng hồ server -> mọi người chơi cùng 1 câu cùng lúc.
 */
import { api } from "./api";

export interface BattlePlayer {
  user_id: string;
  name: string;
  score: number;
  correct: number;
  is_host: boolean;
  rank: number;
  avg_answer_ms: number;
}

export interface BattleQuestion {
  index: number;
  question: string;
  options: { key: "A" | "B" | "C" | "D"; text: string }[];
  correct_option?: "A" | "B" | "C" | "D";
  explanation?: string;
}

export interface BattleRoomState {
  room_code: string;
  host_id: string;
  document_id: string;
  document_title: string;
  status: "waiting" | "playing" | "finished";
  phase: "waiting" | "countdown" | "question" | "reveal" | "finished";
  question_index: number;
  total_questions: number;
  question_seconds: number;
  reveal_seconds: number;
  phase_ends_at: number | null;
  server_now: number;
  question: BattleQuestion | null;
  my_answer: { option: string; correct: boolean; points: number; ms: number } | null;
  answered_count: number;
  is_host: boolean;
  is_member: boolean;
  players: BattlePlayer[];
}

const errMsg = (e: any, fallback: string) =>
  e?.response?.data?.detail || e?.message || fallback;

export const battleApi = {
  async createRoom(params: {
    hostId: string;
    hostName: string;
    documentId: string;
    documentTitle?: string;
    numQuestions?: number;
  }): Promise<BattleRoomState> {
    try {
      const res = await api.post(
        "/battle/rooms",
        {
          host_id: params.hostId,
          host_name: params.hostName,
          document_id: params.documentId,
          document_title: params.documentTitle,
          num_questions: params.numQuestions ?? 5,
        },
        { timeout: 60000 }
      );
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Không thể tạo phòng đấu trí"));
    }
  },

  async joinRoom(code: string, userId: string, userName: string): Promise<BattleRoomState> {
    try {
      const res = await api.post(`/battle/rooms/${code.trim()}/join`, {
        user_id: userId,
        user_name: userName,
      });
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Không thể vào phòng"));
    }
  },

  async getState(code: string, userId: string): Promise<BattleRoomState> {
    try {
      const res = await api.get(`/battle/rooms/${code.trim()}`, { params: { user_id: userId } });
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Không tải được trạng thái phòng"));
    }
  },

  async startRoom(code: string, userId: string): Promise<BattleRoomState> {
    try {
      const res = await api.post(`/battle/rooms/${code.trim()}/start`, { user_id: userId });
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Không thể bắt đầu trận đấu"));
    }
  },

  async submitAnswer(code: string, userId: string, questionIndex: number, option: string) {
    try {
      const res = await api.post(`/battle/rooms/${code.trim()}/answer`, {
        user_id: userId,
        question_index: questionIndex,
        option,
      });
      return res.data;
    } catch (e) {
      throw new Error(errMsg(e, "Không gửi được đáp án"));
    }
  },

  async leaveRoom(code: string, userId: string) {
    try {
      await api.post(`/battle/rooms/${code.trim()}/leave`, { user_id: userId });
    } catch {
      // ignore
    }
  },
};

