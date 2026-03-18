# PROJECT_RULES.md — aideals 추가 규칙

> 이 문서는 `claude.md`(코딩 컨벤션/디자인 패턴)를 **보완**하는 프로젝트 운영 규칙이다. Git 커밋 규칙도 이 문서의 섹션 3에 통합되어 있다.
> 각 규칙은 독립적으로 읽고 수정할 수 있도록 작성되었다.
>
> **프로젝트 요약:** aideals는 패션 비교 플랫폼(Next.js 14 App Router + TypeScript + TailwindCSS + Prisma + PostgreSQL)이다.
> 핵심 플로우: 카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인

---

## 목차

1. [테스트 전략](#1-테스트-전략)
2. [환경 변수 관리](#2-환경-변수-관리)
3. [브랜치 전략 및 Git 커밋 규칙](#3-브랜치-전략-및-git-커밋-규칙)
4. [에러 코드 체계](#4-에러-코드-체계)
5. [데이터 시드 규칙](#5-데이터-시드-규칙)
6. [성능 기준 (Performance Budget)](#6-성능-기준-performance-budget)
7. [로깅 / 모니터링 규칙](#7-로깅--모니터링-규칙)

---

## 1. 테스트 전략

### 배경

이 프로젝트는 API Route 핸들러, Server/Client 컴포넌트, 크롤러 모듈 등 다양한 레이어가 있다. 테스트 없이 진행하면 리팩토링이나 기능 추가 시 기존 기능이 깨지는 것을 감지하기 어렵다.

### 사용 도구

| 도구 | 용도 |
|------|------|
| `vitest` | 테스트 러너 (Jest 호환, Vite 기반으로 빠름) |
| `@testing-library/react` | 컴포넌트 인터랙션 테스트 |
| `msw` (Mock Service Worker) | API 모킹 (fetch 요청을 인터셉트) |

### 테스트 파일 위치

테스트 파일은 **대상 파일과 같은 디렉토리**에 배치한다.

```
src/
├── lib/api/
│   ├── withErrorHandler.ts
│   └── withErrorHandler.test.ts      ← 같은 폴더
├── components/
│   ├── StyleCard.tsx
│   └── StyleCard.test.tsx            ← 같은 폴더
├── app/api/styles/
│   ├── route.ts
│   └── route.test.ts                 ← 같은 폴더
```

### 테스트 범위 기준

| 레이어 | 테스트 종류 | 필수 여부 | 설명 |
|--------|-----------|----------|------|
| API Route 핸들러 (`src/app/api/`) | 단위 테스트 | **필수** | 정상 응답, 에러 응답(400/404/500), 쿼리 파라미터 검증 |
| 유틸/라이브러리 (`src/lib/`, `src/utils/`) | 단위 테스트 | **필수** | 순수 함수, 파서, 에러 클래스 |
| 크롤러 (`src/lib/scraper/`) | 단위 테스트 | **필수** | HTML 파싱 로직 (실제 HTTP 요청은 모킹) |
| Client 컴포넌트 (인터랙션 있는 것) | 인터랙션 테스트 | 권장 | 필터 선택, 정렬 변경 등 사용자 동작 검증 |
| Server 컴포넌트 (표시만) | 스냅샷 테스트 | 선택 | 레이아웃이 깨지지 않는지 확인 |
| Prisma 쿼리 | — | 제외 | Prisma가 타입 안전성을 보장하므로 통합 테스트로 대체 |

### 테스트 네이밍 규칙

```typescript
describe("GET /api/styles", () => {
  it("필터 없이 요청하면 전체 스타일 목록을 반환한다", async () => { ... });
  it("gender=male로 필터하면 남성 스타일만 반환한다", async () => { ... });
  it("존재하지 않는 categoryId면 빈 배열을 반환한다", async () => { ... });
  it("page가 음수면 400 에러를 반환한다", async () => { ... });
});
```

- `describe`: 테스트 대상 (API 경로, 함수명, 컴포넌트명)
- `it`: **한글**로 기대 동작을 서술한다

### 카버리지 목표

전체 커버리지를 추구하지 않는다. 깨지면 치명적인 부분(크롤러 파싱, API 핸들러)에 집중한다.

### 커밋 전 테스트 검증

`scripts/commit.sh`에서 커밋 실행 전에 `vitest run`을 자동 실행한다. 테스트 실패 시 커밋이 차단된다. 테스트 파일이 없는 초기 단계에서는 테스트 단계를 자동으로 건너뜌다.

### 정적 분석

Claude Code의 PostToolUse hook(`.claude/hooks/lint-check.mjs`)이 파일 편집마다 ESLint + TypeScript 타입 체크를 자동 실행한다. 별도 설정 없이 정적 분석 계층이 확보된다.

### CI 연동

GitHub Actions에서 PR마다 `vitest run`을 실행한다. 테스트 실패 시 머지를 차단한다.

### 적용 시점

- Phase 1: `vitest` 설치 및 설정 파일(`vitest.config.ts`) 생성, 커밋 전 테스트 검증 적용
- Phase 2: API Route 핸들러 테스트 필수 작성 시작
- Phase 3: 크롤러 모듈 테스트 필수 작성

---

## 2. 환경 변수 관리

### 배경

프로젝트는 Supabase(DB), Upstash(Redis), Cloudinary(이미지), NextAuth(인증), OAuth(카카오/구글) 등 여러 외부 서비스에 의존한다. 환경별로 필요한 변수가 다르고, 빠뜨리면 런타임 에러가 발생한다. 환경 변수를 체계적으로 관리하지 않으면 보안 사고(시크릿 유출)나 배포 장애(변수 누락)로 이어진다.

### 환경 변수 목록

| 변수명 | 필수 | Phase | 환경 | 설명 | 예시값 |
|--------|------|-------|------|------|--------|
| `DATABASE_URL` | ✅ | 1 | 전체 | Supabase PostgreSQL 연결 문자열 | `postgresql://user:pw@host:5432/db` |
| `UPSTASH_REDIS_REST_URL` | ❌ | 3 | 전체 | Upstash Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | 3 | 전체 | Upstash Redis 인증 토큰 | `AXxx...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ❌ | 3 | 전체 | Cloudinary 클라우드 이름 (클라이언트 노출 가능) | `my-cloud` |
| `CLOUDINARY_API_KEY` | ❌ | 3 | 서버 | Cloudinary API 키 | `123456789` |
| `CLOUDINARY_API_SECRET` | ❌ | 3 | 서버 | Cloudinary API 시크릿 | `abcDEF...` |
| `NEXTAUTH_URL` | ❌ | 4 | 전체 | 인증 콜백 기준 URL | `http://localhost:3000` |
| `NEXTAUTH_SECRET` | ❌ | 4 | 서버 | 세션 암호화 시크릿 (32자 이상 랜덤 문자열) | `openssl rand -base64 32` |
| `KAKAO_CLIENT_ID` | ❌ | 4 | 서버 | 카카오 OAuth 클라이언트 ID | `abcd1234...` |
| `KAKAO_CLIENT_SECRET` | ❌ | 4 | 서버 | 카카오 OAuth 클라이언트 시크릿 | `xxxx...` |
| `GOOGLE_CLIENT_ID` | ❌ | 4 | 서버 | 구글 OAuth 클라이언트 ID | `xxx.apps.googleusercontent.com` |
| `GOOGLE_CLIENT_SECRET` | ❌ | 4 | 서버 | 구글 OAuth 클라이언트 시크릿 | `GOCSPX-...` |

> 새로운 환경 변수를 추가할 때 이 테이블도 반드시 업데이트한다.

### 규칙

#### 규칙 1: 환경 파일 구분

| 파일 | 용도 | Git 커밋 | 비고 |
|------|------|----------|------|
| `.env.example` | 필요한 변수 키 목록 (값은 비워둠) | ✅ 커밋 | 새 환경에서 "뭘 채워야 하는지" 알려주는 템플릿 |
| `.env.local` | 로컬 개발용 실제 값 | ❌ 금지 | `.gitignore`에 반드시 포함 |
| Vercel 대시보드 | 프로덕션/프리뷰 환경 값 | — | 프로덕션 시크릿은 여기서만 설정 |

`.env`, `.env.development`, `.env.production` 등 Next.js가 지원하는 다른 파일은 사용하지 않는다. 파일이 많아지면 "어떤 파일의 값이 적용된 건지" 추적이 어렵기 때문에 `.env.example` + `.env.local` 두 개만 사용한다.

#### 규칙 2: 앱 시작 시 필수 변수 검증

필수 변수가 없으면 앱이 시작 시점에 즉시 에러를 던진다. `src/lib/env.ts`에서 검증한다.

```typescript
// src/lib/env.ts
function getRequiredEnv(key: string): string {
  const value = process.env[key];
  if (!value) throw new Error(`환경 변수 ${key}가 설정되지 않았습니다`);
  return value;
}

function getOptionalEnv(key: string): string | undefined {
  return process.env[key] || undefined;
}

export const env = {
  // Phase 1 — 필수
  DATABASE_URL: getRequiredEnv("DATABASE_URL"),

  // Phase 3 — 해당 Phase 도달 시 getRequiredEnv로 변경
  // UPSTASH_REDIS_REST_URL: getOptionalEnv("UPSTASH_REDIS_REST_URL"),
  // UPSTASH_REDIS_REST_TOKEN: getOptionalEnv("UPSTASH_REDIS_REST_TOKEN"),
};
```

Phase가 진행되면 해당 변수를 `getOptionalEnv` → `getRequiredEnv`로 변경하여, 빠뜨렸을 때 `npm run dev` 시점에서 즉시 알 수 있게 한다.

#### 규칙 3: 환경 변수 접근은 `src/lib/env.ts` 한 곳에서만

코드 전체에서 `process.env.XXX`를 직접 사용하지 않는다. 반드시 `env.ts`에서 export한 값을 import하여 사용한다.

```typescript
// ✅ 올바른 사용
import { env } from "@/lib/env";
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });

// ❌ 금지 — 오타 감지 불가, 검증 우회, 접근 포인트 분산
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
```

이점: 오타를 TypeScript 컴파일 타임에 잡을 수 있고, 어떤 변수가 어디서 쓰이는지 `env.ts`만 보면 파악할 수 있다.

#### 규칙 4: 변수 추가 시 체크리스트

새로운 환경 변수를 추가할 때 아래 4곳을 한 세트로 업데이트한다. 하나라도 빠지면 본인 또는 미래의 협업자가 혼란을 겪는다.

1. `src/lib/env.ts` — 검증 로직 추가
2. `.env.example` — 키 추가 (값은 비워두거나 예시 형식만 기재)
3. `.env.local` — 실제 값 추가 (로컬 개발용)
4. 위 환경 변수 목록 테이블 — Phase, 환경, 설명 기재

### 주의사항

#### `NEXT_PUBLIC_` 접두사 혼동 금지

Next.js에서 `NEXT_PUBLIC_` 접두사가 붙은 변수는 빌드 시 JavaScript 번들에 인라인되어 **브라우저에서 누구나 볼 수 있다**. 클라이언트 컴포넌트에서 환경 변수가 `undefined`라고 해서 무심코 이 접두사를 붙이면 시크릿이 노출된다.

```
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=my-cloud   ← ✅ 클라우드 이름은 공개해도 안전
NEXT_PUBLIC_CLOUDINARY_API_SECRET=abcDEF...  ← ❌ 절대 금지 — 시크릿 노출
```

판단 기준: "이 값이 브라우저 개발자 도구에서 보여도 괜찮은가?" → 괜찮으면 `NEXT_PUBLIC_`, 아니면 접두사 없이 서버에서만 사용한다.

#### `.env` 파일 Git 커밋 금지 및 유출 대응

`.env.local`은 `.gitignore`에 포함되어 있어야 한다. 만약 실수로 시크릿이 포함된 파일을 커밋했다면:

1. Git 히스토리에서 해당 커밋을 제거하는 것만으로는 **부족하다** (포크, 캐시 등에 남아있을 수 있음)
2. **해당 서비스에서 키를 즉시 무효화하고 새로 발급받는다**
3. 새 키를 `.env.local`과 Vercel 대시보드에 설정한다

### 적용 시점

- Phase 1: `src/lib/env.ts` 생성, `DATABASE_URL` 검증, `.env.example` 작성
- Phase 3: Cloudinary, Upstash 변수 추가 및 필수 전환
- Phase 4: NextAuth, OAuth 변수 추가 및 필수 전환

---

## 3. 브랜치 전략 및 Git 커밋 규칙

### 배경

1인 개발 프로젝트로, 복잡한 브랜치 전략 없이 `main` 브랜치에서 직접 작업하고 push한다. 대신 커밋 메시지 컨벤션을 엄격하게 유지하여 변경 이력의 가독성과 추적성을 확보한다. 커밋 메시지는 자동화 도구(commit-msg hook, scripts/commit.sh, auto-commit hook)로 검증 및 보조한다.

### 3.1 브랜치 전략

`main` 브랜치 단일 운영이다. 별도의 `dev`, 피처 브랜치를 사용하지 않는다.

```
main ─────────────────────────────────── 유일한 브랜치 (개발 + 배포)
```

#### 규칙

- 모든 작업은 `main` 브랜치에서 직접 커밋하고 push한다.
- 별도의 브랜치를 생성하지 않는다.
- 롤백이 필요하면 `git revert`를 사용한다.

### 3.2 커밋 메시지 형식

```
<type>(<scope>): <subject>

[body]

[footer]
```

#### 예시

```
feat(style): 셀럽 스타일 목록 필터링 기능 구현

- 성별, 시즌, 태그 기반 필터 추가
- useFilterStore와 URL 쿼리 파라미터 동기화
- Intersection Observer 기반 무한 스크롤 적용

Phase: 2
```

### 3.3 Type (필수)

| Type | 설명 | 예시 |
|------|------|------|
| `feat` | 새로운 기능 추가 | 카테고리 그리드 컴포넌트 구현 |
| `fix` | 버그 수정 | 모바일에서 이미지 레이아웃 깨짐 수정 |
| `refactor` | 기능 변경 없는 코드 리팩토링 | Prisma 쿼리 최적화 |
| `style` | 코드 포맷팅, 세미콜론 등 (동작 변경 없음) | ESLint 규칙 적용 |
| `design` | UI/UX 디자인 변경 (TailwindCSS 스타일링) | 상품 카드 반응형 레이아웃 조정 |
| `docs` | 문서 작성 및 수정 | README 업데이트, API 명세 추가 |
| `test` | 테스트 코드 추가/수정 | 카테고리 API 단위 테스트 |
| `chore` | 빌드, 설정, 패키지 관리 등 | TailwindCSS 플러그인 추가 |
| `init` | 프로젝트 초기 설정 | Next.js 프로젝트 생성 |
| `db` | 데이터베이스 스키마, 마이그레이션, 시드 | Prisma 마이그레이션 추가 |
| `perf` | 성능 개선 | Redis 캐싱 적용, 이미지 최적화 |
| `ci` | CI/CD 파이프라인 설정 | GitHub Actions 워크플로우 추가 |
| `deploy` | 배포 관련 설정 | Vercel 환경 변수 설정 |
| `revert` | 이전 커밋 되돌리기 | feat(style) 커밋 되돌리기 |

### 3.4 Scope (필수)

프로젝트의 도메인 모듈과 기술 영역으로 분류해서 나타내며, 이 중에서 가장 핵심적인 Scope 하나만 선택해 작성한다.

#### 도메인 Scope

| Scope | 대상 |
|-------|------|
| `category` | 카테고리 트리, CategoryGrid, `/api/categories` |
| `style` | 셀럽 스타일, StyleCard, FilterBar, `/api/styles` |
| `product` | 유사 상품 비교, ProductCompareCard, `/api/products` |
| `purchase` | 구매처 목록, PurchaseLinkList, `/api/products/:id/links` |
| `search` | 통합 검색, SearchBar, `/api/search` |

#### 기술 Scope

| Scope | 대상 |
|-------|------|
| `ui` | 공통 UI 컴포넌트 (Button, Card, Modal, Skeleton 등) |
| `layout` | 레이아웃, 네비게이션, 반응형 구조 |
| `auth` | NextAuth.js 인증, 소셜 로그인 |
| `prisma` | Prisma 스키마, 마이그레이션, 시드 |
| `cache` | Redis(Upstash) 캐싱 |
| `scraper` | Cheerio/Puppeteer 가격 크롤러 |
| `image` | Cloudinary, next/image 이미지 처리 |
| `pwa` | next-pwa, 서비스 워커, 오프라인 |
| `store` | Zustand 상태 관리 |
| `api` | API Route 공통 (미들웨어, 에러 핸들링) |
| `config` | 프로젝트 설정 (next.config, tailwind.config, tsconfig 등) |
| `deps` | 패키지 의존성 추가/업데이트/삭제 |
| `cicd` | GitHub Actions, Vercel 배포 설정 |

### 3.5 Subject / Body / Footer 규칙

#### Subject (필수)

- 한글로 작성한다
- 50자 이내로 간결하게 작성한다
- 마침표를 붙이지 않는다
- 명령형으로 작성한다 (예: "추가", "수정", "제거", "개선")

#### Body (선택)

- Subject만으로 설명이 부족할 때 작성한다
- Subject와 Body 사이에 **반드시 빈 줄 1개**를 넣는다
- 무엇을, 왜 변경했는지 설명한다
- 각 항목은 `-`로 시작한다
- 한 줄은 72자 이내로 작성한다

#### Footer (선택)

- `Phase: 1~4` — 개발 로드맵 단계 표기
- `Breaking:` — 호환성이 깨지는 변경 사항
- `Closes: #이슈번호` — 관련 이슈 닫기
- `Related: #이슈번호` — 관련 이슈 참조

### 3.6 자동 검증 (commit-msg hook)

`.git/hooks/commit-msg` 훅이 커밋 시 아래 항목을 자동 검증하며, 위반 시 커밋이 거부된다.

| 검증 항목 | 규칙 | 위반 시 |
|----------|------|--------|
| 형식 | `<type>(<scope>): <subject>` 패턴 필수 | 커밋 거부 + 허용 type/scope 안내 |
| Subject 길이 | 50자 이내 | 커밋 거부 + 현재 길이 표시 |
| 마침표 금지 | Subject 끝에 `.` 불가 | 커밋 거부 |
| Body 구분 | Subject-Body 사이 빈 줄 필수 | 커밋 거부 |
| 예외 | Merge, Revert 커밋은 검증 건너뜀 | — |

### 3.7 인터랙티브 커밋 도구 (scripts/commit.sh)

`bash scripts/commit.sh`를 실행하면 아래 과정을 자동으로 수행한다.

1. **스테이징 확인**: 스테이징된 파일이 없으면 전체 스테이징(`git add -A`) 여부를 물어본다
2. **변경 분석**: 변경된 파일 경로를 분석하여 type과 scope를 자동 추론한다
3. **메시지 추천**: 분석 결과를 바탕으로 커밋 메시지 3개를 추천한다
4. **선택/편집**: 추천 메시지 선택, 직접 입력, 선택 후 편집 중 하나를 고른다
5. **Body 추가**: 선택적으로 Body를 추가할 수 있다
6. **테스트 실행**: 테스트 파일이 존재하면 `vitest run`을 자동 실행하고, 실패 시 커밋을 차단한다
7. **커밋 & Push**: commit-msg hook 검증을 거친 뒤 `origin/<현재 브랜치>`로 push한다

옵션: `bash scripts/commit.sh --no-push` — push 없이 커밋만 실행한다.

### 3.8 자동 커밋 (Claude Code Stop Hook)

`.claude/hooks/auto-commit.mjs`가 Claude Code 세션 완료 시 자동으로 트리거된다.

- Claude 응답이 끝날 때마다 `git status --porcelain`으로 변경사항을 확인한다
- 변경사항이 있으면 `scripts/commit.sh`를 인터랙티브 모드로 실행한다
- `stop_hook_active` 플래그로 무한 루프를 방지한다
- 변경사항이 없으면 아무것도 하지 않고 종료한다

### 3.9 커밋 메시지 예시 모음

```bash
# Phase 1 — MVP
init(config): Next.js 프로젝트 초기 설정
db(prisma): 카테고리, 셀럽스타일, 상품, 구매처 스키마 정의
feat(category): CategoryGrid 컴포넌트 구현
feat(style): StyleCard 컴포넌트 및 스타일 목록 페이지 구현
design(layout): 모바일 우선 반응형 레이아웃 완성

# Phase 2 — 핵심 기능
feat(product): ProductCompareCard 컴포넌트 구현
feat(purchase): PurchaseLinkList 구매처 목록 구현
feat(style): 성별/시즌/태그 필터 기능 추가
feat(search): 통합 검색 API 및 SearchBar 구현
feat(api): 카테고리 API Route 구현

# Phase 3 — 데이터 확장
feat(scraper): Cheerio 기반 가격 크롤러 구현
perf(cache): Upstash Redis 가격 캐싱 적용
feat(image): Cloudinary 이미지 업로드 파이프라인 구현

# Phase 4 — 고도화
feat(pwa): next-pwa 서비스 워커 및 오프라인 캐싱 적용
feat(auth): NextAuth.js 카카오/구글 소셜 로그인 연동
ci(cicd): GitHub Actions lint/typecheck/test 파이프라인 구성

# 일반
fix(product): 가격순 정렬 시 null 가격 처리 오류 수정
refactor(store): useFilterStore 셀렉터 패턴 개선
docs(api): 스타일 API 엔드포인트 명세 추가
chore(deps): zustand 4.5.0 버전 업데이트
```

---

## 4. 에러 코드 체계

### 배경

현재 프로젝트의 에러 처리는 `AppError`, `NotFoundError`, `ValidationError` 클래스를 사용하고, HTTP 상태 코드와 메시지를 반환한다(`claude.md` 참고). 그러나 프론트엔드에서 에러 유형별로 다른 UI를 보여주려면 HTTP 상태 코드만으로는 구분이 부족하다.

### 에러 응답 포맷

```json
{
  "status": 400,
  "code": "INVALID_FILTER_VALUE",
  "message": "gender 값은 male, female, unisex 중 하나여야 합니다"
}
```

| 필드 | 타입 | 설명 |
|------|------|------|
| `status` | `number` | HTTP 상태 코드 |
| `code` | `string` | 머신 리더블 에러 코드 (프론트엔드 분기용) |
| `message` | `string` | 사람이 읽을 수 있는 에러 설명 (한글) |

### 에러 코드 목록

#### 공통 (Common)

| 코드 | 상태 | 설명 |
|------|------|------|
| `INTERNAL_SERVER_ERROR` | 500 | 예상치 못한 서버 오류 |
| `METHOD_NOT_ALLOWED` | 405 | 지원하지 않는 HTTP 메서드 |

#### 검증 (Validation) — 400

| 코드 | 설명 |
|------|------|
| `MISSING_REQUIRED_FIELD` | 필수 필드 누락 |
| `INVALID_FILTER_VALUE` | 필터 값이 허용 범위 밖 |
| `INVALID_SORT_VALUE` | 정렬 기준이 허용 값 밖 |
| `INVALID_PAGINATION` | page/limit 값이 유효하지 않음 |
| `INVALID_ID_FORMAT` | ID 포맷이 올바르지 않음 |

#### 리소스 (Resource) — 404

| 코드 | 설명 |
|------|------|
| `CATEGORY_NOT_FOUND` | 카테고리를 찾을 수 없음 |
| `STYLE_NOT_FOUND` | 셀럽 스타일을 찾을 수 없음 |
| `PRODUCT_NOT_FOUND` | 상품을 찾을 수 없음 |

#### 크롤러 (Scraper) — 502/503

| 코드 | 설명 |
|------|------|
| `SCRAPER_TARGET_UNREACHABLE` | 크롤링 대상 사이트 접근 불가 |
| `SCRAPER_PARSE_FAILED` | HTML 파싱 실패 |
| `PRICE_DATA_STALE` | 캐시된 가격 데이터를 폴백으로 사용 중 (경고) |

### 구현 방법

기존 `AppError` 클래스에 `code` 필드를 추가한다.

```typescript
// src/lib/api/errors.ts 수정
export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: string = "INTERNAL_SERVER_ERROR",
  ) {
    super(message);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code: string) {
    super(`${resource}을(를) 찾을 수 없습니다`, 404, code);
  }
}

export class ValidationError extends AppError {
  constructor(message: string, code: string = "MISSING_REQUIRED_FIELD") {
    super(message, 400, code);
  }
}
```

`withErrorHandler`의 에러 응답에도 `code`를 포함한다.

```typescript
// withErrorHandler.ts 응답 변경
return NextResponse.json(
  { status: error.statusCode, code: error.code, message: error.message },
  { status: error.statusCode },
);
```

### 프론트엔드 활용 예시

```typescript
// 클라이언트에서 에러 코드 기반 분기
if (error.code === "STYLE_NOT_FOUND") {
  // "해당 스타일이 삭제되었거나 존재하지 않습니다" UI 표시
} else if (error.code === "PRICE_DATA_STALE") {
  // "가격 정보가 최신이 아닐 수 있습니다" 경고 배너 표시
}
```

### 적용 시점

- Phase 1: `AppError`에 `code` 필드 추가, 기본 에러 코드 정의
- Phase 2: API Route 개발 시 모든 에러에 코드 부여
- Phase 3: 크롤러 관련 에러 코드 추가

---

## 5. 데이터 시드 규칙

### 배경

Phase 1은 목 데이터 기반 MVP를 만든다. 개발과 테스트를 위해 일관된 시드 데이터가 필요하고, DB를 초기화한 후에도 동일한 상태를 재현할 수 있어야 한다.

### 시드 파일 위치

```
prisma/
├── schema.prisma
├── seed.ts                    ← 메인 시드 스크립트
└── seed-data/
    ├── categories.ts          ← 카테고리 데이터
    ├── celebStyles.ts         ← 셀럽 스타일 데이터
    ├── similarProducts.ts     ← 유사 상품 데이터
    └── purchaseLinks.ts       ← 구매처 데이터
```

### 최소 시드 데이터 기준

| 모델 | 최소 수량 | 설명 |
|------|----------|------|
| Category (대분류) | 6개 | 아우터, 상의, 하의, 원피스, 신발, 악세서리 |
| Category (소분류) | 대분류당 3~5개 | 예: 아우터 → 블레이저, 패딩, 코트, 가디건, 점퍼 |
| CelebStyle | 카테고리(소분류)당 3~5개 | 성별/시즌이 골고루 분포되도록 |
| SimilarProduct | 스타일당 2~4개 | 브랜드, 가격대가 다양하도록 |
| PurchaseLink | 상품당 2~3개 | 플랫폼이 겹치지 않도록 (무신사, 29CM, 쿠팡 등) |

### 시드 데이터 규칙

1. **ID는 `cuid()`를 사용하되, 시드에서는 고정 ID를 사용한다.** 테스트에서 특정 데이터를 참조할 수 있도록 `"seed-cat-outer"`, `"seed-style-001"` 형태의 예측 가능한 ID를 사용한다.
2. **이미지 URL은 Placeholder를 사용한다.** 실제 셀럽 사진이 없으므로 `https://placehold.co/400x500?text=Style+001` 형태를 사용한다. Phase 3에서 Cloudinary 연동 시 실제 이미지로 교체한다.
3. **가격은 현실적인 범위로 설정한다.** 한국 패션 시장 기준으로 상의 2만~15만원, 아우터 5만~50만원 등 실제 가격대를 반영한다.
4. **시드 실행은 멱등(idempotent)해야 한다.** `upsert`를 사용하여 이미 존재하는 데이터는 업데이트하고, 없는 데이터만 생성한다.

### 실행 방법

```bash
# package.json에 prisma seed 스크립트 등록
npx prisma db seed

# 또는 직접 실행
npx ts-node prisma/seed.ts
```

`package.json`에 추가:

```json
{
  "prisma": {
    "seed": "ts-node --compiler-options {\"module\":\"CommonJS\"} prisma/seed.ts"
  }
}
```

### 적용 시점

- Phase 1: 카테고리 + 셀럽 스타일 시드 작성 (MVP UI 개발용)
- Phase 2: 유사 상품 + 구매처 시드 추가
- Phase 3: Placeholder 이미지를 실제 Cloudinary 이미지로 교체

---

## 6. 성능 기준 (Performance Budget)

### 배경

패션 플랫폼은 한 페이지에 수십 장의 이미지가 렌더링되므로 성능이 사용자 경험에 직결된다. 구체적인 수치 목표가 없으면 최적화 시점을 놓치기 쉽다.

### Lighthouse 점수 목표

| 지표 | 목표 (모바일) | 목표 (데스크톱) | 측정 시점 |
|------|-------------|---------------|----------|
| Performance | ≥ 80 | ≥ 90 | Phase별 마일스톤 |
| Accessibility | ≥ 90 | ≥ 90 | Phase별 마일스톤 |
| Best Practices | ≥ 90 | ≥ 90 | Phase별 마일스톤 |
| SEO | ≥ 90 | ≥ 90 | Phase 2부터 |

### Core Web Vitals 목표

| 지표 | 약자 | 목표 | 설명 |
|------|------|------|------|
| Largest Contentful Paint | LCP | < 2.5초 | 가장 큰 콘텐츠가 화면에 표시되는 시간 |
| First Input Delay | FID | < 100ms | 첫 사용자 입력에 대한 응답 시간 |
| Cumulative Layout Shift | CLS | < 0.1 | 레이아웃 밀림 정도 |

### 이미지 기준

| 항목 | 기준 |
|------|------|
| 스타일 카드 이미지 | 최대 100KB (WebP 기준) |
| 상품 썸네일 이미지 | 최대 80KB (WebP 기준) |
| 카테고리 아이콘 | 최대 10KB (SVG 권장) |
| 이미지 형식 | `next/image`가 자동으로 WebP/AVIF 변환 |

### API 응답 시간 목표

| 엔드포인트 | 목표 (캐시 미스) | 목표 (캐시 히트) |
|-----------|-----------------|-----------------|
| `GET /api/categories` | < 200ms | < 50ms |
| `GET /api/styles` (목록) | < 300ms | < 100ms |
| `GET /api/styles/:id` (상세) | < 200ms | < 50ms |
| `GET /api/products/:id/links` | < 500ms | < 100ms |
| `GET /api/search` | < 500ms | < 150ms |

### 번들 사이즈 기준

| 항목 | 목표 |
|------|------|
| First Load JS (페이지) | < 100KB (gzip) |
| 전체 공유 청크 | < 80KB (gzip) |

### 측정 방법

1. **로컬 측정**: Chrome DevTools → Lighthouse → Mobile 프리셋으로 실행
2. **CI 측정**: Phase 4에서 `lhci` (Lighthouse CI)를 GitHub Actions에 통합
3. **API 측정**: 개발 중 `console.time` / `console.timeEnd` 사용, 프로덕션에서는 Vercel Analytics 활용

### 적용 시점

- Phase 1: 이미지 기준 적용, `next/image` 사용 확인
- Phase 2: API 응답 시간 측정 시작, Lighthouse 최초 측정
- Phase 3: Redis 캐싱 적용 후 캐시 히트/미스 응답 시간 비교
- Phase 4: Lighthouse CI 자동 측정 파이프라인 구축

---

## 7. 로깅 / 모니터링 규칙

### 배경

현재 에러 핸들러(`withErrorHandler`)에서 `console.error`만 사용한다. 프로덕션에서는 구조화된 로그가 없으면 문제 원인 추적이 어렵고, 특히 Phase 3의 크롤러는 외부 의존성이 많아 실패 추적이 필수적이다.

### 로그 레벨

| 레벨 | 용도 | 예시 |
|------|------|------|
| `error` | 즉시 대응이 필요한 오류 | DB 연결 실패, 인증 오류, 예상치 못한 예외 |
| `warn` | 정상은 아니지만 서비스는 계속되는 상황 | 크롤러 폴백 사용, 캐시 미스, 응답 시간 초과 |
| `info` | 주요 비즈니스 이벤트 | API 요청 처리 완료, 크롤러 작업 시작/종료, 시드 실행 |
| `debug` | 개발 중 디버깅용 (프로덕션에서는 비활성) | 쿼리 파라미터 파싱 결과, Prisma 쿼리 내용 |

### 로그 포맷

JSON 형태의 구조화된 로그를 사용한다. Vercel의 로그 뷰어에서 필터링과 검색이 용이하다.

```typescript
// src/lib/logger.ts — 예시 구조
interface LogEntry {
  level: "error" | "warn" | "info" | "debug";
  message: string;
  context?: string;       // 모듈명 (예: "api:styles", "scraper:musinsa")
  timestamp: string;      // ISO 8601
  data?: unknown;         // 추가 데이터 (에러 객체, 요청 파라미터 등)
  duration?: number;      // 소요 시간 (ms)
}
```

### 사용 예시

```typescript
// API Route에서
logger.info("스타일 목록 조회", {
  context: "api:styles",
  data: { gender: "male", page: 1 },
  duration: 142,
});

// 크롤러에서
logger.warn("크롤러 폴백 사용", {
  context: "scraper:musinsa",
  data: { productId: "xxx", reason: "timeout", cachedAt: "2025-03-15" },
});

// 에러 발생 시
logger.error("DB 연결 실패", {
  context: "prisma",
  data: { error: error.message, stack: error.stack },
});
```

### 로깅 규칙

1. **API Route 핸들러**: 모든 요청 처리 완료 시 `info` 로그를 남긴다 (경로, 상태 코드, 소요 시간).
2. **에러 핸들러**: 4xx 에러는 `warn`, 5xx 에러는 `error`로 기록한다.
3. **크롤러**: 작업 시작/종료 시 `info`, 실패 시 `error`, 폴백 사용 시 `warn`으로 기록한다.
4. **민감 정보 제외**: 로그에 API 키, 시크릿, 사용자 개인정보를 절대 포함하지 않는다.
5. **`debug` 레벨은 프로덕션에서 비활성화한다.** 환경 변수 `LOG_LEVEL`로 제어한다.

### 크롤러 알림 정책 (Phase 3)

| 상황 | 알림 방식 | 조건 |
|------|----------|------|
| 단일 상품 크롤링 실패 | 로그 기록만 (`warn`) | — |
| 동일 플랫폼 3회 연속 실패 | 로그 + 알림 (`error`) | 플랫폼 자체 장애 가능성 |
| 전체 크롤링 작업 실패 | 로그 + 긴급 알림 (`error`) | DB/네트워크 장애 가능성 |

알림 채널은 Phase 4에서 결정한다 (Slack Webhook, 이메일, 또는 Vercel Log Drain 활용).

### 적용 시점

- Phase 1: `logger.ts` 파일 생성, 기본 로그 함수 구현
- Phase 2: API Route에 로깅 적용
- Phase 3: 크롤러 로깅 및 알림 정책 적용
- Phase 4: Vercel Analytics / Log Drain 연동

---

## 문서 관리

이 문서를 수정할 때는 아래 커밋 형식을 사용한다:

```
docs(config): PROJECT_RULES 테스트 전략 규칙 수정
```

각 규칙은 독립적이므로, 하나의 규칙만 수정하는 커밋을 권장한다.
