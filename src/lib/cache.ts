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

/** Redis 장애 감지 후 캐시를 건너뛰는 시간 (ms) */
const CIRCUIT_OPEN_MS = 30_000;

// ── 서킷 브레이커 ──
// Redis 호출이 실패하면 일정 시간 동안 Redis를 건너뛰고 DB로 바로 간다.
// 장애 중 매 요청이 Redis 타임아웃을 기다리며 느려지는 것을 막는다.
let circuitOpenUntil = 0;

const isCircuitOpen = (): boolean => Date.now() < circuitOpenUntil;

const openCircuit = (context: string, data: Record<string, unknown>): void => {
  const wasOpen = isCircuitOpen();
  circuitOpenUntil = Date.now() + CIRCUIT_OPEN_MS;
  if (!wasOpen) {
    logger.warn(`${context} — ${CIRCUIT_OPEN_MS / 1000}초간 캐시 비활성화`, {
      context: "cache",
      data,
    });
  }
};

/** 테스트 전용: 서킷 상태 초기화 */
export const resetCacheCircuit = (): void => {
  circuitOpenUntil = 0;
};

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
  if (!redis || isCircuitOpen()) return fetcher();

  try {
    const cached = await redis.get<T>(key);
    if (cached !== null && cached !== undefined) {
      logger.info("캐시 히트", { context: "cache", data: { key } });
      return cached;
    }
  } catch (err) {
    // Redis 장애 시 DB로 폴백
    openCircuit("캐시 조회 실패, DB 폴백", { key, error: (err as Error).message });
    return fetcher();
  }

  const data = await fetcher();

  try {
    await redis.set(key, data, { ex: ttl });
  } catch (err) {
    openCircuit("캐시 저장 실패", { key, error: (err as Error).message });
  }

  return data;
};

/** 패턴 기반 캐시 무효화 (키 prefix 삭제) */
export const invalidateCache = async (pattern: string): Promise<void> => {
  // 서킷이 열려 있어도 시도한다 — 건너뛰면 Redis 복구 후 stale 캐시가 TTL 동안 남는다
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
