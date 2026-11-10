/**
 * DocuGraph AI – Domain Repository Contract: DocumentRepository
 * Course Alignment: Week 9 (Domain Repository Contract Interface)
 */
import { Either, Failure } from "../../../../core/errors/failures";
import { DocumentEntity, PendingOcrSyncPayload } from "../entities/document_entity";

export interface DocumentRepository {
  getAllDocuments(): Promise<Either<Failure, DocumentEntity[]>>;
  getDocumentById(id: string): Promise<Either<Failure, DocumentEntity>>;
  submitVerifiedOcrDocument(payload: PendingOcrSyncPayload): Promise<Either<Failure, DocumentEntity>>;
  syncPendingOfflineQueue(): Promise<Either<Failure, number>>;
  getPendingSyncCount(): Promise<number>;
}

