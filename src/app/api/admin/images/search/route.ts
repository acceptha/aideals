// src/app/api/admin/images/search/route.ts
// 관리자 이미지 검색 API — 외부 라이선스 이미지 소스(Unsplash 등)에서 검색.
//
// GET /api/admin/images/search?q=...&source=unsplash&page=1&perPage=20
//
// 응답: PaginatedResponse<ImageSearchResult>

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { AppError } from "@/lib/api/errors";
import { parseQueryParams } from "@/lib/api/parseQueryParams";
import { auth } from "@/lib/auth";
import { searchUnsplashPhotos } from "@/lib/unsplash";
import type { ImageSearchParams } from "@/types/api";

export const GET = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session) {
    throw AppError.fromCode("AUTH_REQUIRED", "로그인이 필요합니다");
  }
  if (session.user.role !== "admin") {
    throw AppError.fromCode("AUTH_FORBIDDEN", "관리자 권한이 필요합니다");
  }

  const params = parseQueryParams<ImageSearchParams>(req, {
    q: { type: "string", required: true },
    source: {
      type: "string",
      default: "unsplash",
      enum: ["unsplash"],
    },
    page: { type: "number", default: 1, min: 1 },
    perPage: { type: "number", default: 20, min: 1, max: 30 },
  });

  // 소스별 분기 — 향후 google_cc 등 추가 시 여기서 라우팅
  const result = await searchUnsplashPhotos({
    query: params.q,
    page: params.page,
    perPage: params.perPage,
  });

  return NextResponse.json({
    data: result.photos,
    pagination: {
      page: params.page,
      limit: params.perPage,
      total: result.total,
      totalPages: result.totalPages,
    },
  });
});
