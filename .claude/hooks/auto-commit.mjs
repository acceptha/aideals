/**
 * Stop Hook: Claude Code 세션 완료 시 커밋 메시지 추천 → 선택 → 자동 커밋 + push
 *
 * - Claude 응답이 끝날 때마다 트리거됨
 * - stop_hook_active가 true이면 무한 루프 방지를 위해 즉시 종료
 * - 변경사항이 없으면 아무것도 하지 않음
 * - 변경사항이 있으면 git diff를 분석하여 커밋 메시지 3가지 추천
 * - 사용자가 번호 선택 또는 직접 입력 → 커밋 + push
 */

import { execSync } from "child_process";
import { readFileSync } from "fs";
import { createInterface } from "readline";

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

/**
 * 변경된 파일 목록과 diff 내용을 분석하여 커밋 메시지 3가지를 생성
 */
function generateCommitMessages(status, diffSummary) {
  const lines = status.split("\n").filter(Boolean);

  // 변경 유형별 파일 분류
  const added = [];
  const modified = [];
  const deleted = [];

  for (const line of lines) {
    const trimmed = line.trim();
    const statusCode = trimmed.charAt(0);
    const filePath = trimmed.slice(2).trim();
    const fileName = filePath.split(/[/\\]/).pop();

    if (statusCode === "?" || statusCode === "A") {
      added.push({ filePath, fileName });
    } else if (statusCode === "D") {
      deleted.push({ filePath, fileName });
    } else {
      modified.push({ filePath, fileName });
    }
  }

  // 주요 변경 영역 감지
  const allFiles = [...added, ...modified, ...deleted];
  const areas = detectAreas(allFiles.map((f) => f.filePath));
  const totalFiles = allFiles.length;

  const messages = [];

  // 메시지 1: Conventional Commit 스타일 (구체적)
  const type = getConventionalType(added, modified, deleted, areas);
  const scope = areas.length > 0 ? `(${areas[0]})` : "";
  const detail = getDetailDescription(added, modified, deleted);
  messages.push(`${type}${scope}: ${detail}`);

  // 메시지 2: 파일 변경 요약 스타일
  const parts = [];
  if (added.length > 0) parts.push(`${added.length}개 파일 추가`);
  if (modified.length > 0) parts.push(`${modified.length}개 파일 수정`);
  if (deleted.length > 0) parts.push(`${deleted.length}개 파일 삭제`);
  const areaStr = areas.length > 0 ? ` [${areas.join(", ")}]` : "";
  messages.push(`${parts.join(", ")}${areaStr}`);

  // 메시지 3: 간결한 영문 스타일
  const engType = getConventionalType(added, modified, deleted, areas);
  const engDetail = getEngDescription(added, modified, deleted, areas);
  messages.push(`${engType}: ${engDetail}`);

  return messages;
}

/**
 * 파일 경로에서 주요 변경 영역 감지
 */
function detectAreas(filePaths) {
  const areaMap = {
    "prisma": "db",
    "src/app/api": "api",
    "src/app/styles": "styles",
    "src/app/products": "products",
    "src/components": "components",
    "src/lib": "lib",
    "src/stores": "stores",
    "src/types": "types",
    ".claude": "hooks",
    "src/app": "pages",
  };

  const detected = new Set();
  for (const fp of filePaths) {
    const normalized = fp.replace(/\\/g, "/");
    for (const [pattern, area] of Object.entries(areaMap)) {
      if (normalized.includes(pattern)) {
        detected.add(area);
        break;
      }
    }
  }

  return [...detected];
}

/**
 * Conventional Commit 타입 결정
 */
function getConventionalType(added, modified, deleted, areas) {
  if (areas.includes("hooks") || areas.includes("db")) return "chore";
  if (added.length > 0 && modified.length === 0 && deleted.length === 0) return "feat";
  if (deleted.length > 0 && added.length === 0) return "refactor";
  if (modified.length > 0 && added.length === 0) return "fix";
  if (areas.includes("components") || areas.includes("pages")) return "feat";
  return "chore";
}

/**
 * 한글 상세 설명 생성
 */
function getDetailDescription(added, modified, deleted) {
  const allFiles = [...added, ...modified, ...deleted];

  if (allFiles.length === 1) {
    const file = allFiles[0];
    if (added.includes(file)) return `${file.fileName} 파일 추가`;
    if (deleted.includes(file)) return `${file.fileName} 파일 삭제`;
    return `${file.fileName} 수정`;
  }

  // 공통 패턴 감지
  const extensions = [...new Set(allFiles.map((f) => f.fileName.split(".").pop()))];
  if (extensions.length === 1 && extensions[0] === "prisma") return "Prisma 스키마 업데이트";
  if (allFiles.every((f) => f.filePath.includes("component"))) return "컴포넌트 업데이트";
  if (allFiles.every((f) => f.filePath.includes("api"))) return "API 엔드포인트 업데이트";

  // 가장 많이 변경된 영역 기준
  const mainFile = allFiles[0];
  return `${mainFile.fileName} 외 ${allFiles.length - 1}개 파일 변경`;
}

/**
 * 영문 설명 생성
 */
function getEngDescription(added, modified, deleted, areas) {
  const total = added.length + modified.length + deleted.length;

  if (total === 1) {
    const file = [...added, ...modified, ...deleted][0];
    if (added.length === 1) return `add ${file.fileName}`;
    if (deleted.length === 1) return `remove ${file.fileName}`;
    return `update ${file.fileName}`;
  }

  if (areas.length === 1) return `update ${areas[0]} module`;
  if (areas.length > 1) return `update ${areas.join(" and ")} modules`;

  return `update ${total} files`;
}

/**
 * 사용자에게 선택지를 보여주고 입력 받기
 */
function promptUser(messages) {
  return new Promise((resolve) => {
    const rl = createInterface({
      input: process.stdin,
      output: process.stderr,
    });

    process.stderr.write("\n📝 커밋 메시지를 선택하세요:\n\n");
    messages.forEach((msg, i) => {
      process.stderr.write(`  [${i + 1}] ${msg}\n`);
    });
    process.stderr.write(`  [4] 직접 입력\n`);
    process.stderr.write(`  [0] 커밋 취소\n\n`);

    rl.question("선택 (1-4, 0): ", (answer) => {
      const choice = answer.trim();

      if (choice === "0") {
        rl.close();
        resolve(null);
        return;
      }

      if (choice === "4") {
        rl.question("커밋 메시지 입력: ", (customMsg) => {
          rl.close();
          resolve(customMsg.trim() || null);
        });
        return;
      }

      const idx = parseInt(choice, 10) - 1;
      if (idx >= 0 && idx < messages.length) {
        rl.close();
        resolve(messages[idx]);
      } else {
        // 잘못된 입력이면 첫 번째 메시지 사용
        rl.close();
        resolve(messages[0]);
      }
    });
  });
}

// ── 메인 로직 ──

try {
  const status = run("git status --porcelain");

  if (!status) {
    process.exit(0);
  }

  // diff 요약 가져오기 (staged + unstaged)
  let diffSummary = "";
  try {
    diffSummary = run("git diff --stat");
  } catch {
    diffSummary = "";
  }

  // 커밋 메시지 3가지 생성
  const messages = generateCommitMessages(status, diffSummary);

  // 사용자에게 선택 요청
  const selectedMessage = await promptUser(messages);

  if (!selectedMessage) {
    process.stderr.write("\n❌ 커밋이 취소되었습니다.\n");
    process.exit(0);
  }

  // git add + commit
  run("git add -A");
  run(`git commit -m "${selectedMessage.replace(/"/g, '\\"')}"`);

  // push
  try {
    const remote = run("git remote");
    if (remote) {
      const branch = run("git branch --show-current");
      run(`git push origin ${branch}`);
      process.stderr.write(`\n✅ 커밋 & 푸시 완료: ${selectedMessage}\n`);
    } else {
      process.stderr.write(`\n✅ 커밋 완료 (remote 없음): ${selectedMessage}\n`);
    }
  } catch {
    process.stderr.write(`\n✅ 커밋 완료 (push 실패, 수동 push 필요): ${selectedMessage}\n`);
  }
} catch (e) {
  process.stderr.write(`\n⚠️ 자동 커밋 실패: ${e.message}\n`);
}

process.exit(0);
