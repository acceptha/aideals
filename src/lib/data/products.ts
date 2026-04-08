// src/lib/data/products.ts — 상품 데이터 접근 레이어

import { withCache, buildCacheKey, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

const PRODUCT_DETAIL_SELECT = {
  id: true,
  styleId: true,
  brandName: true,
  productName: true,
  productImageUrl: true,
  representativePrice: true,
  similarityScore: true,
  createdAt: true,
  style: {
    select: {
      id: true,
      celebName: true,
      imageUrl: true,
      categoryId: true,
    },
  },
} as const;

const LINK_SELECT = {
  id: true,
  productId: true,
  platformName: true,
  platformLogoUrl: true,
  price: true,
  currency: true,
  productUrl: true,
  inStock: true,
  lastCheckedAt: true,
} as const;

/** 상품 단건 조회 (스타일 정보 포함) */
export const getProductById = (id: string) =>
  withCache(`product:${id}`, CACHE_TTL.PRODUCT_DETAIL, () =>
    prisma.similarProduct.findUnique({
      where: { id },
      select: PRODUCT_DETAIL_SELECT,
    }),
  );

/** 상품 구매처 목록 */
export const getProductLinks = (
  productId: string,
  sort: "price" | "recent" = "recent",
) => {
  const cacheKey = buildCacheKey(`product:${productId}:links`, { sort });

  const orderBy = sort === "price"
    ? { price: "asc" as const }
    : { lastCheckedAt: "desc" as const };

  return withCache(cacheKey, CACHE_TTL.PRICE, () =>
    prisma.purchaseLink.findMany({
      where: { productId },
      orderBy,
      select: LINK_SELECT,
    }),
  );
};
