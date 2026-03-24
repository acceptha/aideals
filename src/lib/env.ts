// src/lib/env.ts
// 환경 변수 접근을 일원화하는 모듈.
// 프로젝트 전체에서 process.env를 직접 사용하지 않고, 이 파일에서 export한 env 객체를 import하여 사용한다.
// 변수 규칙은 envRules.ts (single source of truth)에서 가져온다.
//
// 상세 규칙: PROJECT_RULES.md > 2. 환경 변수 관리

import { ENV_RULES } from "./envRules";

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
// required: true → getRequiredEnv (없으면 앱 시작 시 즉시 에러)
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

const _env = buildEnv();

// 타입 안전한 접근을 위해, 현재 Phase에서 사용하는 키만 명시적으로 export한다.
// Phase가 진행되면 envRules.ts에서 required를 true로 변경하고,
// 아래 타입을 string으로 좁히면 된다.
export const env = {
  // ──────────────────────────────────────────────
  // Phase 1 — 필수 (항상 string)
  // ──────────────────────────────────────────────
  DATABASE_URL: _env.DATABASE_URL as string,

  // ──────────────────────────────────────────────
  // Phase 3 — 선택 (해당 Phase에서 required: true로 바꾸면 as string으로 변경)
  // ──────────────────────────────────────────────
  // UPSTASH_REDIS_REST_URL: _env.UPSTASH_REDIS_REST_URL,
  // UPSTASH_REDIS_REST_TOKEN: _env.UPSTASH_REDIS_REST_TOKEN,
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: _env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  // CLOUDINARY_API_KEY: _env.CLOUDINARY_API_KEY,
  // CLOUDINARY_API_SECRET: _env.CLOUDINARY_API_SECRET,

  // ──────────────────────────────────────────────
  // Phase 4 — 선택
  // ──────────────────────────────────────────────
  // NEXTAUTH_URL: _env.NEXTAUTH_URL,
  // NEXTAUTH_SECRET: _env.NEXTAUTH_SECRET,
  // KAKAO_CLIENT_ID: _env.KAKAO_CLIENT_ID,
  // KAKAO_CLIENT_SECRET: _env.KAKAO_CLIENT_SECRET,
  // GOOGLE_CLIENT_ID: _env.GOOGLE_CLIENT_ID,
  // GOOGLE_CLIENT_SECRET: _env.GOOGLE_CLIENT_SECRET,
};
