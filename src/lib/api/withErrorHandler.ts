// src/lib/api/withErrorHandler.ts
// API Route 에러 처리 래퍼
// AppError → { status, code, message, details? } 응답
// 나머지 → 500 INTERNAL_SERVER_ERROR

import { NextRequest, NextResponse } from "next/server";
import { AppError } from "./errors";
import { logger } from "../logger";

export interface RouteContext {
  params: Promise<Record<string, string>>;
}

type RouteHandler = (
  req: NextRequest,
  ctx: RouteContext,
) => Promise<NextResponse>;

export const withErrorHandler =
  (handler: RouteHandler): RouteHandler =>
  async (req: NextRequest, ctx: RouteContext): Promise<NextResponse> => {
    try {
      return await handler(req, ctx);
    } catch (err) {
      if (err instanceof AppError) {
        return NextResponse.json(
          {
            status: err.statusCode,
            code: err.code,
            message: err.message,
            ...(err.details && { details: err.details }),
          },
          { status: err.statusCode },
        );
      }

      logger.error("예상치 못한 에러", {
        context: "withErrorHandler",
        data: { error: err instanceof Error ? err.message : String(err), stack: err instanceof Error ? err.stack : undefined },
      });
      return NextResponse.json(
        {
          status: 500,
          code: "INTERNAL_SERVER_ERROR",
          message: "서버 내부 오류가 발생했습니다",
        },
        { status: 500 },
      );
    }
  };
