/**
 * DocuGraph AI – Data Layer: DocumentRepositoryImpl (Single Source of Truth - SSOT)
 * Course Alignment:
 *  - Week 9 Slide 19-20 (Repository Pattern coordinating RemoteDataSource, LocalDataSource, NetworkInfo)
 *  - Week 10 Slide 5-6 (Offline-First Sync Queue & Last-Write-Wins Conflict Resolution)
 */
import {
  CacheFailure,
  Either,
  Failure,
  left,
  right,
  ServerFailure,
} from "../../../../core/errors/failures";
import { NetworkInfo } from "../../../../core/network/network_info";
import { DocumentEntity, PendingOcrSyncPayload } from "../../domain/entities/document_entity";
import { DocumentRepository } from "../../domain/repositories/document_repository";
import { DocumentLocalDataSource } from "../datasources/document_local_datasource";
import { DocumentRemoteDataSource } from "../datasources/document_remote_datasource";

export class DocumentRepositoryImpl implements DocumentRepository {
  private readonly remoteDataSource: DocumentRemoteDataSource;
  private readonly localDataSource: DocumentLocalDataSource;
  private readonly networkInfo: NetworkInfo;

  constructor(params: {
    remoteDataSource: DocumentRemoteDataSource;
    localDataSource: DocumentLocalDataSource;
    networkInfo: NetworkInfo;
  }) {
    this.remoteDataSource = params.remoteDataSource;
    this.localDataSource = params.localDataSource;
    this.networkInfo = params.networkInfo;
  }

  public async getAllDocuments(): Promise<Either<Failure, DocumentEntity[]>> {
    const isOnline = await this.networkInfo.isConnected();

    if (isOnline) {
      try {
        // Replay any pending offline OCR scans before fetching latest list
        await this.syncPendingOfflineQueue();

        const remoteItems = await this.remoteDataSource.fetchDocuments();
        await this.localDataSource.cacheDocuments(remoteItems);

        try {
          const mergedCache = await this.localDataSource.getCachedDocuments();
          return right(mergedCache);
        } catch {
          return right(remoteItems);
        }
      } catch (e: any) {
        // Network-First with transparent fallback to Local Cache on ServerException (Week 9 Slide 21)
        try {
          const cachedItems = await this.localDataSource.getCachedDocuments();
          return right(cachedItems);
        } catch {
          return left(new ServerFailure(e?.message || "Không thể kết nối máy chủ đám mây"));
        }
      }
    } else {
      try {
        const localItems = await this.localDataSource.getCachedDocuments();
        return right(localItems);
      } catch (e: any) {
        return left(new CacheFailure(e?.message || "Không có dữ liệu lưu trữ ngoại tuyến (Offline Cache Empty)"));
      }
    }
  }

  public async getDocumentById(id: string): Promise<Either<Failure, DocumentEntity>> {
    const isOnline = await this.networkInfo.isConnected();

    if (isOnline && !id.startsWith("offline_")) {
      try {
        const remoteDoc = await this.remoteDataSource.fetchDocumentById(id);
        await this.localDataSource.upsertCachedDocument(remoteDoc);
        return right(remoteDoc);
      } catch (e: any) {
        try {
          const cachedDoc = await this.localDataSource.getCachedDocumentById(id);
          return right(cachedDoc);
        } catch {
          return left(new ServerFailure(e?.message || "Không tìm thấy tài liệu trên máy chủ"));
        }
      }
    } else {
      try {
        const localDoc = await this.localDataSource.getCachedDocumentById(id);
        return right(localDoc);
      } catch (e: any) {
        return left(new CacheFailure(e?.message || "Không tìm thấy tài liệu trong bộ nhớ ngoại tuyến"));
      }
    }
  }

  public async submitVerifiedOcrDocument(
    payload: PendingOcrSyncPayload
  ): Promise<Either<Failure, DocumentEntity>> {
    const isOnline = await this.networkInfo.isConnected();

    if (isOnline) {
      try {
        const syncedDoc = await this.remoteDataSource.uploadOcrDocument(payload);
        await this.localDataSource.upsertCachedDocument(syncedDoc);
        return right(syncedDoc);
      } catch {
        // Fallback to Offline Sync Queue if server fails mid-upload
        const offlineDoc = await this.localDataSource.enqueueOfflineOcrSync(payload);
        return right(offlineDoc);
      }
    } else {
      try {
        const offlineDoc = await this.localDataSource.enqueueOfflineOcrSync(payload);
        return right(offlineDoc);
      } catch (e: any) {
        return left(new CacheFailure(e?.message || "Không thể lưu bản quét OCR vào bộ nhớ ngoại tuyến"));
      }
    }
  }

  public async syncPendingOfflineQueue(): Promise<Either<Failure, number>> {
    const isOnline = await this.networkInfo.isConnected();
    if (!isOnline) {
      return left(new CacheFailure("Thiết bị đang ở chế độ ngoại tuyến, chưa thể đồng bộ lên đám mây"));
    }

    try {
      const queue = await this.localDataSource.getOfflineSyncQueue();
      if (queue.length === 0) {
        return right(0);
      }

      let syncedCount = 0;
      for (const item of queue) {
        try {
          const syncedDoc = await this.remoteDataSource.uploadOcrDocument(item);
          await this.localDataSource.clearSyncedItemFromQueue(item.id);
          await this.localDataSource.upsertCachedDocument(syncedDoc);
          syncedCount++;
        } catch {
          // Keep item in queue for next retry
        }
      }

      return right(syncedCount);
    } catch (e: any) {
      return left(new ServerFailure(e?.message || "Lỗi đồng bộ hàng đợi ngoại tuyến"));
    }
  }

  public async getPendingSyncCount(): Promise<number> {
    try {
      const queue = await this.localDataSource.getOfflineSyncQueue();
      return queue.length;
    } catch {
      return 0;
    }
  }
}

