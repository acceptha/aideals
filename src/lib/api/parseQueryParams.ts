// src/lib/api/parseQueryParams.ts
// 쿼리 파라미터 파서 및 검증 유틸
// 실패 시 ValidationError throw

import { NextRequest } from "next/server";
import { ValidationError } from "./errors";
import type { ErrorCode } from "./errorCodes";

export interface ParamRule {
  type: "string" | "number" | "boolean";
  required?: boolean;
  default?: string | number | boolean;
  enum?: string[];
  min?: number;
  max?: number;
}

export type ParamRules = Record<string, ParamRule>;

export const parseQueryParams = <T>(req: NextRequest, rules: ParamRules): T => {
  const searchParams = req.nextUrl.searchParams;
  const result: Record<string, unknown> = {};

  for (const [key, rule] of Object.entries(rules)) {
    const raw = searchParams.get(key);

    if (raw === null) {
      if (rule.required) {
        throw new ValidationError(
          `필수 파라미터 '${key}'가 누락되었습니다`,
          "MISSING_REQUIRED_FIELD",
          { field: key },
        );
      }
      if (rule.default !== undefined) {
        result[key] = rule.default;
      }
      continue;
    }

    if (rule.type === "number") {
      const num = Number(raw);
      if (isNaN(num)) {
        throw new ValidationError(
          `'${key}'는 숫자여야 합니다`,
          "INVALID_PAGINATION",
          { field: key, received: raw },
        );
      }
      if (rule.min !== undefined && num < rule.min) {
        const code: ErrorCode =
          key === "page" || key === "limit"
            ? "INVALID_PAGINATION"
            : "INVALID_FILTER_VALUE";
        throw new ValidationError(
          `'${key}'는 최솟값 ${rule.min} 이상이어야 합니다`,
          code,
          { field: key, min: rule.min, received: num },
        );
      }
      if (rule.max !== undefined && num > rule.max) {
        const code: ErrorCode =
          key === "page" || key === "limit"
            ? "INVALID_PAGINATION"
            : "INVALID_FILTER_VALUE";
        throw new ValidationError(
          `'${key}'는 최댓값 ${rule.max} 이하여야 합니다`,
          code,
          { field: key, max: rule.max, received: num },
        );
      }
      result[key] = num;
      continue;
    }

    if (rule.type === "boolean") {
      result[key] = raw === "true" || raw === "1";
      continue;
    }

    // string
    if (rule.enum && !rule.enum.includes(raw)) {
      const code: ErrorCode =
        key === "sort" ? "INVALID_SORT_VALUE" : "INVALID_FILTER_VALUE";
      throw new ValidationError(
        `'${key}'의 값 '${raw}'은(는) 허용되지 않습니다`,
        code,
        { field: key, allowed: rule.enum, received: raw },
      );
    }
    result[key] = raw;
  }

  return result as T;
};
