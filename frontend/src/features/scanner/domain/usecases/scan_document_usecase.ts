/**
 * DocuGraph AI – Domain Use Case: ScanDocumentUseCase
 * Course Alignment:
 *  - Week 9 (Single Responsibility UseCase with call() & ValidationFailure)
 *  - Week 11 Slide 42 (Frame Throttling: 400ms / 2.5 FPS + Concurrency Lock _isProcessing)
 */
import { Either, Failure, left, ValidationFailure, Unit } from "../../../../core/errors/failures";
import { OcrScanResult } from "../entities/ocr_scan_result";
import { ScannerRepository } from "../repositories/scanner_repository";

export class ScanDocumentUseCase {
  private readonly repository: ScannerRepository;
  private _isProcessing: boolean = false;
  private _lastScanTimestamp: number = 0;
  public static readonly THROTTLE_INTERVAL_MS = 400; // 2.5 FPS per Week 11 Slide 40 & 42

  constructor(repository: ScannerRepository) {
    this.repository = repository;
  }

  public get isProcessing(): boolean {
    return this._isProcessing;
  }

  /**
   * Executes on-device OCR with 400ms frame throttling and concurrency lock.
   * Prevents the "30 FPS Trap" OOM crash described in Week 11 Slide 41.
   */
  public async call(imageUri: string, bypassThrottle: boolean = false): Promise<Either<Failure, OcrScanResult>> {
    if (!imageUri || imageUri.trim().length === 0) {
      return left(new ValidationFailure("Đường dẫn ảnh quét (imageUri) không được để trống"));
    }

    const now = Date.now();

    // 1. Throttle: Only process once every 400ms (2.5 FPS) unless manual single-shot capture
    if (!bypassThrottle && now - this._lastScanTimestamp < ScanDocumentUseCase.THROTTLE_INTERVAL_MS) {
      return left(
        new ValidationFailure(
          `Frame dropped by Throttler (2.5 FPS / ${ScanDocumentUseCase.THROTTLE_INTERVAL_MS}ms budget)`
        )
      );
    }

    // 2. Concurrency Lock: Drop frame if previous OCR run is still active
    if (this._isProcessing) {
      return left(new ValidationFailure("OCR recognizer đang bận xử lý frame trước đó"));
    }

    this._isProcessing = true;
    this._lastScanTimestamp = now;

    try {
      return await this.repository.recognizeTextFromImage(imageUri.trim());
    } finally {
      this._isProcessing = false;
    }
  }

  /**
   * Mandatory native C++ heap release when screen unmounts (Week 11 Slide 16 & 50)
   */
  public async dispose(): Promise<Either<Failure, Unit>> {
    this._isProcessing = false;
    return await this.repository.dispose();
  }
}

