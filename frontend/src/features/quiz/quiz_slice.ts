/**
 * DocuGraph AI – Personal Quiz & Battle Feature (Domain + Data Clean Architecture Slice)
 * Course Alignment: Week 9 (3-Layer Isolation, Either<Failure, T>, Offline Resilience)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { api } from "../../../lib/api";
import { Either, Failure, right } from "../../core/errors/failures";
import { NetworkInfo } from "../../core/network/network_info";

export class QuizQuestionEntity {
  public readonly id: string;
  public readonly documentId: string;
  public readonly question: string;
  public readonly optionA: string;
  public readonly optionB: string;
  public readonly optionC: string;
  public readonly optionD: string;
  public readonly correctOption: "A" | "B" | "C" | "D";
  public readonly explanation: string;

  constructor(params: {
    id: string;
    documentId: string;
    question: string;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctOption: "A" | "B" | "C" | "D";
    explanation: string;
  }) {
    this.id = params.id;
    this.documentId = params.documentId;
    this.question = params.question;
    this.optionA = params.optionA;
    this.optionB = params.optionB;
    this.optionC = params.optionC;
    this.optionD = params.optionD;
    this.correctOption = params.correctOption;
    this.explanation = params.explanation;
  }

  public get optionsList(): { key: "A" | "B" | "C" | "D"; text: string }[] {
    return [
      { key: "A", text: this.optionA },
      { key: "B", text: this.optionB },
      { key: "C", text: this.optionC },
      { key: "D", text: this.optionD },
    ];
  }
}

export interface QuizRepository {
  getOrGenerateQuiz(documentId: string, numQuestions?: number): Promise<Either<Failure, QuizQuestionEntity[]>>;
}

export class GetDocumentQuizUseCase {
  private readonly repository: QuizRepository;

  constructor(repository: QuizRepository) {
    this.repository = repository;
  }

  public async call(
    documentId: string,
    numQuestions: number = 5
  ): Promise<Either<Failure, QuizQuestionEntity[]>> {
    const targetId = documentId && documentId.trim().length > 0 ? documentId.trim() : "default";
    return await this.repository.getOrGenerateQuiz(targetId, numQuestions);
  }
}

const QUIZ_CACHE_PREFIX = "@docugraph/quiz_cache_v1_";
const isServer = typeof window === "undefined";

export class QuizRepositoryImpl implements QuizRepository {
  private readonly networkInfo: NetworkInfo;

  constructor(networkInfo: NetworkInfo) {
    this.networkInfo = networkInfo;
  }

  public async getOrGenerateQuiz(
    documentId: string,
    numQuestions: number = 5
  ): Promise<Either<Failure, QuizQuestionEntity[]>> {
    const isOnline = await this.networkInfo.isConnected();

    if (isOnline && !documentId.startsWith("offline_")) {
      try {
        const res = await api.get(`/quiz/${documentId}`);
        const rawList = Array.isArray(res.data?.questions) ? res.data.questions : [];
        if (rawList.length > 0) {
          const entities = rawList.map(
            (q: any, idx: number) =>
              new QuizQuestionEntity({
                id: String(q.id || `q_${idx}`),
                documentId: String(q.document_id || documentId),
                question: String(q.question || ""),
                optionA: String(q.option_a || ""),
                optionB: String(q.option_b || ""),
                optionC: String(q.option_c || ""),
                optionD: String(q.option_d || ""),
                correctOption: (String(q.correct_option || "A").toUpperCase() as any) || "A",
                explanation: String(q.explanation || "Dựa trên nội dung bài giảng."),
              })
          );

          if (!isServer) {
            try {
              await AsyncStorage.setItem(`${QUIZ_CACHE_PREFIX}${documentId}`, JSON.stringify(entities));
            } catch {
              // Ignore
            }
          }
          return right(entities);
        }
      } catch {
        // Fallback to local cache or built-in academic quiz
      }
    }

    // Check Offline Cache
    if (!isServer) {
      try {
        const cachedRaw = await AsyncStorage.getItem(`${QUIZ_CACHE_PREFIX}${documentId}`);
        if (cachedRaw) {
          const parsed = JSON.parse(cachedRaw);
          if (Array.isArray(parsed) && parsed.length > 0) {
            return right(parsed.map((item: any) => new QuizQuestionEntity(item)));
          }
        }
      } catch {
        // Ignore
      }
    }

    // Offline default academic questions
    const fallbackQuestions: QuizQuestionEntity[] = [
      new QuizQuestionEntity({
        id: "q_off_1",
        documentId,
        question: "Hiện tượng Khóa chết (Deadlock) trong Hệ điều hành xảy ra khi thỏa mãn đồng thời bao nhiêu điều kiện Coffman?",
        optionA: "2 điều kiện (Mutual Exclusion & Hold and Wait)",
        optionB: "3 điều kiện",
        optionC: "4 điều kiện (Mutual Exclusion, Hold & Wait, No Preemption, Circular Wait)",
        optionD: "5 điều kiện",
        correctOption: "C",
        explanation: "Theo Coffman (1971), Deadlock chỉ xảy ra khi cả 4 điều kiện cùng đồng thời thỏa mãn.",
      }),
      new QuizQuestionEntity({
        id: "q_off_2",
        documentId,
        question: "Trong kiến trúc On-Device AI (Google ML Kit OCR v2), vì sao cần áp dụng Frame Throttling (400ms / 2.5 FPS)?",
        optionA: "Để giảm dung lượng lưu trữ ổ cứng",
        optionB: "Để tránh nghẽn hàng đợi RAM (OOM Crash) và giữ giao diện mượt 60 FPS",
        optionC: "Để tự động tải ảnh lên đám mây",
        optionD: "Để tắt đèn flash của camera",
        correctOption: "B",
        explanation: "Mỗi frame OCR tốn 80–150ms; nếu truyền toàn bộ 30 FPS vào bộ nhận diện sẽ gây tràn RAM.",
      }),
      new QuizQuestionEntity({
        id: "q_off_3",
        documentId,
        question: "Theo quy tắc Clean Architecture (The Dependency Rule), tầng Domain Layer được phép phụ thuộc vào đâu?",
        optionA: "Chỉ chứa logic nghiệp vụ thuần túy (Pure TS/Dart), KHÔNG phụ thuộc UI, HTTP hay Database",
        optionB: "Phụ thuộc trực tiếp vào Axios và SQLite",
        optionC: "Phụ thuộc vào React Native Stylesheet",
        optionD: "Phụ thuộc vào Expo Camera View",
        correctOption: "A",
        explanation: "Mọi mũi tên phụ thuộc chỉ được hướng vào trong về phía Domain Layer.",
      }),
    ];

    return right(fallbackQuestions.slice(0, numQuestions));
  }
}
