// src/lib/data/search.ts — 검색 데이터 접근 레이어

import { withCache, buildCacheKey, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

interface SearchResult {
  celebStyles: { id: string; celebName: string; imageUrl: string; categoryId: string }[];
  products: { id: string; brandName: string; productName: string; productImageUrl: string; representativePrice: number }[];
}

/** 통합 검색 (셀럽 + 브랜드/상품) */
export const searchAll = (query: string, type?: "celeb" | "brand" | "product") => {
  const cacheKey = buildCacheKey("search", { q: query, type });

  return withCache<SearchResult>(cacheKey, CACHE_TTL.LIST, async () => {
    const results: SearchResult = { celebStyles: [], products: [] };

    if (!type || type === "celeb") {
      results.celebStyles = await prisma.celebStyle.findMany({
        where: { celebName: { contains: query, mode: "insensitive" } },
        select: { id: true, celebName: true, imageUrl: true, categoryId: true },
        take: 20,
      });
    }

    if (!type || type === "brand" || type === "product") {
      const conditions: object[] = [];
      if (!type || type === "brand") {
        conditions.push({ brandName: { contains: query, mode: "insensitive" } });
      }
      if (!type || type === "product") {
        conditions.push({ productName: { contains: query, mode: "insensitive" } });
      }

      results.products = await prisma.similarProduct.findMany({
        where: { OR: conditions },
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

    return results;
  });
};
