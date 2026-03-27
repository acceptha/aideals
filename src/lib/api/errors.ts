// src/lib/api/errors.ts
// AppError 기반 클래스 및 도메인별 서브클래스
// 상세 규칙: PROJECT_RULES.md > 4. 에러 코드 체계

import { ERROR_STATUS_MAP, type ErrorCode } from "./errorCodes";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: ErrorCode = "INTERNAL_SERVER_ERROR",
    public details?: Record<string, unknown>,
  ) {
    super(message);
    this.name = "AppError";
  }

  /** 에러 코드만 지정하면 상태 코드가 자동 결정된다 */
  static fromCode(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): AppError {
    return new AppError(message, ERROR_STATUS_MAP[code], code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code: ErrorCode) {
    super(`${resource}을(를) 찾을 수 없습니다`, ERROR_STATUS_MAP[code], code);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = "MISSING_REQUIRED_FIELD",
    details?: Record<string, unknown>,
  ) {
    super(message, ERROR_STATUS_MAP[code], code, details);
    this.name = "ValidationError";
  }
}
