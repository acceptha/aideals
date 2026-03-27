// src/app/api/categories/[id]/styles/route.ts
// GET /api/categories/:id/styles — 특정 카테고리의 셀럽 스타일 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { GetCategoryStylesParams } from "@/types/api";
import type { Prisma } from "@prisma/client";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  // 카테고리 존재 확인
  const category = await prisma.category.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!category) {
    throw new NotFoundError("카테고리", "CATEGORY_NOT_FOUND");
  }

  const params = parseQueryParams<GetCategoryStylesParams>(req, {
    gender: { type: "string", enum: ["male", "female"] },
    color: { type: "string" },
    page: { type: "number", default: 1, min: 1 },
    limit: { type: "number", default: 20, min: 1, max: 100 },
  });

  const where: Prisma.CelebStyleWhereInput = { categoryId: id };
  if (params.gender) where.gender = params.gender;
  if (params.color) {
    where.colors = { hasSome: params.color.split(",") };
  }

  const [styles, total] = await Promise.all([
    prisma.celebStyle.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (params.page - 1) * params.limit,
      take: params.limit,
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

  logger.info("카테고리별 스타일 조회", {
    context: "api:categories:styles",
    duration: Date.now() - start,
    data: { categoryId: id, total },
  });

  return NextResponse.json({
    data: styles,
    pagination: {
      page: params.page,
      limit: params.limit,
      total,
      totalPages: Math.ceil(total / params.limit),
    },
  });
});
