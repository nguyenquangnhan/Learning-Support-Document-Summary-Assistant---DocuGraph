/**
 * DocuGraph AI – GraphRAG Chat Feature (Domain + Data Clean Architecture Slice)
 * Course Alignment: Week 9 (3-Layer Isolation, Either<Failure, T>, Offline Resilience)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../../lib/api";
import {
  Either,
  Failure,
  left,
  right,
  ServerFailure,
  ValidationFailure,
} from "../../core/errors/failures";
import { NetworkInfo } from "../../core/network/network_info";

export interface CitationEntity {
  chunkId?: string;
  pageNumber: number;
  textSnippet: string;
}

export class ChatMessageEntity {
  public readonly id: string;
  public readonly sender: "user" | "ai";
  public readonly text: string;
  public readonly citations: CitationEntity[];
  public readonly createdAt: string;

  constructor(params: {
    id: string;
    sender: "user" | "ai";
    text: string;
    citations?: CitationEntity[];
    createdAt?: string;
  }) {
    this.id = params.id;
    this.sender = params.sender;
    this.text = params.text;
    this.citations = params.citations || [];
    this.createdAt = params.createdAt || new Date().toISOString();
  }
}

export interface ChatRepository {
  askQuestion(documentId: string, question: string): Promise<Either<Failure, ChatMessageEntity>>;
}

export class AskQuestionUseCase {
  private readonly repository: ChatRepository;

  constructor(repository: ChatRepository) {
    this.repository = repository;
  }

  public async call(documentId: string, question: string): Promise<Either<Failure, ChatMessageEntity>> {
    if (!question || question.trim().length === 0) {
      return left(new ValidationFailure("Câu hỏi không được để trống"));
    }
    const targetDocId = documentId && documentId.trim().length > 0 ? documentId.trim() : "default";
    return await this.repository.askQuestion(targetDocId, question.trim());
  }
}

const CHAT_CACHE_PREFIX = "@docugraph/chat_cache_v1_";
const isServer = typeof window === "undefined";

export class ChatRepositoryImpl implements ChatRepository {
  private readonly networkInfo: NetworkInfo;

  constructor(networkInfo: NetworkInfo) {
    this.networkInfo = networkInfo;
  }

  public async askQuestion(
    documentId: string,
    question: string
  ): Promise<Either<Failure, ChatMessageEntity>> {
    const isOnline = await this.networkInfo.isConnected();

    if (isOnline && !documentId.startsWith("offline_")) {
      try {
        const res = await api.post("/chat/ask", {
          document_id: documentId,
          message: question,
          history: [],
        });

        const citations: CitationEntity[] = (res.data.citations || []).map((c: any) => ({
          chunkId: c.chunk_id,
          pageNumber: Number(c.page_number || 1),
          textSnippet: String(c.text_snippet || ""),
        }));

        const aiMsg = new ChatMessageEntity({
          id: `ai_${Date.now()}`,
          sender: "ai",
          text: String(res.data.answer || ""),
          citations,
        });

        if (!isServer) {
          try {
            await AsyncStorage.setItem(
              `${CHAT_CACHE_PREFIX}${documentId}_${question.toLowerCase().slice(0, 40)}`,
              JSON.stringify(aiMsg)
            );
          } catch {
            // Ignore
          }
        }

        return right(aiMsg);
      } catch (e: any) {
        return left(
          new ServerFailure(e?.response?.data?.detail || e?.message || "Lỗi truy vấn GraphRAG")
        );
      }
    }

    // Offline Mode Resilient Fallback: Search cached QA or synthesize from local cached document
    try {
      if (!isServer) {
        const cachedRaw = await AsyncStorage.getItem(
          `${CHAT_CACHE_PREFIX}${documentId}_${question.toLowerCase().slice(0, 40)}`
        );
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          return right(new ChatMessageEntity(parsed));
        }

        const docsRaw = await AsyncStorage.getItem("@docugraph/cached_documents_v2");
        if (docsRaw) {
          const docs = JSON.parse(docsRaw);
          const doc = Array.isArray(docs)
            ? docs.find((d: any) => d.id === documentId) || docs[0]
            : null;
          if (doc) {
            const snippet = (doc.summary_detailed || doc.summary_tldr || doc.title || "").slice(0, 320);
            return right(
              new ChatMessageEntity({
                id: `ai_offline_${Date.now()}`,
                sender: "ai",
                text: `[Chế độ Ngoại tuyến - Offline GraphRAG]\nDựa trên bộ nhớ đệm của tài liệu "${doc.title}":\n\n${snippet}`,
                citations: [
                  {
                    pageNumber: 1,
                    textSnippet: `[Offline Cache - Trang 1] ${doc.title}`,
                  },
                ],
              })
            );
          }
        }
      }
    } catch {
      // Ignore
    }

    return right(
      new ChatMessageEntity({
        id: `ai_offline_${Date.now()}`,
        sender: "ai",
        text: `[Chế độ Ngoại tuyến] Hệ thống đã ghi nhận câu hỏi "${question}". Kết nối mạng để truy vấn đầy đủ trên Neo4j & pgvector, hoặc xem bản tóm tắt đã lưu trong bộ nhớ máy.`,
        citations: [{ pageNumber: 1, textSnippet: "Bộ nhớ đệm ngoại tuyến (Local Cache)" }],
      })
    );
  }
}
