// src/app/api/products/[id]/links/route.ts
// GET /api/products/:id/links — 구매처 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { GetProductLinksParams } from "@/types/api";
import type { Prisma } from "@prisma/client";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  // 상품 존재 확인
  const product = await prisma.similarProduct.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!product) {
    throw new NotFoundError("상품", "PRODUCT_NOT_FOUND");
  }

  const params = parseQueryParams<GetProductLinksParams>(req, {
    sort: { type: "string", enum: ["price"] },
  });

  const orderBy: Prisma.PurchaseLinkOrderByWithRelationInput =
    params.sort === "price" ? { price: "asc" } : { lastCheckedAt: "desc" };

  const links = await prisma.purchaseLink.findMany({
    where: { productId: id },
    orderBy,
    select: {
      id: true,
      productId: true,
      platformName: true,
      platformLogoUrl: true,
      price: true,
      currency: true,
      productUrl: true,
      inStock: true,
      lastCheckedAt: true,
    },
  });

  logger.info("구매처 목록 조회", {
    context: "api:products:links",
    duration: Date.now() - start,
    data: { productId: id, count: links.length },
  });

  return NextResponse.json(links);
});
