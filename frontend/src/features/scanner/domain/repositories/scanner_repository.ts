/**
 * DocuGraph AI – Domain Repository Contract: ScannerRepository
 * Course Alignment: Week 9 (Domain Repository Contract Interface)
 */
import { Either, Failure, Unit } from "../../../../core/errors/failures";
import { OcrScanResult } from "../entities/ocr_scan_result";

export interface ScannerRepository {
  recognizeTextFromImage(imageUri: string): Promise<Either<Failure, OcrScanResult>>;
  dispose(): Promise<Either<Failure, Unit>>;
}

