/**
 * DocuGraph AI – Domain Use Case: SyncOfflineDocumentsUseCase
 * Course Alignment: Week 10 (Offline-First Bi-Directional Cloud Sync)
 */
import { Either, Failure } from "../../../../core/errors/failures";
import { DocumentRepository } from "../repositories/document_repository";

export class SyncOfflineDocumentsUseCase {
  private readonly repository: DocumentRepository;

  constructor(repository: DocumentRepository) {
    this.repository = repository;
  }

  public async call(): Promise<Either<Failure, number>> {
    return await this.repository.syncPendingOfflineQueue();
  }
}

