// src/app/api/products/[id]/links/route.ts
// GET /api/products/:id/links — 구매처 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { getProductById, getProductLinks } from "@/lib/data/products";
import { logger } from "@/lib/logger";
import type { GetProductLinksParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  const product = await getProductById(id);
  if (!product) {
    throw new NotFoundError("상품", "PRODUCT_NOT_FOUND");
  }

  const params = parseQueryParams<GetProductLinksParams>(req, {
    sort: { type: "string", enum: ["price"] },
  });

  const { links, stale, oldestCheckedAt } = await getProductLinks(
    id,
    params.sort === "price" ? "price" : "recent",
  );

  logger.info("구매처 목록 조회", {
    context: "api:products:links",
    duration: Date.now() - start,
    data: { productId: id, count: links.length, stale },
  });

  if (stale) {
    logger.warn("가격 데이터 스테일 감지", {
      context: "api:products:links",
      data: { productId: id, oldestCheckedAt },
    });
  }

  return NextResponse.json({
    data: links,
    ...(stale && {
      warning: {
        code: "PRICE_DATA_STALE",
        message: "가격 데이터가 오래되어 실제와 다를 수 있습니다",
        details: { cachedAt: oldestCheckedAt },
      },
    }),
  });
});
