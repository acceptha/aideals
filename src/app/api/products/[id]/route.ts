// src/app/api/products/[id]/route.ts
// GET /api/products/:id — 상품 상세

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  const product = await prisma.similarProduct.findUnique({
    where: { id },
    select: {
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
    },
  });

  if (!product) {
    throw new NotFoundError("상품", "PRODUCT_NOT_FOUND");
  }

  logger.info("상품 상세 조회", {
    context: "api:products:detail",
    duration: Date.now() - start,
    data: { id },
  });

  return NextResponse.json(product);
});
