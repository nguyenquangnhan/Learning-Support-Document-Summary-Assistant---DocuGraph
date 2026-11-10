/**
 * DocuGraph AI – Domain Use Case: GetDocumentDetailUseCase
 */
import { Either, Failure, left, ValidationFailure } from "../../../../core/errors/failures";
import { DocumentEntity } from "../entities/document_entity";
import { DocumentRepository } from "../repositories/document_repository";

export class GetDocumentDetailUseCase {
  private readonly repository: DocumentRepository;

  constructor(repository: DocumentRepository) {
    this.repository = repository;
  }

  public async call(documentId: string): Promise<Either<Failure, DocumentEntity>> {
    if (!documentId || documentId.trim().length === 0) {
      return left(new ValidationFailure("Mã tài liệu (documentId) không hợp lệ"));
    }
    return await this.repository.getDocumentById(documentId.trim());
  }
}

