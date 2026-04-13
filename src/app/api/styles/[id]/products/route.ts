// src/app/api/styles/[id]/products/route.ts
// GET /api/styles/:id/products — 해당 스타일의 유사 상품 목록

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { NotFoundError } from "@/lib/api/errors";
import { getStyleById, getStyleProducts } from "@/lib/data/styles";
import { logger } from "@/lib/logger";
import type { GetProductsParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  const style = await getStyleById(id);
  if (!style) {
    throw new NotFoundError("스타일", "STYLE_NOT_FOUND");
  }

  const params = parseQueryParams<GetProductsParams>(req, {
    sort: { type: "string", enum: ["price", "brand", "similarity"] },
  });

  const sortMap: Record<string, string> = {
    price: "price_asc",
    brand: "brand",
    similarity: "similarity",
  };

  const products = await getStyleProducts(id, { sort: sortMap[params.sort ?? "similarity"] ?? "similarity" });

  logger.info("유사 상품 조회", {
    context: "api:styles:products",
    duration: Date.now() - start,
    data: { styleId: id, count: products.length },
  });

  return NextResponse.json({ data: products });
});
