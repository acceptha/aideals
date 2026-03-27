// src/app/api/search/route.ts
// GET /api/search — 통합 검색

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { SearchParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const start = Date.now();

  const params = parseQueryParams<SearchParams>(req, {
    q: { type: "string", required: true },
    type: { type: "string", enum: ["celeb", "brand", "product"] },
  });

  const query = params.q;
  const searchType = params.type;

  const results: {
    celebStyles: { id: string; celebName: string; imageUrl: string; categoryId: string }[];
    products: { id: string; brandName: string; productName: string; productImageUrl: string; representativePrice: number }[];
  } = {
    celebStyles: [],
    products: [],
  };

  // 셀럽 검색 (type 미지정 또는 celeb)
  if (!searchType || searchType === "celeb") {
    results.celebStyles = await prisma.celebStyle.findMany({
      where: {
        celebName: { contains: query, mode: "insensitive" },
      },
      select: {
        id: true,
        celebName: true,
        imageUrl: true,
        categoryId: true,
      },
      take: 20,
    });
  }

  // 브랜드/상품 검색 (type 미지정 또는 brand/product)
  if (!searchType || searchType === "brand" || searchType === "product") {
    const where: { OR?: object[] } = {};
    const conditions: object[] = [];

    if (!searchType || searchType === "brand") {
      conditions.push({ brandName: { contains: query, mode: "insensitive" } });
    }
    if (!searchType || searchType === "product") {
      conditions.push({ productName: { contains: query, mode: "insensitive" } });
    }

    where.OR = conditions;

    results.products = await prisma.similarProduct.findMany({
      where,
      select: {
        id: true,
        brandName: true,
        productName: true,
        productImageUrl: true,
        representativePrice: true,
      },
      take: 20,
    });
  }

  logger.info("통합 검색", {
    context: "api:search",
    duration: Date.now() - start,
    data: { query, type: searchType, celebCount: results.celebStyles.length, productCount: results.products.length },
  });

  return NextResponse.json(results);
});
