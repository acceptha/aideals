// src/lib/envRules.ts
// 환경 변수 규칙의 Single Source of Truth.
// env.ts (런타임 접근)와 scripts/validate-env.ts (검증 스크립트) 양쪽에서 이 파일을 import한다.
// 새 환경 변수를 추가할 때 이 파일의 ENV_RULES 배열만 수정하면
// 런타임 검증과 스크립트 검증이 자동으로 반영된다.
//
// 상세 규칙: PROJECT_RULES.md > 2. 환경 변수 관리

// ══════════════════════════════════════════════
// 타입 정의
// ══════════════════════════════════════════════

export interface EnvVarRule {
  /** 환경 변수 이름 */
  key: string;
  /** 현재 Phase에서 필수 여부 */
  required: boolean;
  /** 해당 Phase (1~4) */
  phase: number;
  /** 서버 전용(true) / 클라이언트 노출 가능(false) */
  serverOnly: boolean;
  /** 값 형식 검증 함수. 실패 시 에러 메시지 반환, 성공 시 null */
  validate?: (value: string) => string | null;
  /** 설명 */
  description: string;
}

// ══════════════════════════════════════════════
// 환경 변수 규칙 정의
// ══════════════════════════════════════════════

export const ENV_RULES: EnvVarRule[] = [
  // ── Phase 1 ──
  {
    key: "DATABASE_URL",
    required: true,
    phase: 1,
    serverOnly: true,
    description: "Supabase PostgreSQL 연결 문자열",
    validate: (v) => {
      if (!v.startsWith("postgresql://") && !v.startsWith("postgres://")) {
        return "postgresql:// 또는 postgres:// 로 시작해야 합니다";
      }
      // 기본 URL 구조 체크: protocol://user:pass@host:port/db
      const urlPattern = /^postgres(ql)?:\/\/.+:.+@.+:\d+\/.+/;
      if (!urlPattern.test(v)) {
        return "형식이 올바르지 않습니다. 예: postgresql://user:pw@host:5432/db";
      }
      return null;
    },
  },
  {
    key: "DIRECT_URL",
    required: true,
    phase: 1,
    serverOnly: true,
    description: "Supabase 직접 연결 URL (Prisma 마이그레이션용, PgBouncer 우회)",
    validate: (v) => {
      if (!v.startsWith("postgresql://") && !v.startsWith("postgres://")) {
        return "postgresql:// 또는 postgres:// 로 시작해야 합니다";
      }
      const urlPattern = /^postgres(ql)?:\/\/.+:.+@.+:\d+\/.+/;
      if (!urlPattern.test(v)) {
        return "형식이 올바르지 않습니다. 예: postgresql://postgres:pw@db.xxx.supabase.co:5432/postgres";
      }
      return null;
    },
  },

  // ── Phase 3 ──
  {
    key: "UPSTASH_REDIS_REST_URL",
    required: false,
    phase: 3,
    serverOnly: true,
    description: "Upstash Redis REST URL",
    validate: (v) => {
      if (!v.startsWith("https://")) return "https:// 로 시작해야 합니다";
      if (!v.includes("upstash.io")) return "upstash.io 도메인이어야 합니다";
      return null;
    },
  },
  {
    key: "UPSTASH_REDIS_REST_TOKEN",
    required: false,
    phase: 3,
    serverOnly: true,
    description: "Upstash Redis 인증 토큰",
    validate: (v) => {
      if (v.length < 20) return "토큰이 너무 짧습니다 (최소 20자)";
      return null;
    },
  },
  {
    key: "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME",
    required: false,
    phase: 3,
    serverOnly: false,
    description: "Cloudinary 클라우드 이름 (클라이언트 노출 가능)",
    validate: (v) => {
      if (v.length < 2) return "클라우드 이름이 너무 짧습니다";
      return null;
    },
  },
  {
    key: "CLOUDINARY_API_KEY",
    required: false,
    phase: 3,
    serverOnly: true,
    description: "Cloudinary API 키",
    validate: (v) => {
      if (!/^\d+$/.test(v)) return "숫자로만 구성되어야 합니다";
      return null;
    },
  },
  {
    key: "CLOUDINARY_API_SECRET",
    required: false,
    phase: 3,
    serverOnly: true,
    description: "Cloudinary API 시크릿",
    validate: (v) => {
      if (v.length < 10) return "시크릿이 너무 짧습니다 (최소 10자)";
      return null;
    },
  },

  // ── Phase 3 — Cron ──
  {
    key: "CRON_SECRET",
    required: false,
    phase: 3,
    serverOnly: true,
    description: "Vercel Cron Job 인증 시크릿",
    validate: (v) => {
      if (v.length < 16) return "최소 16자 이상이어야 합니다";
      return null;
    },
  },

  // ── Phase 4 ──
  {
    key: "NEXTAUTH_URL",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "인증 콜백 기준 URL",
    validate: (v) => {
      if (!v.startsWith("http://") && !v.startsWith("https://")) {
        return "http:// 또는 https:// 로 시작해야 합니다";
      }
      return null;
    },
  },
  {
    key: "NEXTAUTH_SECRET",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "세션 암호화 시크릿",
    validate: (v) => {
      if (v.length < 32) return "최소 32자 이상이어야 합니다 (openssl rand -base64 32 로 생성)";
      return null;
    },
  },
  {
    key: "KAKAO_CLIENT_ID",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "카카오 OAuth 클라이언트 ID",
  },
  {
    key: "KAKAO_CLIENT_SECRET",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "카카오 OAuth 클라이언트 시크릿",
  },
  {
    key: "GOOGLE_CLIENT_ID",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "구글 OAuth 클라이언트 ID",
    validate: (v) => {
      if (!v.endsWith(".apps.googleusercontent.com")) {
        return ".apps.googleusercontent.com 으로 끝나야 합니다";
      }
      return null;
    },
  },
  {
    key: "GOOGLE_CLIENT_SECRET",
    required: false,
    phase: 4,
    serverOnly: true,
    description: "구글 OAuth 클라이언트 시크릿",
    validate: (v) => {
      if (!v.startsWith("GOCSPX-")) return "GOCSPX- 로 시작해야 합니다";
      return null;
    },
  },
];
