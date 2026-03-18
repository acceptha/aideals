// src/lib/env.ts
// 환경 변수 접근을 일원화하는 모듈.
// 프로젝트 전체에서 process.env를 직접 사용하지 않고, 이 파일에서 export한 env 객체를 import하여 사용한다.
// 상세 규칙: PROJECT_RULES.md > 2. 환경 변수 관리

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

export const env = {
  // ──────────────────────────────────────────────
  // Phase 1 — 필수
  // ──────────────────────────────────────────────
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  // ──────────────────────────────────────────────
  // Phase 3 — 해당 Phase 도달 시 getRequiredEnv로 변경
  // ──────────────────────────────────────────────
  // UPSTASH_REDIS_REST_URL: getOptionalEnv("UPSTASH_REDIS_REST_URL"),
  // UPSTASH_REDIS_REST_TOKEN: getOptionalEnv("UPSTASH_REDIS_REST_TOKEN"),
  // NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME: getOptionalEnv("NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME"),
  // CLOUDINARY_API_KEY: getOptionalEnv("CLOUDINARY_API_KEY"),
  // CLOUDINARY_API_SECRET: getOptionalEnv("CLOUDINARY_API_SECRET"),

  // ──────────────────────────────────────────────
  // Phase 4 — 해당 Phase 도달 시 getRequiredEnv로 변경
  // ──────────────────────────────────────────────
  // NEXTAUTH_URL: getOptionalEnv("NEXTAUTH_URL"),
  // NEXTAUTH_SECRET: getOptionalEnv("NEXTAUTH_SECRET"),
  // KAKAO_CLIENT_ID: getOptionalEnv("KAKAO_CLIENT_ID"),
  // KAKAO_CLIENT_SECRET: getOptionalEnv("KAKAO_CLIENT_SECRET"),
  // GOOGLE_CLIENT_ID: getOptionalEnv("GOOGLE_CLIENT_ID"),
  // GOOGLE_CLIENT_SECRET: getOptionalEnv("GOOGLE_CLIENT_SECRET"),
};
