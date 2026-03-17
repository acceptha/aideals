#!/bin/bash
#
# aideals 인터랙티브 커밋 스크립트
# 변경된 파일을 분석하여 커밋 메시지 3개를 추천하고,
# 선택한 메시지로 commit & push 까지 실행한다.
#
# 사용법:
#   bash scripts/commit.sh          # 인터랙티브 모드
#   bash scripts/commit.sh --no-push  # push 없이 commit만
#

set -e

# ============================================================
# 색상 정의
# ============================================================
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m' # No Color

# ============================================================
# 옵션 파싱
# ============================================================
NO_PUSH=false
for arg in "$@"; do
  case $arg in
    --no-push) NO_PUSH=true ;;
  esac
done

# ============================================================
# 프로젝트 루트로 이동
# ============================================================
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$PROJECT_ROOT"

# ============================================================
# COMMIT_CONVENTION.md 경로
# ============================================================
CONVENTION_FILE="$PROJECT_ROOT/COMMIT_CONVENTION.md"

# ============================================================
# 컨벤션 요약 출력 함수
# ============================================================
show_convention_summary() {
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  📖 커밋 컨벤션 요약  ${DIM}(전체: COMMIT_CONVENTION.md)${NC}"
  echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo ""
  echo -e "  ${BOLD}형식:${NC}  ${GREEN}<type>(<scope>): <subject>${NC}"
  echo ""

  if [ -f "$CONVENTION_FILE" ]; then
    # Type 목록 추출 (| `feat` | 형태의 줄에서 type 값 파싱)
    echo -e "  ${BOLD}Type:${NC}"
    grep -E "^\| \`[a-z]+\`" "$CONVENTION_FILE" | while IFS='|' read -r _ type_cell desc_cell _; do
      type_val=$(echo "$type_cell" | tr -d '`' | xargs)
      desc_val=$(echo "$desc_cell" | xargs)
      printf "    ${YELLOW}%-10s${NC} %s\n" "$type_val" "$desc_val"
    done
    echo ""

    # Scope 목록 추출 (도메인/기술 테이블 양쪽)
    echo -e "  ${BOLD}Scope:${NC}"
    grep -E "^\| \`[a-z]+\`" "$CONVENTION_FILE" | grep -v "feat\|fix\|refactor\|style\|design\|docs\|test\|chore\|init\|db\|perf\|ci\|deploy\|revert" \
    | while IFS='|' read -r _ scope_cell desc_cell _; do
      scope_val=$(echo "$scope_cell" | tr -d '`' | xargs)
      desc_val=$(echo "$desc_cell" | xargs)
      printf "    ${CYAN}%-12s${NC} %s\n" "$scope_val" "$desc_val"
    done
  else
    # fallback: MD 파일이 없을 경우 하드코딩 요약
    echo -e "  ${BOLD}Type:${NC}  feat fix refactor style design docs test chore init db perf ci deploy revert"
    echo -e "  ${BOLD}Scope:${NC} category style product purchase search"
    echo -e "         ui layout auth prisma cache scraper image pwa store api config deps cicd"
    echo -e "  ${RED}  ⚠ COMMIT_CONVENTION.md 파일을 찾을 수 없습니다: $CONVENTION_FILE${NC}"
  fi

  echo ""
  echo -e "  ${DIM}Subject: 한글, 50자 이내, 마침표 없이, 명령형${NC}"
  echo ""
}

# ============================================================
# 컨벤션 전체 내용 출력 함수
# ============================================================
show_convention_full() {
  if [ -f "$CONVENTION_FILE" ]; then
    echo ""
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${BOLD}  📄 COMMIT_CONVENTION.md 전체 내용${NC}"
    echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo ""
    # less가 있으면 less, 없으면 cat
    if command -v less >/dev/null 2>&1; then
      less "$CONVENTION_FILE"
    else
      cat "$CONVENTION_FILE"
    fi
    echo ""
  else
    echo -e "${RED}  ⚠ COMMIT_CONVENTION.md 파일을 찾을 수 없습니다.${NC}"
    echo -e "${DIM}  경로: $CONVENTION_FILE${NC}"
    echo ""
  fi
}

# ============================================================
# 1. 스테이징 상태 확인
# ============================================================
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${CYAN}  🎯 aideals 스마트 커밋${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""

# 스테이징된 파일 확인
STAGED_FILES=$(git diff --cached --name-only 2>/dev/null)

if [ -z "$STAGED_FILES" ]; then
  # 스테이징된 파일이 없으면 변경된 파일 전체를 보여줌
  UNSTAGED_FILES=$(git diff --name-only 2>/dev/null)
  UNTRACKED_FILES=$(git ls-files --others --exclude-standard 2>/dev/null)

  if [ -z "$UNSTAGED_FILES" ] && [ -z "$UNTRACKED_FILES" ]; then
    echo -e "${YELLOW}  ⚠ 변경된 파일이 없습니다.${NC}"
    echo ""
    exit 0
  fi

  echo -e "${YELLOW}  📋 스테이징된 파일이 없습니다. 변경된 파일:${NC}"
  echo ""

  if [ -n "$UNSTAGED_FILES" ]; then
    echo -e "${RED}  Modified:${NC}"
    echo "$UNSTAGED_FILES" | while read -r f; do echo -e "    ${RED}M${NC}  $f"; done
    echo ""
  fi

  if [ -n "$UNTRACKED_FILES" ]; then
    echo -e "${GREEN}  Untracked:${NC}"
    echo "$UNTRACKED_FILES" | while read -r f; do echo -e "    ${GREEN}?${NC}  $f"; done
    echo ""
  fi

  echo -e "${CYAN}  모든 변경 파일을 스테이징할까요?${NC}"
  echo ""
  echo -e "    ${BOLD}1)${NC} 모든 파일 스테이징 (git add -A)"
  echo -e "    ${BOLD}2)${NC} 직접 선택 후 다시 실행"
  echo -e "    ${BOLD}q)${NC} 취소"
  echo ""
  read -rp "  선택 [1/2/q]: " stage_choice

  case $stage_choice in
    1)
      git add -A
      STAGED_FILES=$(git diff --cached --name-only)
      echo ""
      echo -e "${GREEN}  ✓ 모든 파일이 스테이징되었습니다.${NC}"
      echo ""
      ;;
    2)
      echo ""
      echo -e "${DIM}  git add <파일명> 으로 스테이징 후 다시 실행해주세요.${NC}"
      echo ""
      exit 0
      ;;
    *)
      echo ""
      echo -e "${DIM}  취소되었습니다.${NC}"
      echo ""
      exit 0
      ;;
  esac
fi

# ============================================================
# 2. 스테이징된 파일 표시
# ============================================================
echo -e "${GREEN}  📁 스테이징된 파일 ($(echo "$STAGED_FILES" | wc -l | tr -d ' ')개):${NC}"
echo ""
echo "$STAGED_FILES" | while read -r f; do
  echo -e "    ${GREEN}✓${NC}  $f"
done
echo ""

# ============================================================
# 3. 변경 파일 분석 → Type/Scope 추론
# ============================================================

# 파일 경로별 scope 매핑 함수
get_scope_from_path() {
  local file="$1"
  case "$file" in
    # 도메인 scope
    *categories* | *CategoryGrid*)           echo "category" ;;
    *styles* | *StyleCard* | *FilterBar*)    echo "style" ;;
    *products* | *ProductCompare*)           echo "product" ;;
    *PurchaseLink* | */links/*)              echo "purchase" ;;
    *search* | *SearchBar*)                  echo "search" ;;
    # 기술 scope
    src/components/ui/*)                     echo "ui" ;;
    *layout* | *Layout* | *nav*)             echo "layout" ;;
    *auth* | *nextauth* | *NextAuth*)        echo "auth" ;;
    prisma/* | *schema.prisma | *seed*)      echo "prisma" ;;
    *redis* | *cache*)                       echo "cache" ;;
    *scraper* | *cheerio* | *puppeteer*)     echo "scraper" ;;
    *cloudinary* | *image*)                  echo "image" ;;
    *pwa* | *manifest* | *sw.*)             echo "pwa" ;;
    *stores/* | *Store*)                     echo "store" ;;
    src/app/api/*)                           echo "api" ;;
    *config* | tsconfig* | next.config* | tailwind.config* | .eslintrc*) echo "config" ;;
    package.json | package-lock.json)        echo "deps" ;;
    .github/* | *ci* | *deploy*)            echo "cicd" ;;
    # 기타
    *.md | *.txt | docs/*)                   echo "docs" ;;
    *.test.* | *.spec.* | __tests__/*)      echo "test" ;;
    *)                                       echo "" ;;
  esac
}

# 파일 경로별 type 추론 함수
get_type_from_path() {
  local file="$1"
  case "$file" in
    prisma/migrations/* | *schema.prisma | *seed*) echo "db" ;;
    *.md | *.txt | docs/*)                          echo "docs" ;;
    *.test.* | *.spec.* | __tests__/*)             echo "test" ;;
    .github/* | *ci*)                               echo "ci" ;;
    *config* | tsconfig* | .eslintrc*)              echo "chore" ;;
    package.json | package-lock.json)               echo "chore" ;;
    *)                                              echo "feat" ;;
  esac
}

# diff 분석으로 변경 성격 파악
DIFF_STAT=$(git diff --cached --stat 2>/dev/null)
DIFF_ADDED=$(git diff --cached --numstat 2>/dev/null | awk '{added+=$1; deleted+=$2} END {print added "+" deleted "-"}')
LINES_ADDED=$(echo "$DIFF_ADDED" | cut -d'+' -f1)
LINES_DELETED=$(echo "$DIFF_ADDED" | cut -d'+' -f2 | cut -d'-' -f1)

# 주요 scope 집계
declare -A SCOPE_COUNT
declare -A TYPE_COUNT
PRIMARY_SCOPE=""
PRIMARY_TYPE="feat"
MAX_SCOPE_COUNT=0
MAX_TYPE_COUNT=0

while IFS= read -r file; do
  scope=$(get_scope_from_path "$file")
  type=$(get_type_from_path "$file")

  if [ -n "$scope" ]; then
    SCOPE_COUNT[$scope]=$(( ${SCOPE_COUNT[$scope]:-0} + 1 ))
    if [ ${SCOPE_COUNT[$scope]} -gt $MAX_SCOPE_COUNT ]; then
      MAX_SCOPE_COUNT=${SCOPE_COUNT[$scope]}
      PRIMARY_SCOPE="$scope"
    fi
  fi

  if [ -n "$type" ]; then
    TYPE_COUNT[$type]=$(( ${TYPE_COUNT[$type]:-0} + 1 ))
    if [ ${TYPE_COUNT[$type]} -gt $MAX_TYPE_COUNT ]; then
      MAX_TYPE_COUNT=${TYPE_COUNT[$type]}
      PRIMARY_TYPE="$type"
    fi
  fi
done <<< "$STAGED_FILES"

# scope를 결정하지 못한 경우 기본값
if [ -z "$PRIMARY_SCOPE" ]; then
  PRIMARY_SCOPE="config"
fi

# 삭제가 추가보다 많으면 refactor 가능성
if [ "${LINES_DELETED:-0}" -gt "${LINES_ADDED:-0}" ] && [ "$PRIMARY_TYPE" = "feat" ]; then
  SECONDARY_TYPE="refactor"
else
  SECONDARY_TYPE="$PRIMARY_TYPE"
fi

# 관련 scope 목록 (상위 2개)
RELATED_SCOPES=()
for scope in "${!SCOPE_COUNT[@]}"; do
  RELATED_SCOPES+=("$scope")
done

# ============================================================
# 4. 커밋 메시지 3개 추천 생성
# ============================================================

# diff에서 주요 변경 내용 요약 추출 (파일 이름 기반)
FILE_LIST_SUMMARY=""
FILE_COUNT=$(echo "$STAGED_FILES" | wc -l | tr -d ' ')
FIRST_FILES=$(echo "$STAGED_FILES" | head -3 | xargs -I{} basename {} | tr '\n' ', ' | sed 's/,$//')

# 변경된 컴포넌트/파일 이름 추출
CHANGED_COMPONENTS=""
while IFS= read -r file; do
  base=$(basename "$file" | sed 's/\.[^.]*$//')
  case "$base" in
    page|route|layout|index) base=$(echo "$file" | awk -F'/' '{print $(NF-1)}') ;;
  esac
  if [ -n "$CHANGED_COMPONENTS" ]; then
    CHANGED_COMPONENTS="$CHANGED_COMPONENTS, $base"
  else
    CHANGED_COMPONENTS="$base"
  fi
done <<< "$(echo "$STAGED_FILES" | head -5)"

# 새 파일 여부 확인
NEW_FILES=$(git diff --cached --diff-filter=A --name-only 2>/dev/null)
MODIFIED_FILES=$(git diff --cached --diff-filter=M --name-only 2>/dev/null)
DELETED_FILES=$(git diff --cached --diff-filter=D --name-only 2>/dev/null)

# 동작 동사 결정
if [ -n "$NEW_FILES" ] && [ -z "$MODIFIED_FILES" ] && [ -z "$DELETED_FILES" ]; then
  ACTION_VERB="추가"
  ACTION_TYPE="feat"
elif [ -z "$NEW_FILES" ] && [ -z "$MODIFIED_FILES" ] && [ -n "$DELETED_FILES" ]; then
  ACTION_VERB="제거"
  ACTION_TYPE="refactor"
elif [ -z "$NEW_FILES" ] && [ -n "$MODIFIED_FILES" ] && [ -z "$DELETED_FILES" ]; then
  ACTION_VERB="수정"
  ACTION_TYPE="fix"
else
  ACTION_VERB="구현"
  ACTION_TYPE="feat"
fi

# ── 추천 메시지 생성 ──

# 추천 1: 가장 구체적인 메시지 (주요 scope + 파일 기반)
MSG1_TYPE="${ACTION_TYPE}"
MSG1_SCOPE="${PRIMARY_SCOPE}"
if [ "$FILE_COUNT" -eq 1 ]; then
  SINGLE_FILE=$(basename "$(echo "$STAGED_FILES" | head -1)" | sed 's/\.[^.]*$//')
  case "$SINGLE_FILE" in
    page|route|layout|index)
      SINGLE_FILE=$(echo "$STAGED_FILES" | head -1 | awk -F'/' '{print $(NF-1)}')
      ;;
  esac
  MSG1_SUBJECT="${SINGLE_FILE} ${ACTION_VERB}"
else
  MSG1_SUBJECT="${CHANGED_COMPONENTS} ${ACTION_VERB}"
fi
# 50자 초과 시 자르기
if [ ${#MSG1_SUBJECT} -gt 50 ]; then
  MSG1_SUBJECT=$(echo "$MSG1_SUBJECT" | cut -c1-47)"..."
fi
MSG1="${MSG1_TYPE}(${MSG1_SCOPE}): ${MSG1_SUBJECT}"

# 추천 2: 기능 중심 메시지
MSG2_TYPE="${PRIMARY_TYPE}"
MSG2_SCOPE="${PRIMARY_SCOPE}"
case "$PRIMARY_SCOPE" in
  category)  MSG2_SUBJECT="카테고리 관련 기능 ${ACTION_VERB}" ;;
  style)     MSG2_SUBJECT="셀럽 스타일 관련 기능 ${ACTION_VERB}" ;;
  product)   MSG2_SUBJECT="상품 비교 관련 기능 ${ACTION_VERB}" ;;
  purchase)  MSG2_SUBJECT="구매처 관련 기능 ${ACTION_VERB}" ;;
  search)    MSG2_SUBJECT="검색 기능 ${ACTION_VERB}" ;;
  ui)        MSG2_SUBJECT="공통 UI 컴포넌트 ${ACTION_VERB}" ;;
  layout)    MSG2_SUBJECT="레이아웃 ${ACTION_VERB}" ;;
  auth)      MSG2_SUBJECT="인증 기능 ${ACTION_VERB}" ;;
  prisma)    MSG2_SUBJECT="데이터베이스 스키마 ${ACTION_VERB}" ;;
  cache)     MSG2_SUBJECT="캐싱 로직 ${ACTION_VERB}" ;;
  scraper)   MSG2_SUBJECT="가격 크롤러 ${ACTION_VERB}" ;;
  image)     MSG2_SUBJECT="이미지 처리 ${ACTION_VERB}" ;;
  pwa)       MSG2_SUBJECT="PWA 기능 ${ACTION_VERB}" ;;
  store)     MSG2_SUBJECT="Zustand 스토어 ${ACTION_VERB}" ;;
  api)       MSG2_SUBJECT="API 엔드포인트 ${ACTION_VERB}" ;;
  config)    MSG2_SUBJECT="프로젝트 설정 ${ACTION_VERB}" ;;
  deps)      MSG2_SUBJECT="패키지 의존성 ${ACTION_VERB}" ;;
  cicd)      MSG2_SUBJECT="CI/CD 파이프라인 ${ACTION_VERB}" ;;
  *)         MSG2_SUBJECT="${FILE_COUNT}개 파일 ${ACTION_VERB}" ;;
esac
MSG2="${MSG2_TYPE}(${MSG2_SCOPE}): ${MSG2_SUBJECT}"

# 추천 3: 변경 규모 중심 메시지 (다른 type 제안)
if [ "$ACTION_TYPE" = "feat" ]; then
  MSG3_TYPE="chore"
elif [ "$ACTION_TYPE" = "fix" ]; then
  MSG3_TYPE="refactor"
else
  MSG3_TYPE="feat"
fi

# 두 번째 scope가 있으면 활용
if [ ${#RELATED_SCOPES[@]} -gt 1 ]; then
  MSG3_SCOPE="${RELATED_SCOPES[1]}"
else
  MSG3_SCOPE="$PRIMARY_SCOPE"
fi

MSG3_SUBJECT="${FILE_COUNT}개 파일 변경 (${LINES_ADDED:-0}줄 추가, ${LINES_DELETED:-0}줄 삭제)"
if [ ${#MSG3_SUBJECT} -gt 50 ]; then
  MSG3_SUBJECT="${FILE_COUNT}개 파일 변경"
fi
MSG3="${MSG3_TYPE}(${MSG3_SCOPE}): ${MSG3_SUBJECT}"

# ============================================================
# 5. 커밋 컨벤션 요약 표시 (COMMIT_CONVENTION.md 기반)
# ============================================================
show_convention_summary

# ============================================================
# 6. 추천 메시지 표시 & 선택
# ============================================================
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  📝 커밋 메시지 추천${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}${GREEN}1)${NC} ${MSG1}"
echo ""
echo -e "  ${BOLD}${YELLOW}2)${NC} ${MSG2}"
echo ""
echo -e "  ${BOLD}${MAGENTA}3)${NC} ${MSG3}"
echo ""
echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}4)${NC} 직접 입력"
echo -e "  ${BOLD}e)${NC} 선택 후 편집"
echo -e "  ${BOLD}c)${NC} 컨벤션 전체 보기 ${DIM}(COMMIT_CONVENTION.md)${NC}"
echo -e "  ${BOLD}q)${NC} 취소"
echo ""
read -rp "  선택 [1/2/3/4/e/c/q]: " choice

COMMIT_MSG=""
NEEDS_EDIT=false

case $choice in
  1) COMMIT_MSG="$MSG1" ;;
  2) COMMIT_MSG="$MSG2" ;;
  3) COMMIT_MSG="$MSG3" ;;
  4)
    echo ""
    echo -e "${DIM}  형식: <type>(<scope>): <subject>${NC}"
    echo -e "${DIM}  예시: feat(style): 셀럽 스타일 필터링 기능 구현${NC}"
    echo ""
    read -rp "  커밋 메시지: " COMMIT_MSG
    ;;
  e)
    echo ""
    echo -e "  편집할 메시지 번호를 선택하세요 [1/2/3]: "
    read -rp "  번호: " edit_num
    case $edit_num in
      1) COMMIT_MSG="$MSG1" ;;
      2) COMMIT_MSG="$MSG2" ;;
      3) COMMIT_MSG="$MSG3" ;;
      *) COMMIT_MSG="$MSG1" ;;
    esac
    echo ""
    echo -e "${DIM}  현재 메시지: ${COMMIT_MSG}${NC}"
    echo -e "${DIM}  새 메시지를 입력하세요 (Enter로 현재 메시지 유지):${NC}"
    echo ""
    read -rp "  커밋 메시지: " edited_msg
    if [ -n "$edited_msg" ]; then
      COMMIT_MSG="$edited_msg"
    fi
    ;;
  c|C)
    show_convention_full
    # 전체 내용 확인 후 재귀 실행 대신, 다시 선택 안내
    echo -e "${CYAN}  다시 스크립트를 실행해주세요:${NC} ${DIM}bash scripts/commit.sh${NC}"
    echo ""
    exit 0
    ;;
  q|Q)
    echo ""
    echo -e "${DIM}  취소되었습니다.${NC}"
    echo ""
    exit 0
    ;;
  *)
    echo ""
    echo -e "${RED}  잘못된 선택입니다.${NC}"
    echo ""
    exit 1
    ;;
esac

if [ -z "$COMMIT_MSG" ]; then
  echo ""
  echo -e "${RED}  커밋 메시지가 비어있습니다.${NC}"
  echo ""
  exit 1
fi

# ============================================================
# 7. Body 추가 여부 확인
# ============================================================
echo ""
echo -e "${CYAN}  Body를 추가할까요? (변경 상세 설명)${NC}"
echo -e "  ${BOLD}y)${NC} Body 추가"
echo -e "  ${BOLD}n)${NC} Subject만으로 커밋 (기본)"
echo ""
read -rp "  선택 [y/N]: " add_body

FULL_MSG="$COMMIT_MSG"

if [ "$add_body" = "y" ] || [ "$add_body" = "Y" ]; then
  echo ""
  echo -e "${DIM}  변경 내용을 입력하세요 (각 줄 앞에 - 를 붙여주세요)${NC}"
  echo -e "${DIM}  빈 줄을 입력하면 종료됩니다.${NC}"
  echo ""

  BODY=""
  while true; do
    read -rp "  " line
    if [ -z "$line" ]; then
      break
    fi
    if [ -n "$BODY" ]; then
      BODY="$BODY
$line"
    else
      BODY="$line"
    fi
  done

  if [ -n "$BODY" ]; then
    FULL_MSG="$COMMIT_MSG

$BODY"
  fi
fi

# ============================================================
# 8. 최종 확인
# ============================================================
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  ✅ 최종 확인${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BOLD}커밋 메시지:${NC}"
echo "$FULL_MSG" | while IFS= read -r line; do
  echo -e "    ${GREEN}$line${NC}"
done
echo ""
echo -e "  ${BOLD}파일 수:${NC} ${FILE_COUNT}개"
echo -e "  ${BOLD}변경량:${NC} ${LINES_ADDED:-0}줄 추가, ${LINES_DELETED:-0}줄 삭제"

if [ "$NO_PUSH" = true ]; then
  echo -e "  ${BOLD}Push:${NC} ${DIM}건너뜀 (--no-push)${NC}"
else
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
  echo -e "  ${BOLD}Push:${NC} → origin/${CURRENT_BRANCH}"
fi

echo ""
read -rp "  진행할까요? [Y/n]: " confirm

if [ "$confirm" = "n" ] || [ "$confirm" = "N" ]; then
  echo ""
  echo -e "${DIM}  취소되었습니다. 스테이징은 유지됩니다.${NC}"
  echo ""
  exit 0
fi

# ============================================================
# 9. 테스트 실행 (테스트 파일이 존재하는 경우만)
# ============================================================

# vitest가 설치되어 있고, 테스트 파일이 하나라도 존재하면 실행
TEST_FILES=$(find "$PROJECT_ROOT/src" -name "*.test.ts" -o -name "*.test.tsx" 2>/dev/null)

if [ -n "$TEST_FILES" ] && npx vitest --version >/dev/null 2>&1; then
  echo ""
  echo -e "${YELLOW}  ⏳ 테스트 실행 중...${NC}"
  echo ""

  if npx vitest run --reporter=verbose 2>&1; then
    echo ""
    echo -e "${GREEN}  ✅ 모든 테스트 통과!${NC}"
  else
    echo ""
    echo -e "${RED}  ❌ 테스트 실패! 커밋이 차단되었습니다.${NC}"
    echo -e "${DIM}  테스트를 수정한 후 다시 시도해주세요.${NC}"
    echo -e "${DIM}  실행: npx vitest run${NC}"
    echo ""
    exit 1
  fi
else
  echo ""
  echo -e "${DIM}  ℹ 테스트 파일 없음 — 테스트 단계 건너뜀${NC}"
fi

# ============================================================
# 10. Commit 실행
# ============================================================
echo ""
echo -e "${YELLOW}  ⏳ 커밋 중...${NC}"

# AIDEALS_SMART_COMMIT 환경변수로 commit-msg hook에서 스크립트 경유 여부 확인
export AIDEALS_SMART_COMMIT=1
git commit -m "$FULL_MSG"

COMMIT_HASH=$(git rev-parse --short HEAD)
echo ""
echo -e "${GREEN}  ✅ 커밋 완료! (${COMMIT_HASH})${NC}"

# ============================================================
# 11. Push 실행
# ============================================================
if [ "$NO_PUSH" = false ]; then
  CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "main")

  echo ""
  echo -e "${YELLOW}  ⏳ Push 중... (origin/${CURRENT_BRANCH})${NC}"

  if git push origin "$CURRENT_BRANCH" 2>&1; then
    echo ""
    echo -e "${GREEN}  ✅ Push 완료! (origin/${CURRENT_BRANCH})${NC}"
  else
    echo ""
    echo -e "${RED}  ❌ Push 실패. 수동으로 push 해주세요:${NC}"
    echo -e "${DIM}     git push origin ${CURRENT_BRANCH}${NC}"
  fi
fi

# ============================================================
# 완료
# ============================================================
echo ""
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}${GREEN}  🎉 완료!${NC}"
echo -e "${BOLD}${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
