// src/app/api/cron/crawl/route.ts
// GET /api/cron/crawl — Vercel Cron이 호출하는 가격 크롤링 엔드포인트
//
// Vercel Cron은 vercel.json의 crons 설정에 따라 이 엔드포인트를 주기적으로 호출한다.
// Authorization 헤더의 Bearer 토큰으로 CRON_SECRET을 검증하여 외부 호출을 차단한다.

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { AppError } from "@/lib/api/errors";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import { crawlAll } from "@/lib/scraper/crawl";

export const maxDuration = 60; // Vercel Pro: 최대 60초

export const GET = withErrorHandler(async (req: NextRequest) => {
  // Vercel Cron은 Authorization: Bearer <CRON_SECRET> 헤더를 자동으로 포함한다
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!env.CRON_SECRET || token !== env.CRON_SECRET) {
    logger.warn("Cron 인증 실패", {
      context: "cron:crawl",
      data: { hasToken: !!token, hasSecret: !!env.CRON_SECRET },
    });
    throw AppError.fromCode("AUTH_REQUIRED", "인증이 필요합니다");
  }

  logger.info("Cron 크롤링 시작", { context: "cron:crawl" });

  const summary = await crawlAll();

  logger.info("Cron 크롤링 완료", {
    context: "cron:crawl",
    duration: summary.duration,
    data: {
      total: summary.total,
      success: summary.success,
      failed: summary.failed,
      skipped: summary.skipped,
    },
  });

  return NextResponse.json({
    total: summary.total,
    success: summary.success,
    failed: summary.failed,
    skipped: summary.skipped,
    duration: summary.duration,
  });
});
