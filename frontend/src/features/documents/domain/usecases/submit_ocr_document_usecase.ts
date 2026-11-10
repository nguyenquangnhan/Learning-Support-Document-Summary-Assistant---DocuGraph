/**
 * DocuGraph AI – Domain Use Case: SubmitOcrDocumentUseCase
 * Course Alignment: Week 11 (Human-in-the-Loop Review Confirmation -> Persistence)
 */
import { Either, Failure, left, ValidationFailure } from "../../../../core/errors/failures";
import { DocumentEntity, PendingOcrSyncPayload } from "../entities/document_entity";
import { DocumentRepository } from "../repositories/document_repository";

export class SubmitOcrDocumentUseCase {
  private readonly repository: DocumentRepository;

  constructor(repository: DocumentRepository) {
    this.repository = repository;
  }

  public async call(payload: PendingOcrSyncPayload): Promise<Either<Failure, DocumentEntity>> {
    if (!payload.title || payload.title.trim().length === 0) {
      return left(new ValidationFailure("Tiêu đề tài liệu không được để trống"));
    }
    if (!payload.extractedText || payload.extractedText.trim().length < 5) {
      return left(new ValidationFailure("Nội dung văn bản OCR sau khi xác nhận phải có ít nhất 5 ký tự"));
    }
    return await this.repository.submitVerifiedOcrDocument({
      ...payload,
      title: payload.title.trim(),
      extractedText: payload.extractedText.trim(),
    });
  }
}

