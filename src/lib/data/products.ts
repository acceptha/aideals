// src/lib/data/products.ts — 상품 데이터 접근 레이어

import { withCache, buildCacheKey, CACHE_TTL } from "@/lib/cache";
import { prisma } from "@/lib/prisma";

/** 가격 데이터 스테일 판정 기준 (6시간) */
const STALE_THRESHOLD_MS = 6 * 60 * 60 * 1000;

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

/** 구매처 목록 + 스테일 여부 */
export interface ProductLinksResult {
  links: Awaited<ReturnType<typeof prisma.purchaseLink.findMany>>;
  stale: boolean;
  oldestCheckedAt: string | null;
}

/** 상품 구매처 목록 (스테일 감지 포함) */
export const getProductLinks = async (
  productId: string,
  sort: "price" | "recent" = "recent",
): Promise<ProductLinksResult> => {
  const cacheKey = buildCacheKey(`product:${productId}:links`, { sort });

  const orderBy = sort === "price"
    ? { price: "asc" as const }
    : { lastCheckedAt: "desc" as const };

  const links = await withCache(cacheKey, CACHE_TTL.PRICE, () =>
    prisma.purchaseLink.findMany({
      where: { productId },
      orderBy: [{ inStock: "desc" }, orderBy],
      select: LINK_SELECT,
    }),
  );

  // lastCheckedAt 기반 스테일 감지
  const now = Date.now();
  let oldestCheckedAt: string | null = null;
  let stale = false;

  for (const link of links) {
    const checkedAt = new Date(link.lastCheckedAt).getTime();
    if (!oldestCheckedAt || checkedAt < new Date(oldestCheckedAt).getTime()) {
      oldestCheckedAt = new Date(link.lastCheckedAt).toISOString();
    }
    if (now - checkedAt > STALE_THRESHOLD_MS) {
      stale = true;
    }
  }

  return { links, stale, oldestCheckedAt };
};
