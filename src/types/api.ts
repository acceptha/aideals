// src/types/api.ts
// API 요청/응답 공유 타입
// 프론트엔드(fetch)와 API Route 양쪽에서 import

import type { ErrorCode } from "@/lib/api/errorCodes";

// ── 공통 응답 래퍼 ──

export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

export interface ApiErrorResponse {
  status: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}

// ── 엔드포인트별 쿼리 파라미터 타입 ──

// GET /api/styles
export interface GetStylesParams {
  categoryId?: string;
  gender?: "male" | "female";
  color?: string;
  page: number;
  limit: number;
  sort?: "createdAt_desc" | "celebName_asc";
}

// GET /api/categories/:id/styles
export interface GetCategoryStylesParams {
  gender?: "male" | "female";
  color?: string;
  page: number;
  limit: number;
}

// GET /api/styles/:id/products
export interface GetProductsParams {
  sort?: "price" | "brand" | "similarity";
}

// GET /api/products/:id/links
export interface GetProductLinksParams {
  sort?: "price";
}

// GET /api/search
export interface SearchParams {
  q: string;
  type?: "celeb" | "brand" | "product";
}

// ── 관리자 이미지 검색 (Unsplash 등 외부 소스) ──

export type ImageSearchSource = "unsplash";

// GET /api/admin/images/search
export interface ImageSearchParams {
  q: string;
  source: ImageSearchSource;
  page: number;
  perPage: number;
}

export interface ImageSearchResult {
  id: string;
  thumbUrl: string;
  regularUrl: string;
  fullUrl: string;
  width: number;
  height: number;
  description: string | null;
  photographer: string;
  photographerUrl: string;
  sourceUrl: string;
  sourceName: string;
  /** 사용 시 통계 트리거가 필요한 외부 소스용 (Unsplash download_location 등) */
  downloadTracker?: string;
}

// POST /api/admin/images/import
export interface ImageImportRequest {
  /** Cloudinary로 복사할 원본 이미지 URL */
  imageUrl: string;
  /** 출처 페이지 URL (스타일 상세에 표기) */
  sourceUrl: string;
  /** 작가/촬영자 이름 (스타일 상세에 표기) */
  photographer: string;
  /** 소스 이름 (예: "Unsplash") */
  sourceName: string;
  /** 라이선스 식별자 (예: "unsplash", "cc-by") */
  licenseType?: string;
  /** Cloudinary 폴더 (styles | products | platforms | categories) */
  folder?: string;
  /** Unsplash 다운로드 트리거 URL (있으면 호출) */
  downloadTracker?: string;
}

export interface ImageImportResult {
  /** Cloudinary CDN URL */
  cloudinaryUrl: string;
  publicId: string;
  width: number;
  height: number;
  /** 입력으로 받은 출처 메타데이터를 그대로 echo — 클라이언트가 폼에 채우기 편하게 */
  photographer: string;
  sourceUrl: string;
  sourceName: string;
  licenseType: string | null;
}
