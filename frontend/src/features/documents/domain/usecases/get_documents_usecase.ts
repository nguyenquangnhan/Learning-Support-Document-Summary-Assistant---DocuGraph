/**
 * DocuGraph AI – Domain Use Case: GetDocumentsUseCase
 * Course Alignment: Week 9 (Single Responsibility UseCase)
 */
import { Either, Failure } from "../../../../core/errors/failures";
import { DocumentEntity } from "../entities/document_entity";
import { DocumentRepository } from "../repositories/document_repository";

export class GetDocumentsUseCase {
  private readonly repository: DocumentRepository;

  constructor(repository: DocumentRepository) {
    this.repository = repository;
  }

  public async call(): Promise<Either<Failure, DocumentEntity[]>> {
    return await this.repository.getAllDocuments();
  }
}

