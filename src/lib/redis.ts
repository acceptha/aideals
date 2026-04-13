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
  });
}

export const redis: Redis | null =
  globalForRedis.redis !== undefined
    ? globalForRedis.redis
    : createRedisClient();

if (!isProduction) {
  globalForRedis.redis = redis;
}
