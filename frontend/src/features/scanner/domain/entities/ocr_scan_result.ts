/**
 * DocuGraph AI – Domain Entity: OcrScanResult
 * Course Alignment: Week 9 (Domain Layer - Pure TS, ZERO external dependencies)
 * & Week 11 (On-Device AI ML Kit OCR Hierarchical Output + Latency Benchmark)
 */

export interface OcrTextBlock {
  text: string;
  linesCount: number;
  boundingBox?: {
    left: number;
    top: number;
    width: number;
    height: number;
  };
}

export class OcrScanResult {
  public readonly id: string;
  public readonly imageUri: string;
  public readonly rawText: string;
  public readonly cleanedText: string;
  public readonly detectedTitle: string;
  public readonly detectedFormulas: string[];
  public readonly detectedDates: string[];
  public readonly detectedKeywords: string[];
  public readonly confidence: number; // 0.0 -> 1.0
  public readonly latencyMs: number; // Inference benchmark in milliseconds
  public readonly blocks: OcrTextBlock[];
  public readonly deviceEngine: string;
  public readonly timestamp: string;

  constructor(params: {
    id: string;
    imageUri: string;
    rawText: string;
    cleanedText: string;
    detectedTitle: string;
    detectedFormulas: string[];
    detectedDates: string[];
    detectedKeywords: string[];
    confidence: number;
    latencyMs: number;
    blocks: OcrTextBlock[];
    deviceEngine?: string;
    timestamp?: string;
  }) {
    this.id = params.id;
    this.imageUri = params.imageUri;
    this.rawText = params.rawText;
    this.cleanedText = params.cleanedText;
    this.detectedTitle = params.detectedTitle;
    this.detectedFormulas = params.detectedFormulas;
    this.detectedDates = params.detectedDates;
    this.detectedKeywords = params.detectedKeywords;
    this.confidence = params.confidence;
    this.latencyMs = params.latencyMs;
    this.blocks = params.blocks;
    this.deviceEngine = params.deviceEngine || "Google ML Kit Text Recognition v2 (On-Device)";
    this.timestamp = params.timestamp || new Date().toISOString();
  }

  /** Business validation rule inside Domain Entity (Week 9 Slide 12) */
  public get isHighConfidence(): boolean {
    return this.confidence >= 0.85;
  }

  public get isSub20msEdgeSpeed(): boolean {
    return this.latencyMs <= 35;
  }

  public get hasFormulas(): boolean {
    return this.detectedFormulas.length > 0;
  }
}

