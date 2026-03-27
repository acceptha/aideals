// src/app/api/styles/[id]/products/route.ts
// GET /api/styles/:id/products — 해당 스타일의 유사 상품 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";
import type { GetProductsParams } from "@/types/api";
import type { Prisma } from "@prisma/client";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  // 스타일 존재 확인
  const style = await prisma.celebStyle.findUnique({
    where: { id },
    select: { id: true },
  });
  if (!style) {
    throw new NotFoundError("스타일", "STYLE_NOT_FOUND");
  }

  const params = parseQueryParams<GetProductsParams>(req, {
    sort: { type: "string", enum: ["price", "brand", "similarity"] },
  });

  let orderBy: Prisma.SimilarProductOrderByWithRelationInput;
  switch (params.sort) {
    case "price":
      orderBy = { representativePrice: "asc" };
      break;
    case "brand":
      orderBy = { brandName: "asc" };
      break;
    default:
      orderBy = { similarityScore: "desc" };
      break;
  }

  const products = await prisma.similarProduct.findMany({
    where: { styleId: id },
    orderBy,
    select: {
      id: true,
      styleId: true,
      brandName: true,
      productName: true,
      productImageUrl: true,
      representativePrice: true,
      similarityScore: true,
      createdAt: true,
    },
  });

  logger.info("유사 상품 조회", {
    context: "api:styles:products",
    duration: Date.now() - start,
    data: { styleId: id, count: products.length },
  });

  return NextResponse.json(products);
});
