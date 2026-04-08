// src/app/api/categories/route.ts
// GET /api/categories — 카테고리 목록 조회 (대분류 6개)

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { getCategories } from "@/lib/data/categories";
import { logger } from "@/lib/logger";

export const GET = withErrorHandler(async (_req: NextRequest) => {
  const start = Date.now();

  const categories = await getCategories();

  logger.info("카테고리 목록 조회", {
    context: "api:categories",
    duration: Date.now() - start,
    data: { count: categories.length },
  });

  return NextResponse.json(categories);
});
