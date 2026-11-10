
/**
 * DocuGraph AI – Data Layer: DocumentLocalDataSource
 * Course Alignment:
 *  - Week 9 Slide 16 (LocalDataSource with CacheException)
 *  - Week 10 Slide 5-6 (Offline-First Synchronization, Sync Queue & Last-Write-Wins LWW)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PendingOcrSyncPayload } from "../../domain/entities/document_entity";
import { DocumentModel } from "../models/document_model";

export class CacheException extends Error {
  constructor(message: string = "No offline cached data available") {
    super(message);
    this.name = "CacheException";
  }
}

export interface DocumentLocalDataSource {
  getCachedDocuments(): Promise<DocumentModel[]>;
  getCachedDocumentById(id: string): Promise<DocumentModel>;
  cacheDocuments(docs: DocumentModel[]): Promise<void>;
  upsertCachedDocument(doc: DocumentModel): Promise<void>;
  removeCachedDocument(id: string): Promise<void>;
  enqueueOfflineOcrSync(payload: PendingOcrSyncPayload): Promise<DocumentModel>;
  getOfflineSyncQueue(): Promise<PendingOcrSyncPayload[]>;
  clearSyncedItemFromQueue(id: string): Promise<void>;
}

const CACHE_KEY_DOCS = "@docugraph/cached_documents_v3_clean";
const CACHE_KEY_SYNC_QUEUE = "@docugraph/offline_ocr_sync_queue_v3_clean";
const isServer = typeof window === "undefined";

export class DocumentLocalDataSourceImpl implements DocumentLocalDataSource {
  private memoryDocsCache: DocumentModel[] = [];
  private memorySyncQueue: PendingOcrSyncPayload[] = [];

  public async getCachedDocuments(): Promise<DocumentModel[]> {
    try {
      if (!isServer) {
        const raw = await AsyncStorage.getItem(CACHE_KEY_DOCS);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.memoryDocsCache = parsed.map((item) => DocumentModel.fromJson(item));
          }
        }
      }
    } catch {
      // Fallback to in-memory cache
    }

    return this.memoryDocsCache;
  }

  public async getCachedDocumentById(id: string): Promise<DocumentModel> {
    const docs = await this.getCachedDocuments();
    const found = docs.find((d) => d.id === id);
    if (!found) {
      throw new CacheException(`Không tìm thấy tài liệu ${id} trong bộ nhớ đệm ngoại tuyến`);
    }
    return found;
  }

  /**
   * Merges incoming documents with existing local cache using Last-Write-Wins (LWW)
   * deterministic timestamp resolution (Week 10 Slide 6).
   */
  public async cacheDocuments(remoteDocs: DocumentModel[]): Promise<void> {
    const mergedMap = new Map<string, DocumentModel>();

    // Keep any offline-pending local records first
    for (const localDoc of this.memoryDocsCache) {
      if (localDoc.isOfflinePending) {
        mergedMap.set(localDoc.id, localDoc);
      }
    }

    // Apply Last-Write-Wins (LWW) merge for remote documents
    for (const remoteDoc of remoteDocs) {
      const existing = mergedMap.get(remoteDoc.id);
      if (!existing) {
        mergedMap.set(remoteDoc.id, remoteDoc);
      } else {
        const remoteTime = new Date(remoteDoc.updatedAt).getTime() || 0;
        const localTime = new Date(existing.updatedAt).getTime() || 0;
        if (remoteTime >= localTime) {
          mergedMap.set(remoteDoc.id, remoteDoc);
        }
      }
    }

    this.memoryDocsCache = Array.from(mergedMap.values()).sort(
      (a, b) => (new Date(b.createdAt).getTime() || 0) - (new Date(a.createdAt).getTime() || 0)
    );

    if (!isServer) {
      try {
        await AsyncStorage.setItem(
          CACHE_KEY_DOCS,
          JSON.stringify(this.memoryDocsCache.map((d) => d.toJson()))
        );
      } catch {
        // Ignore storage quota warning
      }
    }
  }

  public async upsertCachedDocument(doc: DocumentModel): Promise<void> {
    const existingIdx = this.memoryDocsCache.findIndex((d) => d.id === doc.id);
    if (existingIdx >= 0) {
      const existing = this.memoryDocsCache[existingIdx];
      const newTime = new Date(doc.updatedAt).getTime() || Date.now();
      const oldTime = new Date(existing.updatedAt).getTime() || 0;
      // Last-Write-Wins (LWW)
      if (newTime >= oldTime) {
        this.memoryDocsCache[existingIdx] = doc;
      }
    } else {
      this.memoryDocsCache = [doc, ...this.memoryDocsCache];
    }

    if (!isServer) {
      try {
        await AsyncStorage.setItem(
          CACHE_KEY_DOCS,
          JSON.stringify(this.memoryDocsCache.map((d) => d.toJson()))
        );
      } catch {
        // Ignore
      }
    }
  }

  public async removeCachedDocument(id: string): Promise<void> {
    this.memoryDocsCache = this.memoryDocsCache.filter((d) => d.id !== id);
    this.memorySyncQueue = this.memorySyncQueue.filter((item) => item.id !== id);
    if (!isServer) {
      try {
        await AsyncStorage.setItem(
          CACHE_KEY_DOCS,
          JSON.stringify(this.memoryDocsCache.map((d) => d.toJson()))
        );
        await AsyncStorage.setItem(CACHE_KEY_SYNC_QUEUE, JSON.stringify(this.memorySyncQueue));
      } catch {
        // Ignore
      }
    }
  }

  public async enqueueOfflineOcrSync(payload: PendingOcrSyncPayload): Promise<DocumentModel> {
    const paragraphs = payload.extractedText
      .split(/\n+/)
      .map((p) => p.trim())
      .filter((p) => p.length > 10);

    const tldr =
      paragraphs.length > 0
        ? paragraphs.slice(0, 2).join("\n\n")
        : payload.extractedText.slice(0, 300);

    const detailed =
      "### Bản quét On-Device ML Kit OCR (Đã lưu Offline):\n\n" +
      (paragraphs.length > 0
        ? paragraphs.map((p) => `• ${p}`).join("\n\n")
        : payload.extractedText);

    const offlineDoc = new DocumentModel({
      id: payload.id,
      title: payload.title,
      fileType: "OCR_MLKIT",
      fileSize: payload.extractedText.length,
      numPages: Math.max(1, Math.ceil(payload.extractedText.length / 1200)),
      status: "ready",
      summaryTldr: tldr,
      summaryDetailed: detailed,
      createdAt: payload.updatedAt,
      updatedAt: payload.updatedAt,
      isOfflinePending: true,
      ocrLatencyMs: payload.latencyMs,
      ocrConfidence: payload.confidence,
    });

    await this.upsertCachedDocument(offlineDoc);

    const queue = await this.getOfflineSyncQueue();
    const filtered = queue.filter((item) => item.id !== payload.id);
    this.memorySyncQueue = [payload, ...filtered];

    if (!isServer) {
      try {
        await AsyncStorage.setItem(CACHE_KEY_SYNC_QUEUE, JSON.stringify(this.memorySyncQueue));
      } catch {
        // Ignore
      }
    }

    return offlineDoc;
  }

  public async getOfflineSyncQueue(): Promise<PendingOcrSyncPayload[]> {
    if (!isServer) {
      try {
        const raw = await AsyncStorage.getItem(CACHE_KEY_SYNC_QUEUE);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.memorySyncQueue = parsed;
          }
        }
      } catch {
        // Ignore
      }
    }
    return this.memorySyncQueue;
  }

  public async clearSyncedItemFromQueue(id: string): Promise<void> {
    this.memorySyncQueue = this.memorySyncQueue.filter((item) => item.id !== id);
    this.memoryDocsCache = this.memoryDocsCache.filter((doc) => doc.id !== id);

    if (!isServer) {
      try {
        await AsyncStorage.setItem(CACHE_KEY_SYNC_QUEUE, JSON.stringify(this.memorySyncQueue));
        await AsyncStorage.setItem(
          CACHE_KEY_DOCS,
          JSON.stringify(this.memoryDocsCache.map((d) => d.toJson()))
        );
      } catch {
        // Ignore
      }
    }
  }
}

