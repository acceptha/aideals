/**
 * Stop Hook: Claude Code 세션 완료 시 scripts/commit.sh 실행
 *
 * - Claude 응답이 끝날 때마다 트리거됨
 * - stop_hook_active가 true이면 무한 루프 방지를 위해 즉시 종료
 * - 변경사항이 없으면 아무것도 하지 않음
 * - 변경사항이 있으면 scripts/commit.sh 에 위임 (커밋 메시지 추천 + 컨벤션 검증 + push 포함)
 */

import { execSync, spawn } from "child_process";
import { readFileSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

// stdin에서 이벤트 데이터 읽기
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

// 무한 루프 방지
if (eventData?.stop_hook_active) {
  process.exit(0);
}

function run(cmd) {
  return execSync(cmd, { encoding: "utf-8", stdio: ["pipe", "pipe", "pipe"] }).trim();
}

// 변경사항 확인 (staged + unstaged + untracked)
let status = "";
try {
  status = run("git status --porcelain");
} catch {
  process.exit(0);
}

if (!status) {
  // 변경사항 없음 — 조용히 종료
  process.exit(0);
}

// scripts/commit.sh 경로 계산 (프로젝트 루트 기준)
const __dirname = dirname(fileURLToPath(import.meta.url));
const projectRoot = resolve(__dirname, "../..");
const commitScript = resolve(projectRoot, "scripts/commit.sh");

process.stderr.write("\n📦 변경사항이 감지되었습니다. 커밋을 시작합니다...\n\n");

// commit.sh를 TTY에 연결하여 인터랙티브하게 실행
const child = spawn("bash", [commitScript], {
  stdio: "inherit", // stdin/stdout/stderr 모두 터미널에 직결
  cwd: projectRoot,
});

child.on("error", (err) => {
  process.stderr.write(`\n⚠️ commit.sh 실행 실패: ${err.message}\n`);
  process.stderr.write(`   경로: ${commitScript}\n`);
  process.exit(0);
});

child.on("close", (code) => {
  process.exit(0);
});
