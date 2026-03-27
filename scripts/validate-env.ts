/**
 * scripts/validate-env.ts
 *
 * 환경 변수 검증 스크립트.
 * npm run dev / npm run build 전에 자동 실행되어
 * 환경 변수의 존재, 형식, DB 연결을 단계별로 검증한다.
 *
 * 변수 규칙은 src/lib/envRules.ts (single source of truth)에서 가져온다.
 * → 변수 추가 시 envRules.ts만 수정하면 이 스크립트에도 자동 반영된다.
 *
 * 사용법:
 *   npx tsx scripts/validate-env.ts                  # full 모드 (키 + 형식 + DB 연결)
 *   npx tsx scripts/validate-env.ts --skip-db        # full 모드에서 DB 연결만 건너뜀
 *
 * 상세 규칙: PROJECT_RULES.md > 2. 환경 변수 관리
 */

import { config } from "dotenv";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";
import { ENV_RULES } from "../src/lib/envRules";

// ── .env.local 로드 ──
const envLocalPath = resolve(process.cwd(), ".env.local");
const envPath = resolve(process.cwd(), ".env");

if (existsSync(envLocalPath)) {
  config({ path: envLocalPath });
} else if (existsSync(envPath)) {
  config({ path: envPath });
}

// ── CLI 옵션 파싱 ──
const args = process.argv.slice(2);
const skipDb = args.includes("--skip-db");

// ── 색상 유틸 (터미널 출력용) ──
const c = {
  red: (s: string) => `\x1b[31m${s}\x1b[0m`,
  green: (s: string) => `\x1b[32m${s}\x1b[0m`,
  yellow: (s: string) => `\x1b[33m${s}\x1b[0m`,
  cyan: (s: string) => `\x1b[36m${s}\x1b[0m`,
  bold: (s: string) => `\x1b[1m${s}\x1b[0m`,
  dim: (s: string) => `\x1b[2m${s}\x1b[0m`,
};

// ══════════════════════════════════════════════
// Step 1: 필수 키 존재 여부 검증
// ══════════════════════════════════════════════

function stepCheckKeys(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.key];

    if (rule.required && !value) {
      errors.push(
        `${c.red("MISSING")} ${c.bold(rule.key)} — ${rule.description}`,
      );
    }
  }

  return { errors, warnings };
}

// ══════════════════════════════════════════════
// Step 2: 값 형식 검증
// ══════════════════════════════════════════════

function stepValidateFormat(): { errors: string[]; warnings: string[] } {
  const errors: string[] = [];
  const warnings: string[] = [];

  for (const rule of ENV_RULES) {
    const value = process.env[rule.key];
    if (!value) continue; // 값이 없으면 Step 1에서 이미 처리됨

    // 형식 검증
    if (rule.validate) {
      const err = rule.validate(value);
      if (err) {
        errors.push(`${c.red("INVALID")} ${c.bold(rule.key)} — ${err}`);
      }
    }
  }

  // 모든 NEXT_PUBLIC_ 변수 중 시크릿성 키워드 포함 여부 경고
  const secretKeywords = ["SECRET", "TOKEN", "PASSWORD", "PRIVATE", "KEY"];
  for (const [key] of Object.entries(process.env)) {
    if (!key.startsWith("NEXT_PUBLIC_")) continue;
    // 허용 목록에 있는 건 건너뜀
    if (key === "NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME") continue;

    const upperKey = key.toUpperCase();
    for (const keyword of secretKeywords) {
      if (upperKey.includes(keyword)) {
        warnings.push(
          `${c.yellow("WARN")} ${c.bold(key)} — NEXT_PUBLIC_ 변수에 "${keyword}" 키워드가 포함되어 있습니다. 시크릿이 노출되고 있지 않은지 확인하세요.`,
        );
        break;
      }
    }
  }

  // .env.example과 .env.local 키 동기화 검증
  const examplePath = resolve(process.cwd(), ".env.example");
  if (existsSync(examplePath)) {
    const exampleContent = readFileSync(examplePath, "utf-8");
    const exampleKeys = exampleContent
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith("#"))
      .map((line) => line.split("=")[0].trim())
      .filter(Boolean);

    const currentKeys = new Set(Object.keys(process.env));
    const missingFromLocal = exampleKeys.filter(
      (k) => !currentKeys.has(k) && ENV_RULES.find((r) => r.key === k)?.required,
    );

    for (const key of missingFromLocal) {
      warnings.push(
        `${c.yellow("SYNC")} ${c.bold(key)} — .env.example에 정의되어 있지만 현재 환경에 없습니다`,
      );
    }
  }

  return { errors, warnings };
}

// ══════════════════════════════════════════════
// Step 3: DB 연결 테스트
// ══════════════════════════════════════════════

async function stepTestDbConnection(): Promise<{
  errors: string[];
  warnings: string[];
}> {
  const errors: string[] = [];
  const warnings: string[] = [];

  const dbUrl = process.env["DATABASE_URL"];
  if (!dbUrl) {
    errors.push(
      `${c.red("DB")} DATABASE_URL이 없어 연결 테스트를 건너뜁니다`,
    );
    return { errors, warnings };
  }

  try {
    // dynamic import로 @prisma/client가 없어도 에러나지 않도록 처리
    const { PrismaClient } = await import("@prisma/client");
    const prisma = new PrismaClient({
      datasourceUrl: dbUrl,
    });

    // 5초 타임아웃
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("DB 연결 타임아웃 (5초)")), 5000),
    );

    const connectPromise = (async () => {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      await prisma.$disconnect();
    })();

    await Promise.race([connectPromise, timeoutPromise]);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    errors.push(
      `${c.red("DB")} 데이터베이스 연결 실패 — ${message}`,
    );
  }

  return { errors, warnings };
}

// ══════════════════════════════════════════════
// 메인 실행
// ══════════════════════════════════════════════

async function main() {
  console.log("");
  console.log(c.bold("  ═══════════════════════════════════════════"));
  console.log(c.bold("  환경 변수 검증 (validate-env)"));
  console.log(c.bold("  ═══════════════════════════════════════════"));
  console.log("");

  const allWarnings: string[] = [];

  // ── Step 1: 키 존재 여부 ──
  console.log(c.cyan("  ▸ Step 1: 필수 키 존재 여부 검증..."));
  const step1 = stepCheckKeys();
  allWarnings.push(...step1.warnings);

  if (step1.errors.length > 0) {
    for (const e of step1.errors) console.log(`    ${e}`);
    console.log("");
    console.log(
      c.red("  ✖ Step 1 실패: 필수 환경 변수가 누락되었습니다."),
    );
    console.log(
      c.dim("    .env.local 파일을 확인하세요. 템플릿: .env.example"),
    );
    console.log("");
    process.exit(1);
  }
  console.log(c.green("    ✔ 필수 키 모두 존재"));
  console.log("");

  // ── Step 2: 형식 검증 ──
  console.log(c.cyan("  ▸ Step 2: 값 형식 검증..."));
  const step2 = stepValidateFormat();
  allWarnings.push(...step2.warnings);

  for (const w of step2.warnings) console.log(`    ${w}`);
  if (step2.errors.length > 0) {
    for (const e of step2.errors) console.log(`    ${e}`);
    console.log("");
    console.log(
      c.red("  ✖ Step 2 실패: 환경 변수 형식이 올바르지 않습니다."),
    );
    console.log("");
    process.exit(1);
  }
  console.log(c.green("    ✔ 형식 검증 통과"));
  console.log("");

  // ── Step 3: DB 연결 테스트 ──
  if (skipDb) {
    console.log(c.cyan("  ▸ Step 3: DB 연결 테스트 ") + c.dim("(--skip-db로 건너뜀)"));
    console.log("");
  } else {
    console.log(c.cyan("  ▸ Step 3: DB 연결 테스트..."));
    const step3 = await stepTestDbConnection();
    allWarnings.push(...step3.warnings);

    if (step3.errors.length > 0) {
      for (const e of step3.errors) console.log(`    ${e}`);
      console.log("");
      console.log(
        c.red("  ✖ Step 3 실패: 데이터베이스에 연결할 수 없습니다."),
      );
      console.log(
        c.dim("    DATABASE_URL을 확인하거나, --skip-db 옵션으로 건너뛸 수 있습니다."),
      );
      console.log("");
      process.exit(1);
    }
    console.log(c.green("    ✔ DB 연결 성공"));
    console.log("");
  }

  // ── 결과 요약 ──
  if (allWarnings.length > 0) {
    console.log(c.yellow(`  ⚠ 경고 ${allWarnings.length}건 (검증은 통과)`));
  }
  console.log(c.green(c.bold("  ✔ 환경 변수 검증 완료")));
  console.log("");
}

main().catch((err) => {
  console.error(c.red("  예상치 못한 오류:"), err);
  process.exit(1);
});
