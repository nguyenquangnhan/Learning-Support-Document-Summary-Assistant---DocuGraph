/**
 * DocuGraph AI – Data Layer: ScannerRepositoryImpl
 * Course Alignment: Week 9 (Repository Implementation) & Week 11 (ML Kit OCR + Heuristic Regex Parser)
 */
import { Either, Failure, left, right, OcrFailure, Unit, unit } from "../../../../core/errors/failures";
import { OcrScanResult } from "../../domain/entities/ocr_scan_result";
import { ScannerRepository } from "../../domain/repositories/scanner_repository";
import { MlKitOcrDataSource } from "../datasources/mlkit_ocr_datasource";
import { HeuristicRegexParser } from "../utils/heuristic_regex_parser";

export class ScannerRepositoryImpl implements ScannerRepository {
  private readonly ocrDataSource: MlKitOcrDataSource;

  constructor(ocrDataSource: MlKitOcrDataSource) {
    this.ocrDataSource = ocrDataSource;
  }

  public async recognizeTextFromImage(imageUri: string): Promise<Either<Failure, OcrScanResult>> {
    try {
      const rawOutput = await this.ocrDataSource.recognizeText(imageUri);
      const parsed = HeuristicRegexParser.parse(rawOutput.text);

      if (!parsed.cleanedText) {
        return left(new OcrFailure("Không phát hiện được văn bản trong khung hình. Vui lòng giữ chắc camera."));
      }

      const scanResult = new OcrScanResult({
        id: `scan_${Date.now()}`,
        imageUri,
        rawText: rawOutput.text,
        cleanedText: parsed.cleanedText,
        detectedTitle: parsed.detectedTitle,
        detectedFormulas: parsed.detectedFormulas,
        detectedDates: parsed.detectedDates,
        detectedKeywords: parsed.detectedKeywords,
        confidence: parsed.confidence,
        latencyMs: rawOutput.latencyMs,
        blocks: rawOutput.blocks,
        deviceEngine: rawOutput.deviceEngine,
      });

      return right(scanResult);
    } catch (error: any) {
      return left(new OcrFailure(error?.message || "Lỗi thực thi On-Device ML Kit OCR"));
    }
  }

  public async dispose(): Promise<Either<Failure, Unit>> {
    try {
      await this.ocrDataSource.close();
      return right(unit);
    } catch (error: any) {
      return left(new OcrFailure(error?.message || "Không thể giải phóng bộ nhớ OCR native"));
    }
  }
}

