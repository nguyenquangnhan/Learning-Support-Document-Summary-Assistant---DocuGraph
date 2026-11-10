/**
 * DocuGraph AI – Data Layer: DocumentModel
 * Course Alignment: Week 9 Slide 15 (Separating Domain Entities from Data Models with fromJson/toJson)
 */
import { DocumentEntity } from "../../domain/entities/document_entity";

export class DocumentModel extends DocumentEntity {
  constructor(params: ConstructorParameters<typeof DocumentEntity>[0]) {
    super(params);
  }

  public static fromJson(json: Record<string, any>): DocumentModel {
    return new DocumentModel({
      id: String(json.id || json.document_id || ""),
      title: String(json.title || "Tài liệu không tên"),
      fileType: String(json.file_type || json.fileType || "PDF"),
      fileSize: json.file_size ?? json.fileSize ?? undefined,
      numPages: Number(json.num_pages ?? json.numPages ?? 1),
      status: String(json.status || "ready"),
      summaryTldr: json.summary_tldr ?? json.summaryTldr ?? undefined,
      summaryDetailed: json.summary_detailed ?? json.summaryDetailed ?? undefined,
      createdAt: String(json.created_at || json.createdAt || new Date().toISOString()),
      updatedAt: String(json.updated_at || json.updatedAt || json.created_at || new Date().toISOString()),
      isOfflinePending: Boolean(json.isOfflinePending ?? false),
      ocrLatencyMs: json.ocr_latency_ms ?? json.ocrLatencyMs ?? undefined,
      ocrConfidence: json.ocr_confidence ?? json.ocrConfidence ?? undefined,
    });
  }

  public toJson(): Record<string, any> {
    return {
      id: this.id,
      title: this.title,
      file_type: this.fileType,
      file_size: this.fileSize,
      num_pages: this.numPages,
      status: this.status,
      summary_tldr: this.summaryTldr,
      summary_detailed: this.summaryDetailed,
      created_at: this.createdAt,
      updated_at: this.updatedAt,
      isOfflinePending: this.isOfflinePending,
      ocr_latency_ms: this.ocrLatencyMs,
      ocr_confidence: this.ocrConfidence,
    };
  }

  public static fromEntity(entity: DocumentEntity): DocumentModel {
    return new DocumentModel({
      id: entity.id,
      title: entity.title,
      fileType: entity.fileType,
      fileSize: entity.fileSize,
      numPages: entity.numPages,
      status: entity.status,
      summaryTldr: entity.summaryTldr,
      summaryDetailed: entity.summaryDetailed,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
      isOfflinePending: entity.isOfflinePending,
      ocrLatencyMs: entity.ocrLatencyMs,
      ocrConfidence: entity.ocrConfidence,
    });
  }
}

