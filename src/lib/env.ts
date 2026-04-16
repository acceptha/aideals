// src/lib/env.ts
// 환경 변수 접근을 일원화하는 모듈.
// 프로젝트 전체에서 process.env를 직접 사용하지 않고, 이 파일에서 export한 env 객체를 import하여 사용한다.
// 변수 규칙은 envRules.ts (single source of truth)에서 가져온다.
//
// 상세 규칙: PROJECT_RULES.md > 2. 환경 변수 관리

import { ENV_RULES } from "./envRules";

// ──────────────────────────────────────────────
// NODE_ENV — Node.js 런타임 빌트인 (즉시 평가, envRules 검증 대상 아님)
// ──────────────────────────────────────────────
export const isProduction = process.env.NODE_ENV === "production";

// ──────────────────────────────────────────────
// 비즈니스 환경 변수 — lazy 평가 (최초 접근 시 검증)
// ──────────────────────────────────────────────

function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(
      `환경 변수 ${key}가 설정되지 않았습니다. .env.local 파일을 확인하세요.`,
    );
  }
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

// ENV_RULES에서 자동으로 env 객체를 생성한다.
// required: true → getRequiredEnv (없으면 즉시 에러)
// required: false → getOptionalEnv (없으면 undefined)
function buildEnv(): Record<string, string | undefined> {
  const result: Record<string, string | undefined> = {};
  for (const rule of ENV_RULES) {
    result[rule.key] = rule.required
      ? getRequiredEnv(rule.key)
      : getOptionalEnv(rule.key);
  }
  return result;
}

let _env: Record<string, string | undefined> | null = null;
function getEnv(): Record<string, string | undefined> {
  if (!_env) _env = buildEnv();
  return _env;
}

// 타입 안전한 접근을 위해, 현재 Phase에서 사용하는 키만 명시적으로 export한다.
// Phase가 진행되면 envRules.ts에서 required를 true로 변경하고,
// 아래 getter의 반환 타입을 string으로 좁히면 된다.
//
// getter를 사용하므로, 실제로 속성에 접근하는 시점에 buildEnv()가 실행된다.
// isProduction만 import하는 파일에서는 검증이 트리거되지 않는다.
export const env = {
  // ──────────────────────────────────────────────
  // Phase 1 — 필수 (항상 string)
  // ──────────────────────────────────────────────
  get DATABASE_URL() { return getEnv().DATABASE_URL as string; },
  get DIRECT_URL() { return getEnv().DIRECT_URL as string; },

  // ──────────────────────────────────────────────
  // Phase 3 — Redis 선택 (없으면 캐시 스킵), Cloudinary 선택
  // ──────────────────────────────────────────────
  get UPSTASH_REDIS_REST_URL() { return getEnv().UPSTASH_REDIS_REST_URL; },
  get UPSTASH_REDIS_REST_TOKEN() { return getEnv().UPSTASH_REDIS_REST_TOKEN; },
  get CRON_SECRET() { return getEnv().CRON_SECRET; },
  get NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME() { return getEnv().NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME; },
  get CLOUDINARY_API_KEY() { return getEnv().CLOUDINARY_API_KEY; },
  get CLOUDINARY_API_SECRET() { return getEnv().CLOUDINARY_API_SECRET; },

  // ──────────────────────────────────────────────
  // Phase 4 — 선택
  // ──────────────────────────────────────────────
  // get NEXTAUTH_URL() { return getEnv().NEXTAUTH_URL; },
  // get NEXTAUTH_SECRET() { return getEnv().NEXTAUTH_SECRET; },
  // get KAKAO_CLIENT_ID() { return getEnv().KAKAO_CLIENT_ID; },
  // get KAKAO_CLIENT_SECRET() { return getEnv().KAKAO_CLIENT_SECRET; },
  // get GOOGLE_CLIENT_ID() { return getEnv().GOOGLE_CLIENT_ID; },
  // get GOOGLE_CLIENT_SECRET() { return getEnv().GOOGLE_CLIENT_SECRET; },
};
