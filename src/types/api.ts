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
