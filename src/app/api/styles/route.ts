// src/app/api/styles/route.ts
// GET /api/styles — 스타일 목록 (필터 + 시즌 자동 정렬 + 페이지네이션)

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { getStylesWithCount } from "@/lib/data/styles";
import { logger } from "@/lib/logger";
import type { GetStylesParams } from "@/types/api";

// TODO: page.tsx와 중복. 순수 유틸 함수가 여러 개 생기면 src/utils/로 추출
const SEASON_BY_MONTH: Record<number, string[]> = {
  1: ["winter"],
  2: ["winter"],
  3: ["spring", "winter"],
  4: ["spring"],
  5: ["spring"],
  6: ["summer", "spring"],
  7: ["summer"],
  8: ["summer"],
  9: ["fall", "summer"],
  10: ["fall"],
  11: ["fall"],
  12: ["winter", "fall"],
};

export const GET = withErrorHandler(async (req: NextRequest) => {
  const start = Date.now();

  const params = parseQueryParams<GetStylesParams>(req, {
    categoryId: { type: "string" },
    gender: { type: "string", enum: ["male", "female"] },
    color: { type: "string" },
    page: { type: "number", default: 1, min: 1 },
    limit: { type: "number", default: 20, min: 1, max: 100 },
    sort: { type: "string", enum: ["createdAt_desc", "celebName_asc"] },
  });

  const [allStyles, total] = await getStylesWithCount({
    categoryId: params.categoryId,
    gender: params.gender,
    color: params.color,
  });

  // 시즌 자동 정렬 (기본 정렬일 때만)
  let sorted = allStyles;
  if (params.sort === "celebName_asc") {
    sorted = [...allStyles].sort((a, b) => a.celebName.localeCompare(b.celebName));
  } else {
    const month = new Date().getMonth() + 1;
    const prioritySeasons = SEASON_BY_MONTH[month] ?? [];

    sorted = [...allStyles].sort((a, b) => {
      const aIdx = prioritySeasons.indexOf(a.season);
      const bIdx = prioritySeasons.indexOf(b.season);
      const aWeight = aIdx === -1 ? 99 : aIdx;
      const bWeight = bIdx === -1 ? 99 : bIdx;
      if (aWeight !== bWeight) return aWeight - bWeight;
      // new Date() 래핑: Redis 캐시 역직렬화 시 Date가 string으로 변환되므로 방어 처리
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
  }

  // 페이지네이션 적용
  const paged = sorted.slice(
    (params.page - 1) * params.limit,
    params.page * params.limit,
  );

  logger.info("스타일 목록 조회", {
    context: "api:styles",
    duration: Date.now() - start,
    data: { total, page: params.page },
  });

  return NextResponse.json({
    data: paged,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  });
});
