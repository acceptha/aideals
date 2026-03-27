// src/app/api/styles/route.ts
// GET /api/styles — 스타일 목록 (필터 + 시즌 자동 정렬 + 페이지네이션)

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { GetStylesParams } from "@/types/api";
import type { Prisma } from "@prisma/client";

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

function getSeasonOrderBy(): Prisma.CelebStyleOrderByWithRelationInput[] {
  const month = new Date().getMonth() + 1;
  const prioritySeasons = SEASON_BY_MONTH[month] ?? [];

  // Prisma에서는 SQL CASE로 시즌 가중치 정렬이 불가하므로
  // createdAt desc를 기본으로 하되, 시즌 정렬은 애플리케이션 레벨에서 처리
  // → 전체 조회 후 정렬 (데이터 규모가 작은 Phase 1에서 적합)
  void prioritySeasons;
  return [{ createdAt: "desc" }];
}

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

  const where: Prisma.CelebStyleWhereInput = {};
  if (params.categoryId) where.categoryId = params.categoryId;
  if (params.gender) where.gender = params.gender;
  if (params.color) {
    where.colors = { hasSome: params.color.split(",") };
  }

  let orderBy: Prisma.CelebStyleOrderByWithRelationInput[];
  if (params.sort === "celebName_asc") {
    orderBy = [{ celebName: "asc" }];
  } else {
    orderBy = getSeasonOrderBy();
  }

  const [allStyles, total] = await Promise.all([
    prisma.celebStyle.findMany({
      where,
      orderBy,
      select: {
        id: true,
        celebName: true,
        imageUrl: true,
        categoryId: true,
        colors: true,
        gender: true,
        season: true,
        createdAt: true,
      },
    }),
    prisma.celebStyle.count({ where }),
  ]);

  // 시즌 자동 정렬 (기본 정렬일 때만)
  let sorted = allStyles;
  if (!params.sort || params.sort === "createdAt_desc") {
    const month = new Date().getMonth() + 1;
    const prioritySeasons = SEASON_BY_MONTH[month] ?? [];

    sorted = [...allStyles].sort((a, b) => {
      const aIdx = prioritySeasons.indexOf(a.season);
      const bIdx = prioritySeasons.indexOf(b.season);
      const aWeight = aIdx === -1 ? 99 : aIdx;
      const bWeight = bIdx === -1 ? 99 : bIdx;
      if (aWeight !== bWeight) return aWeight - bWeight;
      return b.createdAt.getTime() - a.createdAt.getTime();
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
