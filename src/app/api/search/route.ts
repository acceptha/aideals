// src/app/api/search/route.ts
// GET /api/search — 통합 검색

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { searchAll } from "@/lib/data/search";
import { logger } from "@/lib/logger";
import type { SearchParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const start = Date.now();

  const params = parseQueryParams<SearchParams>(req, {
    q: { type: "string", required: true },
    type: { type: "string", enum: ["celeb", "brand", "product"] },
  });

  const results = await searchAll(params.q, params.type);

  logger.info("통합 검색", {
    context: "api:search",
    duration: Date.now() - start,
    data: { query: params.q, type: params.type, celebCount: results.celebStyles.length, productCount: results.products.length },
  });

  return NextResponse.json(results);
});
