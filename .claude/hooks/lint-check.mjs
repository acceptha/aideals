/**
 * PostToolUse Hook: 파일 편집 후 ESLint + TypeScript 타입 체크 자동 실행
 *
 * - Edit/Write 도구 실행 후 자동으로 트리거됨
 * - .ts, .tsx 파일만 대상으로 검사
 * - 에러 발견 시 exit code 2로 Claude에게 알림
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";

// Claude Code가 stdin으로 전달하는 이벤트 데이터 읽기
let input = "";
try {
  input = readFileSync("/dev/stdin", "utf-8");
} catch {
  try {
    input = readFileSync(0, "utf-8");
  } catch {
    process.exit(0);
  }
}

let eventData;
try {
  eventData = JSON.parse(input);
} catch {
  process.exit(0);
}

// 편집된 파일 경로 추출
const filePath =
  eventData?.tool_input?.file_path ||
  eventData?.tool_input?.path ||
  "";

// .ts, .tsx 파일만 검사
if (!filePath.match(/\.(ts|tsx)$/)) {
  process.exit(0);
}

const errors = [];

// ESLint 검사
try {
  execSync(`npx eslint "${filePath}" --no-error-on-unmatched-pattern`, {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch (e) {
  errors.push(`[ESLint] ${filePath}\n${e.stdout || e.stderr || ""}`);
}

// TypeScript 타입 체크
try {
  execSync("npx tsc --noEmit --pretty", {
    encoding: "utf-8",
    stdio: ["pipe", "pipe", "pipe"],
  });
} catch (e) {
  errors.push(`[TypeScript] 타입 에러 발견\n${e.stdout || e.stderr || ""}`);
}

if (errors.length > 0) {
  // stderr로 에러 내용 출력 → Claude에게 표시됨
  process.stderr.write(
    `\n⚠️ 코드 품질 이슈 발견:\n${errors.join("\n---\n")}\n`
  );
  process.exit(2);
}

process.exit(0);
