/**
 * DocuGraph AI – Domain Entity: DocumentEntity
 * Course Alignment: Week 9 (Pure Domain Layer - ZERO UI/HTTP/DB dependencies)
 */

export interface PendingOcrSyncPayload {
  id: string;
  title: string;
  extractedText: string;
  confidence: number;
  latencyMs: number;
  deviceEngine: string;
  updatedAt: string; // Used for Last-Write-Wins (LWW) conflict resolution (Week 10 Slide 6)
}

export class DocumentEntity {
  public readonly id: string;
  public readonly title: string;
  public readonly fileType: string;
  public readonly fileSize?: number;
  public readonly numPages: number;
  public readonly status: string;
  public readonly summaryTldr?: string;
  public readonly summaryDetailed?: string;
  public readonly createdAt: string;
  public readonly updatedAt: string;
  public readonly isOfflinePending: boolean;
  public readonly ocrLatencyMs?: number;
  public readonly ocrConfidence?: number;

  constructor(params: {
    id: string;
    title: string;
    fileType: string;
    fileSize?: number;
    numPages: number;
    status: string;
    summaryTldr?: string;
    summaryDetailed?: string;
    createdAt: string;
    updatedAt?: string;
    isOfflinePending?: boolean;
    ocrLatencyMs?: number;
    ocrConfidence?: number;
  }) {
    this.id = params.id;
    this.title = params.title;
    this.fileType = params.fileType;
    this.fileSize = params.fileSize;
    this.numPages = params.numPages;
    this.status = params.status;
    this.summaryTldr = params.summaryTldr;
    this.summaryDetailed = params.summaryDetailed;
    this.createdAt = params.createdAt;
    this.updatedAt = params.updatedAt || params.createdAt;
    this.isOfflinePending = params.isOfflinePending ?? false;
    this.ocrLatencyMs = params.ocrLatencyMs;
    this.ocrConfidence = params.ocrConfidence;
  }

  /** Business rule inside Domain Entity (Week 9 Slide 12) */
  public get isReady(): boolean {
    return this.status.toLowerCase() === "ready";
  }

  public get isOcrDocument(): boolean {
    return this.fileType.toUpperCase().includes("OCR");
  }
}

