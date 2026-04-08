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

  const links = await getProductLinks(id, params.sort === "price" ? "price" : "recent");

  logger.info("구매처 목록 조회", {
    context: "api:products:links",
    duration: Date.now() - start,
    data: { productId: id, count: links.length },
  });

  return NextResponse.json(links);
});
