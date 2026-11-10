/**
 * DocuGraph AI – Functional Error Handling & Either<L, R> Pattern
 * Course Alignment: Week 9 (Mobile Clean Architecture - Part 4: Functional Error Handling)
 * Zero UI / HTTP / Database imports allowed in Domain & Core Error contracts.
 */

export abstract class Failure {
  public readonly message: string;
  public readonly code: string;

  constructor(message: string, code: string = "FAILURE") {
    this.message = message;
    this.code = code;
  }
}

export class ServerFailure extends Failure {
  constructor(message: string = "Lỗi kết nối máy chủ đám mây (Server Error)") {
    super(message, "SERVER_FAILURE");
  }
}

export class CacheFailure extends Failure {
  constructor(message: string = "Không tìm thấy dữ liệu lưu trữ ngoại tuyến (Offline Cache Empty)") {
    super(message, "CACHE_FAILURE");
  }
}

export class NetworkFailure extends Failure {
  constructor(message: string = "Thiết bị đang ngoại tuyến (Offline Mode)") {
    super(message, "NETWORK_FAILURE");
  }
}

export class ValidationFailure extends Failure {
  constructor(message: string = "Dữ liệu đầu vào không hợp lệ") {
    super(message, "VALIDATION_FAILURE");
  }
}

export class OcrFailure extends Failure {
  constructor(message: string = "Không thể nhận diện văn bản từ ảnh (ML Kit OCR Error)") {
    super(message, "OCR_FAILURE");
  }
}

export class AuthFailure extends Failure {
  constructor(message: string = "Phiên đăng nhập hết hạn hoặc không hợp lệ") {
    super(message, "AUTH_FAILURE");
  }
}

/**
 * The Either<L, R> Result Pattern (Week 9 Slide 24-25)
 * Left = Error (Failure), Right = Success (Data Payload)
 */
export type Either<L, R> = Left<L, R> | Right<L, R>;

export class Left<L, R> {
  readonly value: L;

  constructor(value: L) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return true;
  }

  isRight(): this is Right<L, R> {
    return false;
  }

  fold<T>(onLeft: (left: L) => T, _onRight: (right: R) => T): T {
    return onLeft(this.value);
  }
}

export class Right<L, R> {
  readonly value: R;

  constructor(value: R) {
    this.value = value;
  }

  isLeft(): this is Left<L, R> {
    return false;
  }

  isRight(): this is Right<L, R> {
    return true;
  }

  fold<T>(_onLeft: (left: L) => T, onRight: (right: R) => T): T {
    return onRight(this.value);
  }
}

export const left = <L, R>(l: L): Either<L, R> => new Left<L, R>(l);
export const right = <L, R>(r: R): Either<L, R> => new Right<L, R>(r);

/**
 * Unit represents a void return value in functional programming (Week 9 Slide 14)
 */
export class Unit {
  private static readonly _instance = new Unit();
  private constructor() {}
  public static get instance(): Unit {
    return Unit._instance;
  }
}

export const unit = Unit.instance;

