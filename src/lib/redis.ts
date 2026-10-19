// src/lib/redis.ts
// Upstash Redis 클라이언트 싱글턴.
// 환경변수가 없으면 null을 export하며, cache.ts에서 캐시를 스킵한다.
//
// 사용법:
//   import { redis } from "@/lib/redis";
//   if (redis) {
//     await redis.set("key", value, { ex: 3600 });
//     const cached = await redis.get<T>("key");
//   }

import { Redis } from "@upstash/redis";
import { env, isProduction } from "./env";

// undefined = 아직 초기화 안 됨, null = 환경변수 없어서 의도적 비활성화
const globalForRedis = globalThis as unknown as { redis: Redis | null | undefined };

function createRedisClient(): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
    // 기본값(5회 지수 백오프)은 Redis 장애 시 요청마다 수 초를 지연시킨다.
    // 캐시는 실패해도 DB로 폴백하므로 1회만 짧게 재시도한다.
    retry: { retries: 1, backoff: () => 50 },
  });
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : createRedisClient();

if (!isProduction) {
  globalForRedis.redis = redis;
}
