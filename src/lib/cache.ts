// src/lib/cache.ts
// Redis 캐시 유틸리티.
// API Route에서 withCache()로 감싸면 자동으로 캐시 히트/미스를 처리한다.
//
// 사용법:
//   const data = await withCache("categories:all", 86400, async () => {
//     return prisma.category.findMany({ ... });
//   });

import { redis } from "./redis";
import { logger } from "./logger";

/** TTL 프리셋 (초 단위) */
export const CACHE_TTL = {
  CATEGORY: 86400,    // 24시간 — 거의 변하지 않음
  STYLE_DETAIL: 600,  // 10분
  PRODUCT_DETAIL: 600,// 10분
  LIST: 300,          // 5분 — 목록/검색
  PRICE: 180,         // 3분 — 가격 데이터 (가장 자주 변함)
} as const;

/**
 * Redis 캐시 래퍼.
 * 캐시에 데이터가 있으면 반환, 없으면 fetcher 실행 후 캐시에 저장.
 *
 * 주의: JSON 직렬화를 거치므로 Date 객체는 string으로 반환된다.
 * 소비 측에서 Date 필드 사용 시 new Date()로 감싸야 한다.
 * TODO: Date 필드가 많아지면 역직렬화 유틸 도입 검토
 */
export const withCache = async <T>(
  key: string,
  ttl: number,
  fetcher: () => Promise<T>,
): Promise<T> => {
  if (!redis) return fetcher();

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      logger.info("캐시 히트", { context: "cache", data: { key } });
      return cached;
    }
  } catch (err) {
    // Redis 장애 시 DB로 폴백
    logger.warn("캐시 조회 실패, DB 폴백", {
      context: "cache",
      data: { key, error: (err as Error).message },
    });
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttl });
  } catch (err) {
    logger.warn("캐시 저장 실패", {
      context: "cache",
      data: { key, error: (err as Error).message },
    });
  }

  return data;
};

/** 패턴 기반 캐시 무효화 (키 prefix 삭제) */
export const invalidateCache = async (pattern: string): Promise<void> => {
  if (!redis) return;
  const client = redis;

  try {
    let cursor = "0";
    do {
      const result = await client.scan(cursor, { match: pattern, count: 100 });
      cursor = String(result[0]);
      const keys = result[1] as string[];
      if (keys.length > 0) {
        await client.del(...keys);
      }
    } while (cursor !== "0");
  } catch (err) {
    logger.warn("캐시 무효화 실패", {
      context: "cache",
      data: { pattern, error: (err as Error).message },
    });
  }
};

/** 쿼리 파라미터를 캐시 키로 변환 */
export const buildCacheKey = (prefix: string, params: Record<string, unknown>): string => {
  const sorted = Object.entries(params)
    .filter(([, v]) => v !== undefined && v !== null)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  return sorted ? `${prefix}:${sorted}` : prefix;
};
