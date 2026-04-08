// src/lib/data/styles.ts — 스타일 데이터 접근 레이어

import { withCache, buildCacheKey, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@prisma/client";

const STYLE_SELECT = {
  id: true,
  celebName: true,
  imageUrl: true,
  categoryId: true,
  colors: true,
  gender: true,
  season: true,
  createdAt: true,
} as const;

const PRODUCT_SELECT = {
  id: true,
  styleId: true,
  brandName: true,
  productName: true,
  productImageUrl: true,
  representativePrice: true,
  similarityScore: true,
  createdAt: true,
} as const;

interface GetStylesFilter {
  categoryId?: string;
  gender?: string;
  color?: string;
}

/** 스타일 목록 + 총 건수 (필터 조건별 캐시) */
export const getStylesWithCount = (filter: GetStylesFilter) => {
  const where: Prisma.CelebStyleWhereInput = {};
  if (filter.categoryId) where.categoryId = filter.categoryId;
  if (filter.gender) where.gender = filter.gender;
  if (filter.color) where.colors = { hasSome: filter.color.split(",") };

  const cacheKey = buildCacheKey("styles:list", { ...filter });

  return withCache(cacheKey, CACHE_TTL.LIST, () =>
    Promise.all([
      prisma.celebStyle.findMany({
        where,
        orderBy: { createdAt: "desc" },
        select: STYLE_SELECT,
      }),
      prisma.celebStyle.count({ where }),
    ]),
  );
};

/** 스타일 단건 조회 */
export const getStyleById = (id: string) =>
  withCache(`style:${id}`, CACHE_TTL.STYLE_DETAIL, () =>
    prisma.celebStyle.findUnique({
      where: { id },
      select: STYLE_SELECT,
    }),
  );

interface GetStyleProductsFilter {
  minPrice?: number;
  maxPrice?: number;
  sort?: string; // "similarity" | "price_asc" | "price_desc" | "brand"
}

/** 스타일의 유사 상품 목록 */
export const getStyleProducts = (
  styleId: string,
  filter: GetStyleProductsFilter = {},
) => {
  const cacheKey = buildCacheKey(`style:${styleId}:products`, {
    minPrice: filter.minPrice,
    maxPrice: filter.maxPrice,
    sort: filter.sort,
  });

  const where: Prisma.SimilarProductWhereInput = { styleId };
  if (filter.minPrice !== undefined || filter.maxPrice !== undefined) {
    where.representativePrice = {
      ...(filter.minPrice !== undefined && { gte: filter.minPrice }),
      ...(filter.maxPrice !== undefined && { lte: filter.maxPrice }),
    };
  }

  const orderByMap: Record<string, Prisma.SimilarProductOrderByWithRelationInput> = {
    similarity: { similarityScore: "desc" },
    price_asc: { representativePrice: "asc" },
    price_desc: { representativePrice: "desc" },
    brand: { brandName: "asc" },
  };

  return withCache(cacheKey, CACHE_TTL.LIST, () =>
    prisma.similarProduct.findMany({
      where,
      orderBy: orderByMap[filter.sort ?? "similarity"],
      select: PRODUCT_SELECT,
    }),
  );
};
