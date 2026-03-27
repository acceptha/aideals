// src/app/api/styles/[id]/route.ts
// GET /api/styles/:id — 스타일 상세

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler, type RouteContext } from "@/lib/api/withErrorHandler";
import { NotFoundError } from "@/lib/api/errors";
import { prisma } from "@/lib/prisma";
import { logger } from "@/lib/logger";

export const GET = withErrorHandler(async (_req: NextRequest, ctx: RouteContext) => {
  const start = Date.now();
  const { id } = await ctx.params;

  const style = await prisma.celebStyle.findUnique({
    where: { id },
    select: {
      id: true,
      celebName: true,
      imageUrl: true,
      categoryId: true,
      colors: true,
      gender: true,
      season: true,
      createdAt: true,
    },
  });

  if (!style) {
    throw new NotFoundError("스타일", "STYLE_NOT_FOUND");
  }

  logger.info("스타일 상세 조회", {
    context: "api:styles:detail",
    duration: Date.now() - start,
    data: { id },
  });

  return NextResponse.json(style);
});
