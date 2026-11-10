/**
 * DocuGraph AI – Automated Unit Test Suite (AAA Pattern: Arrange, Act, Assert)
 * Course Alignment: Week 9 (Slides 33-35: Unit Testing Use Cases & Repository Implementation)
 */
import { right, ValidationFailure, Failure, unit, Either, Unit } from "../core/errors/failures";
import { OcrScanResult } from "../features/scanner/domain/entities/ocr_scan_result";
import { ScannerRepository } from "../features/scanner/domain/repositories/scanner_repository";
import { ScanDocumentUseCase } from "../features/scanner/domain/usecases/scan_document_usecase";
import { HeuristicRegexParser } from "../features/scanner/data/utils/heuristic_regex_parser";
import { DocumentRepositoryImpl } from "../features/documents/data/repositories/document_repository_impl";
import { DocumentModel } from "../features/documents/data/models/document_model";

// 1. Mock ScannerRepository conforming to Domain interface (Week 9 Slide 33)
class MockScannerRepository implements ScannerRepository {
  public callCount = 0;
  public mockResult = new OcrScanResult({
    id: "scan_1",
    imageUri: "file://test.jpg",
    rawText: "Chương 4: Deadlock\nCông thức: T(n) = O(n^2)\nNgày: 15/10/2026",
    cleanedText: "Chương 4: Deadlock\nCông thức: T(n) = O(n^2)\nNgày: 15/10/2026",
    detectedTitle: "Chương 4: Deadlock",
    detectedFormulas: ["T(n) = O(n^2)"],
    detectedDates: ["15/10/2026"],
    detectedKeywords: ["Deadlock"],
    confidence: 0.96,
    latencyMs: 14.2,
    blocks: [{ text: "Chương 4: Deadlock", linesCount: 1 }],
  });

  async recognizeTextFromImage(_imageUri: string): Promise<Either<Failure, OcrScanResult>> {
    this.callCount++;
    return right<Failure, OcrScanResult>(this.mockResult);
  }

  async dispose(): Promise<Either<Failure, Unit>> {
    return right<Failure, Unit>(unit);
  }
}

export async function runAllCleanArchitectureTests(): Promise<{
  passed: number;
  failed: number;
  results: string[];
}> {
  const results: string[] = [];
  let passed = 0;
  let failed = 0;

  const assert = (condition: boolean, testName: string) => {
    if (condition) {
      passed++;
      results.push(`✓ ${testName}`);
    } else {
      failed++;
      results.push(`✗ FAILED: ${testName}`);
    }
  };

  // TEST 1: ScanDocumentUseCase happy path (AAA Pattern)
  {
    const mockRepo = new MockScannerRepository();
    const useCase = new ScanDocumentUseCase(mockRepo);
    const res = await useCase.call("file://page1.jpg", true);
    assert(res.isRight() && mockRepo.callCount === 1, "domain/usecases/scan_document_usecase: returns OcrScanResult when repository succeeds");
  }

  // TEST 2: ScanDocumentUseCase validation failure on blank URI (verifyZeroInteractions)
  {
    const mockRepo = new MockScannerRepository();
    const useCase = new ScanDocumentUseCase(mockRepo);
    const res = await useCase.call("   ", true);
    assert(
      res.isLeft() && res.value instanceof ValidationFailure && mockRepo.callCount === 0,
      "domain/usecases/scan_document_usecase: returns ValidationFailure & zero repo interactions when URI is empty"
    );
  }

  // TEST 3: ScanDocumentUseCase 400ms Frame Throttler (2.5 FPS)
  {
    const mockRepo = new MockScannerRepository();
    const useCase = new ScanDocumentUseCase(mockRepo);
    const first = await useCase.call("file://frame1.jpg", false);
    const secondImmediate = await useCase.call("file://frame2.jpg", false);
    assert(
      first.isRight() && secondImmediate.isLeft() && mockRepo.callCount === 1,
      "domain/usecases/scan_document_usecase: enforces 400ms (2.5 FPS) frame throttling"
    );
  }

  // TEST 4: HeuristicRegexParser extracts Title, Formulas, and Dates
  {
    const sampleRaw = "Chương 5: Đồ thị Tri thức\nĐộ phức tạp: f(x) = O(V + E)\nCập nhật: 20/11/2026";
    const parsed = HeuristicRegexParser.parse(sampleRaw);
    assert(
      parsed.detectedTitle.includes("Chương 5") &&
        parsed.detectedDates.includes("20/11/2026") &&
        parsed.detectedFormulas.length > 0,
      "data/utils/heuristic_regex_parser: extracts title, mathematical formulas, and DD/MM/YYYY dates"
    );
  }

  // TEST 5 & 6: DocumentRepositoryImpl Online vs Offline SSOT Caching
  {
    let isOnline = true;
    let remoteCallCount = 0;
    let cachedDocs: DocumentModel[] = [];

    const mockRemote = {
      fetchDocuments: async () => {
        remoteCallCount++;
        return [
          new DocumentModel({
            id: "doc_1",
            title: "Giáo trình AI.pdf",
            fileType: "PDF",
            numPages: 20,
            status: "ready",
            createdAt: "2026-11-10T00:00:00Z",
          }),
        ];
      },
      fetchDocumentById: async (id: string) => cachedDocs[0],
      uploadOcrDocument: async () => cachedDocs[0],
      deleteDocument: async (_id: string) => true,
    };

    const mockLocal = {
      getCachedDocuments: async () => cachedDocs,
      getCachedDocumentById: async () => cachedDocs[0],
      cacheDocuments: async (docs: DocumentModel[]) => {
        cachedDocs = docs;
      },
      upsertCachedDocument: async () => {},
      removeCachedDocument: async (_id: string) => {},
      enqueueOfflineOcrSync: async () => cachedDocs[0],
      getOfflineSyncQueue: async () => [],
      clearSyncedItemFromQueue: async () => {},
    };

    const mockNetwork = {
      isConnected: async () => isOnline,
      setSimulatedOffline: (v: boolean) => {
        isOnline = !v;
      },
      isSimulatedOffline: () => !isOnline,
    };

    const repo = new DocumentRepositoryImpl({
      remoteDataSource: mockRemote,
      localDataSource: mockLocal,
      networkInfo: mockNetwork,
    });

    // Online Act
    const onlineRes = await repo.getAllDocuments();
    assert(
      onlineRes.isRight() && remoteCallCount === 1 && cachedDocs.length === 1,
      "data/repositories/document_repository_impl: fetches remote data and caches locally when online"
    );

    // Offline Act (Airplane mode)
    isOnline = false;
    const offlineRes = await repo.getAllDocuments();
    assert(
      offlineRes.isRight() && remoteCallCount === 1 && offlineRes.value.length === 1,
      "data/repositories/document_repository_impl: returns cached data with zero remote calls when offline"
    );
  }

  return { passed, failed, results };
}

