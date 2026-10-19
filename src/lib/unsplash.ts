// src/lib/unsplash.ts
// Unsplash API 클라이언트 (관리자 이미지 검색용)
// API 가이드: https://unsplash.com/documentation
//
// Demo 단계 키는 시간당 50건 제한. 운영 단계는 별도 신청 필요.

import { env } from "@/lib/env";
import { AppError } from "@/lib/api/errors";
import { logger } from "@/lib/logger";
import type { ImageSearchResult } from "@/types/api";

const UNSPLASH_API_BASE = "https://api.unsplash.com";

interface UnsplashUser {
  name: string;
  username: string;
  links: { html: string };
}

interface UnsplashPhoto {
  id: string;
  urls: { raw: string; full: string; regular: string; small: string; thumb: string };
  width: number;
  height: number;
  description: string | null;
  alt_description: string | null;
  user: UnsplashUser;
  links: { html: string; download_location: string };
}

interface UnsplashSearchResponse {
  total: number;
  total_pages: number;
  results: UnsplashPhoto[];
}

export const isUnsplashConfigured = (): boolean =>
  Boolean(env.UNSPLASH_ACCESS_KEY);

export interface UnsplashSearchInput {
  query: string;
  page: number;
  perPage: number;
}

export interface UnsplashSearchOutput {
  photos: ImageSearchResult[];
  total: number;
  totalPages: number;
}

export const searchUnsplashPhotos = async (
  input: UnsplashSearchInput,
): Promise<UnsplashSearchOutput> => {
  const accessKey = env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) {
    throw AppError.fromCode(
      "UNSPLASH_NOT_CONFIGURED",
      "Unsplash Access Key가 설정되지 않았습니다",
    );
  }

  const url = new URL(`${UNSPLASH_API_BASE}/search/photos`);
  url.searchParams.set("query", input.query);
  url.searchParams.set("page", String(input.page));
  url.searchParams.set("per_page", String(input.perPage));

  const response = await fetch(url.toString(), {
    headers: {
      Authorization: `Client-ID ${accessKey}`,
      "Accept-Version": "v1",
    },
  });

  if (!response.ok) {
    logger.error("Unsplash 검색 실패", {
      context: "unsplash",
      data: { status: response.status, query: input.query },
    });
    throw AppError.fromCode(
      "UNSPLASH_API_FAILED",
      "Unsplash 검색 요청이 실패했습니다",
      { status: response.status },
    );
  }

  const data = (await response.json()) as UnsplashSearchResponse;

  return {
    photos: data.results.map(normalizePhoto),
    total: data.total,
    totalPages: data.total_pages,
  };
};

const normalizePhoto = (p: UnsplashPhoto): ImageSearchResult => ({
  id: p.id,
  thumbUrl: p.urls.thumb,
  regularUrl: p.urls.regular,
  fullUrl: p.urls.full,
  width: p.width,
  height: p.height,
  description: p.description ?? p.alt_description,
  photographer: p.user.name,
  photographerUrl: p.user.links.html,
  sourceUrl: p.links.html,
  sourceName: "Unsplash",
  downloadTracker: p.links.download_location,
});

export const isUnsplashApiUrl = (value: string): boolean => {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname === new URL(UNSPLASH_API_BASE).hostname;
  } catch {
    return false;
  }
};

// Unsplash 가이드라인: 사진을 실제로 사용(다운로드/표시)할 때
// download_location 엔드포인트에 GET을 한 번 보내야 한다 (통계 트리거).
// 실패해도 본 작업은 막지 않는다 — 로그만 남긴다.
export const triggerUnsplashDownload = async (
  downloadLocation: string,
): Promise<void> => {
  const accessKey = env.UNSPLASH_ACCESS_KEY;
  if (!accessKey) return;

  // 클라이언트가 보낸 URL이므로 Unsplash API 호스트만 허용한다 (SSRF·Access Key 유출 방지)
  if (!isUnsplashApiUrl(downloadLocation)) {
    logger.warn("Unsplash 다운로드 트리거 URL 거부", {
      context: "unsplash",
      data: { downloadLocation },
    });
    return;
  }

  try {
    await fetch(downloadLocation, {
      headers: { Authorization: `Client-ID ${accessKey}` },
    });
  } catch (err) {
    logger.warn("Unsplash 다운로드 트리거 실패", {
      context: "unsplash",
      data: { error: err instanceof Error ? err.message : String(err) },
    });
  }
};
