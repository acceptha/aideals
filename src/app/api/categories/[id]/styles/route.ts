// src/app/api/categories/[id]/styles/route.ts
// GET /api/categories/:id/styles — 특정 카테고리의 셀럽 스타일 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { getCategoryById } from "@/lib/data/categories";
import { getStylesWithCount } from "@/lib/data/styles";
import { logger } from "@/lib/logger";
import type { GetCategoryStylesParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  const category = await getCategoryById(id);
  if (!category) {
    throw new NotFoundError("카테고리", "CATEGORY_NOT_FOUND");
  }

  const params = parseQueryParams<GetCategoryStylesParams>(req, {
    gender: { type: "string", enum: ["male", "female"] },
    color: { type: "string" },
    page: { type: "number", default: 1, min: 1 },
    limit: { type: "number", default: 20, min: 1, max: 100 },
  });

  const [styles, total] = await getStylesWithCount({
    categoryId: id,
    gender: params.gender,
    color: params.color,
  });

  // TODO: 데이터 1000건 이상 시 Prisma skip/take 기반 DB 레벨 페이지네이션으로 전환 필요
  const paged = styles.slice(
    (params.page - 1) * params.limit,
    params.page * params.limit,
  );

  logger.info("카테고리별 스타일 조회", {
    context: "api:categories:styles",
    duration: Date.now() - start,
    data: { categoryId: id, total },
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
