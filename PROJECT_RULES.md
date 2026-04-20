# PROJECT_RULES.md — aideals 추가 규칙

> 이 문서는 `claude.md`(코딩 컨벤션/디자인 패턴)를 **보완**하는 프로젝트 운영 규칙이다. Git 커밋 규칙도 이 문서의 섹션 3에 통합되어 있다.
> 각 규칙은 독립적으로 읽고 수정할 수 있도록 작성되었다.
>
> **프로젝트 요약:** aideals는 패션 비교 플랫폼(Next.js 15 App Router + TypeScript + TailwindCSS + Prisma + PostgreSQL)이다.
> 핵심 플로우: 카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인

---

## 목차

1. [테스트 전략](#1-테스트-전략)
2. [환경 변수 관리](#2-환경-변수-관리)
3. [브랜치 전략 및 Git 커밋 규칙](#3-브랜치-전략-및-git-커밋-규칙)
4. [API 응답 포맷](#4-api-응답-포맷)
5. [에러 코드 체계](#5-에러-코드-체계)
6. [데이터 시드 규칙](#6-데이터-시드-규칙)
7. [성능 기준 (Performance Budget)](#7-성능-기준-performance-budget)
8. [로깅 / 모니터링 규칙](#8-로깅--모니터링-규칙)

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

### 정적 분석

Claude Code의 PostToolUse hook(`.claude/hooks/lint-check.mjs`)이 파일 편집마다 ESLint + TypeScript 타입 체크를 자동 실행한다. 별도 설정 없이 정적 분석 계층이 확보된다.

### CI 연동

GitHub Actions에서 PR마다 `vitest run`을 실행한다. 테스트 실패 시 머지를 차단한다.

### 적용 시점

- Phase 1: `vitest` 설치 및 설정 파일(`vitest.config.ts`) 생성
- Phase 2: API Route 핸들러 테스트 필수 작성 시작
- Phase 3: 크롤러 모듈 테스트 필수 작성

---

## 2. 환경 변수 관리

### 배경

프로젝트는 Supabase(DB), Upstash(Redis), Cloudinary(이미지), NextAuth(인증), OAuth(카카오/구글) 등 여러 외부 서비스에 의존한다. 환경별로 필요한 변수가 다르고, 빠뜨리면 런타임 에러가 발생한다. 환경 변수를 체계적으로 관리하지 않으면 보안 사고(시크릿 유출)나 배포 장애(변수 누락)로 이어진다.

### 환경 변수 목록

| 변수명 | 필수 | Phase | 환경 | 설명 | 예시값 |
|--------|------|-------|------|------|--------|
| `DATABASE_URL` | ✅ | 1 | 서버 | Supabase PostgreSQL 연결 문자열 | `postgresql://user:pw@host:5432/db` |
| `DIRECT_URL` | ✅ | 1 | 서버 | Supabase 직접 연결 URL (Prisma 마이그레이션용) | `postgresql://postgres:pw@db.xxx.supabase.co:5432/postgres` |
| `UPSTASH_REDIS_REST_URL` | ❌ | 3 | 서버 | Upstash Redis REST URL | `https://xxx.upstash.io` |
| `UPSTASH_REDIS_REST_TOKEN` | ❌ | 3 | 서버 | Upstash Redis 인증 토큰 | `AXxx...` |
| `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` | ❌ | 3 | 전체 | Cloudinary 클라우드 이름 (클라이언트 노출 가능) | `my-cloud` |
| `CLOUDINARY_API_KEY` | ❌ | 3 | 서버 | Cloudinary API 키 | `123456789` |
| `CLOUDINARY_API_SECRET` | ❌ | 3 | 서버 | Cloudinary API 시크릿 | `abcDEF...` |
| `CRON_SECRET` | ❌ | 3 | 서버 | Vercel Cron Job 인증 시크릿 (16자 이상) | `openssl rand -base64 32` |
| `NEXTAUTH_URL` | ❌ | 4 | 서버 | 인증 콜백 기준 URL | `http://localhost:3000` |
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

#### 규칙 2: 변수 규칙은 `src/lib/envRules.ts` 한 곳에서 관리한다 (Single Source of Truth)

모든 환경 변수의 키, 필수 여부, Phase, 형식 검증 함수는 `src/lib/envRules.ts`의 `ENV_RULES` 배열에 정의한다. `env.ts`(런타임 접근)와 `scripts/validate-env.ts`(검증 스크립트) 양쪽에서 이 파일을 import하므로, 변수를 추가하거나 필수 여부를 변경할 때 `envRules.ts`만 수정하면 양쪽에 자동 반영된다.

```
envRules.ts  ←── single source of truth (변수 규칙 정의)
    ├── env.ts          (import해서 런타임 접근 객체 자동 생성)
    └── validate-env.ts (import해서 검증 실행)
```

`EnvVarRule` 인터페이스:

```typescript
interface EnvVarRule {
  key: string;           // 환경 변수 이름
  required: boolean;     // 필수 여부 (Phase에 따라 변경)
  phase: number;         // 해당 Phase
  serverOnly: boolean;   // 서버 전용 여부
  validate?: (value: string) => string | null;  // 형식 검증 함수
  description: string;   // 설명
}
```

Phase가 진행되면 해당 변수의 `required`를 `false` → `true`로 변경하고, `env.ts`에서 주석을 해제하면 된다.

#### 규칙 3: 커밋 전 / 런타임 전 환경 변수 검증

환경 변수는 **두 시점**에 자동 검증되며, 각 시점의 역할이 다르다.

##### Pre-commit hook (보안 검증 — 순수 shell)

`.git/hooks/pre-commit`은 Node 프로세스를 띄우지 않고 shell만으로 빠르게 실행된다. 보안 사고 방지에 집중한다:

1. **`.env` 파일 커밋 방지**: `.env.example`을 제외한 모든 `.env*` 파일이 스테이징에 포함되면 커밋을 거부한다.
2. **`.env.example` ↔ `.env.local` 키 동기화**: `.env.example`에 주석 해제 상태로 정의된 필수 키가 `.env.local`에도 존재하는지 확인한다.
3. **`NEXT_PUBLIC_` 시크릿 유출 감지**: 스테이징된 `.ts`, `.tsx`, `.js`, `.jsx`, `.env` 파일에서 `NEXT_PUBLIC_` + 시크릿 키워드(`SECRET`, `TOKEN`, `PASSWORD`, `PRIVATE_KEY`) 조합을 감지한다.

하나라도 실패하면 커밋이 거부된다. Node를 띄우지 않으므로 docs 수정 같은 가벼운 커밋에도 부담이 없다.

##### predev / prebuild (full 검증 — validate-env.ts)

`npm run dev` / `npm run build` 전에 `scripts/validate-env.ts`가 자동 실행된다. "지금 이 환경이 정상인지" 확인하는 역할이다:

**Step 1 — 필수 키 존재 여부**: `ENV_RULES`에서 `required: true`인 변수가 `.env.local`(또는 `.env`)에 존재하는지 검사한다. 누락 시 `process.exit(1)`.

**Step 2 — 값 형식 검증**: 각 변수의 `validate` 함수를 실행한다. 추가로 `NEXT_PUBLIC_` 접두사가 붙은 시크릿성 변수를 감지하여 유출 경고를 출력한다.

**Step 3 — DB 연결 테스트**: `@prisma/client`를 dynamic import하여 `SELECT 1` 쿼리를 실행한다. 5초 타임아웃이 적용되며, `--skip-db` 옵션으로 건너뛸 수 있다.

DB 연결 테스트를 런타임 직전에 하는 이유: 커밋 시점에 DB가 연결되더라도, 이후 Supabase가 일시정지되거나 네트워크 환경이 달라질 수 있다. 실행 직전에 확인해야 "지금 된다"는 보장이 된다.

##### npm 스크립트

```json
{
  "predev": "npx tsx scripts/validate-env.ts",
  "prebuild": "npx tsx scripts/validate-env.ts",
  "validate-env": "npx tsx scripts/validate-env.ts",
  "validate-env:skip-db": "npx tsx scripts/validate-env.ts --skip-db"
}
```

#### 규칙 4: 환경 변수 접근은 `src/lib/env.ts` 한 곳에서만

코드 전체에서 `process.env.XXX`를 직접 사용하지 않는다. 반드시 `env.ts`에서 export한 값을 import하여 사용한다.

```typescript
// ✅ 올바른 사용
import { env } from "@/lib/env";
const db = new PrismaClient({ datasourceUrl: env.DATABASE_URL });

// ❌ 금지 — 오타 감지 불가, 검증 우회, 접근 포인트 분산
const db = new PrismaClient({ datasourceUrl: process.env.DATABASE_URL });
```

이점: 오타를 TypeScript 컴파일 타임에 잡을 수 있고, 어떤 변수가 어디서 쓰이는지 `env.ts`만 보면 파악할 수 있다.

#### 규칙 5: 변수 추가 시 체크리스트

새로운 환경 변수를 추가할 때 아래 5곳을 한 세트로 업데이트한다:

1. `src/lib/envRules.ts` — `ENV_RULES` 배열에 규칙 추가 (→ `validate-env.ts`에 자동 반영)
2. `src/lib/env.ts` — `env` 객체에 getter 추가
3. `.env.example` — 키 추가 (값은 비워두거나 예시 형식만 기재)
4. `.env.local` — 실제 값 추가 (로컬 개발용)
5. `PROJECT_RULES.md` §2 환경 변수 목록 테이블 — 행 추가

Phase가 진행되어 선택→필수로 바뀔 때는 `envRules.ts`에서 `required: false` → `true`로 변경하고, `env.ts`에서 해당 변수의 주석을 해제하면 된다.

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

- Phase 1: `src/lib/envRules.ts` + `env.ts` 생성, `DATABASE_URL` 검증, `.env.example` 작성
- Phase 3: Cloudinary, Upstash 변수 추가 및 필수 전환
- Phase 4: NextAuth, OAuth 변수 추가 및 필수 전환

---

## 3. 브랜치 전략 및 Git 커밋 규칙

### 배경

1인 개발 프로젝트로, 복잡한 브랜치 전략 없이 `main` 브랜치에서 직접 작업하고 push한다. 대신 커밋 메시지 컨벤션을 엄격하게 유지하여 변경 이력의 가독성과 추적성을 확보한다. 커밋 메시지는 `.git/hooks/commit-msg` 훅이 자동 검증한다.

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

### 3.6 자동 검증 (commit-msg hook)

`.git/hooks/commit-msg` 훅이 커밋 시 아래 항목을 자동 검증하며, 위반 시 커밋이 거부된다.

| 검증 항목 | 규칙 | 위반 시 |
|----------|------|--------|
| 형식 | `<type>(<scope>): <subject>` 패턴 필수 | 커밋 거부 + 허용 type/scope 안내 |
| Subject 길이 | 50자 이내 | 커밋 거부 + 현재 길이 표시 |
| 마침표 금지 | Subject 끝에 `.` 불가 | 커밋 거부 |
| Body 구분 | Subject-Body 사이 빈 줄 필수 | 커밋 거부 |
| 예외 | Merge, Revert 커밋은 검증 건너뜀 | — |

### 3.7 커밋 메시지 예시 모음

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

## 4. API 응답 포맷

모든 API 엔드포인트는 아래 규칙에 따라 응답 구조를 통일한다. 프론트엔드는 응답 유형(단건/목록/에러)에 따라 일관된 파싱 로직을 사용할 수 있어야 한다.

### 성공 응답

#### 단건 조회

데이터 객체를 직접 반환한다. 래핑하지 않는다.

```json
{
  "id": "style-1",
  "celebName": "아이유",
  "imageUrl": "https://..."
}
```

#### 목록 조회

`data` 배열로 래핑한다. 페이지네이션이 필요한 경우 `pagination` 필드를 포함한다.

```json
{
  "data": [{ "id": "style-1", "celebName": "아이유" }, ...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 58,
    "totalPages": 3
  }
}
```

- 페이지네이션이 불필요한 목록(예: 카테고리 6개)은 `pagination` 없이 `{ "data": [...] }` 만 반환한다.
- 배열을 직접 반환(`[...]`)하지 않는다. 반드시 `data`로 감싼다.

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `data` | `T[]` | ✅ | 목록 데이터 배열 |
| `pagination` | `object` | ❌ | 페이지네이션 정보 (페이지네이션 적용 시) |
| `pagination.page` | `number` | ✅* | 현재 페이지 (1부터 시작) |
| `pagination.limit` | `number` | ✅* | 페이지당 항목 수 |
| `pagination.total` | `number` | ✅* | 전체 항목 수 |
| `pagination.totalPages` | `number` | ✅* | 전체 페이지 수 |

\* `pagination` 객체가 있을 때 필수

### 경고 (Warning)

HTTP 200이지만 데이터 품질에 주의가 필요한 경우 `warning` 필드를 포함한다. 에러 응답(`{ status, code, message }`)과 혼동하지 않도록 `status` 필드를 포함하지 않는다.

```json
{
  "data": [...],
  "warning": {
    "code": "PRICE_DATA_STALE",
    "message": "가격 데이터가 오래되어 실제와 다를 수 있습니다",
    "details": { "cachedAt": "2025-03-15T09:00:00Z" }
  }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `warning` | `object` | ❌ | 경고 정보 (데이터는 정상 반환되지만 주의 필요 시) |
| `warning.code` | `ErrorCode` | ✅* | 경고 코드 (`ERROR_CODES`에 정의된 값) |
| `warning.message` | `string` | ✅* | 사람이 읽을 수 있는 경고 설명 |
| `warning.details` | `Record<string, unknown>` | ❌ | 경고의 추가 컨텍스트 |

\* `warning` 객체가 있을 때 필수

### 에러 응답

에러 응답 포맷은 [5. 에러 코드 체계](#5-에러-코드-체계)를 참고한다.

### 응답 유형 판별

| 조건 | 응답 구조 |
|------|-----------|
| HTTP 2xx + `data` 키 없음 | 단건 성공 |
| HTTP 2xx + `data` 키 있음 | 목록 성공 (+ `pagination?`, `warning?`) |
| HTTP 4xx/5xx + `code` 키 있음 | 에러 |

---

## 5. 에러 코드 체계

### 배경

현재 프로젝트의 에러 처리는 `AppError`, `NotFoundError`, `ValidationError` 클래스를 사용하고, HTTP 상태 코드와 메시지를 반환한다(`claude.md` 참고). 그러나 프론트엔드에서 에러 유형별로 다른 UI를 보여주려면 HTTP 상태 코드만으로는 구분이 부족하다.

### 핵심 원칙

#### 원칙 1: 에러 코드는 도메인별로 정의한다

에러 코드는 프로젝트의 도메인(카테고리, 스타일, 상품 등)과 기술 영역(검증, 크롤러 등)에 맞게 그룹화하여 정의한다. 단, 파일은 `src/lib/api/errorCodes.ts` **한 곳**에서 관리하고 내부에서 주석 섹션으로 도메인을 구분한다. 에러 코드가 50개를 넘기 전까지 파일을 분리하지 않는다.

#### 원칙 2: 에러 응답 구조는 도메인과 관계없이 항상 동일하다

어떤 API에서 어떤 에러가 발생하든, 프론트엔드가 받는 에러 응답의 구조는 항상 같다. 프론트엔드는 하나의 타입(`ApiErrorResponse`)만으로 모든 에러를 처리할 수 있어야 한다.

### 에러 응답 포맷

```json
{
  "status": 400,
  "code": "INVALID_FILTER_VALUE",
  "message": "gender 값은 male, female, unisex 중 하나여야 합니다",
  "details": { "field": "gender", "allowed": ["male", "female", "unisex"], "received": "unknown" }
}
```

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `status` | `number` | ✅ | HTTP 상태 코드 |
| `code` | `ErrorCode` | ✅ | 머신 리더블 에러 코드 (프론트엔드 분기용) |
| `message` | `string` | ✅ | 사람이 읽을 수 있는 에러 설명 (한글) |
| `details` | `Record<string, unknown>` | ❌ | 에러의 추가 컨텍스트 (선택적) |

`details`는 기본 3개 필드만으로 정보가 부족한 경우에만 사용한다:

- **Validation 에러**: 어떤 필드가 잘못됐는지, 허용 값은 뭔인지 전달
- **크롤러 경고**: 캐시된 데이터의 시점(`cachedAt`) 전달
- **일반 에러**: `details` 없이 `status` + `code` + `message`만 반환

`details`가 있든 없든 응답 구조(타입) 자체는 항상 동일하다.

### 에러 코드 목록

에러 코드는 `as const` 객체로 정의하여 프론트엔드와 백엔드에서 타입 안전하게 공유한다.

```typescript
// src/lib/api/errorCodes.ts
export const ERROR_CODES = {
  // ── Common ──
  INTERNAL_SERVER_ERROR: "INTERNAL_SERVER_ERROR",
  METHOD_NOT_ALLOWED: "METHOD_NOT_ALLOWED",

  // ── Validation ──
  MISSING_REQUIRED_FIELD: "MISSING_REQUIRED_FIELD",
  INVALID_FILTER_VALUE: "INVALID_FILTER_VALUE",
  INVALID_SORT_VALUE: "INVALID_SORT_VALUE",
  INVALID_PAGINATION: "INVALID_PAGINATION",
  INVALID_ID_FORMAT: "INVALID_ID_FORMAT",

  // ── Category ──
  CATEGORY_NOT_FOUND: "CATEGORY_NOT_FOUND",

  // ── Style ──
  STYLE_NOT_FOUND: "STYLE_NOT_FOUND",

  // ── Product ──
  PRODUCT_NOT_FOUND: "PRODUCT_NOT_FOUND",

  // ── Scraper ──
  SCRAPER_TARGET_UNREACHABLE: "SCRAPER_TARGET_UNREACHABLE",
  SCRAPER_PARSE_FAILED: "SCRAPER_PARSE_FAILED",
  PRICE_DATA_STALE: "PRICE_DATA_STALE",

  // ── Upload ──
  UPLOAD_NO_FILE: "UPLOAD_NO_FILE",
  UPLOAD_INVALID_TYPE: "UPLOAD_INVALID_TYPE",
  UPLOAD_FILE_TOO_LARGE: "UPLOAD_FILE_TOO_LARGE",
  UPLOAD_INVALID_FOLDER: "UPLOAD_INVALID_FOLDER",
  UPLOAD_FAILED: "UPLOAD_FAILED",
  CLOUDINARY_NOT_CONFIGURED: "CLOUDINARY_NOT_CONFIGURED",

  // ── Auth ──
  AUTH_REQUIRED: "AUTH_REQUIRED",
  // AUTH_TOKEN_EXPIRED: "AUTH_TOKEN_EXPIRED",   // Phase 4
  // AUTH_FORBIDDEN: "AUTH_FORBIDDEN",           // Phase 4
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
```

#### 에러 코드 상세

##### 공통 (Common)

| 코드 | 상태 | 설명 |
|------|------|------|
| `INTERNAL_SERVER_ERROR` | 500 | 예상치 못한 서버 오류 |
| `METHOD_NOT_ALLOWED` | 405 | 지원하지 않는 HTTP 메서드 |

##### 검증 (Validation)

| 코드 | 상태 | 설명 | `details` 예시 |
|------|------|------|---------------|
| `MISSING_REQUIRED_FIELD` | 400 | 필수 필드 누락 | `{ "field": "categoryId" }` |
| `INVALID_FILTER_VALUE` | 400 | 필터 값이 허용 범위 밖 | `{ "field": "gender", "allowed": ["male", "female", "unisex"] }` |
| `INVALID_SORT_VALUE` | 400 | 정렬 기준이 허용 값 밖 | `{ "field": "sort", "allowed": ["price", "brand", "similarity"] }` |
| `INVALID_PAGINATION` | 400 | page/limit 값이 유효하지 않음 | `{ "field": "page", "min": 1 }` |
| `INVALID_ID_FORMAT` | 400 | ID 포맷이 올바르지 않음 | `{ "field": "id", "received": "abc!@#" }` |

##### 리소스 (Resource)

| 코드 | 상태 | 설명 |
|------|------|------|
| `CATEGORY_NOT_FOUND` | 404 | 카테고리를 찾을 수 없음 |
| `STYLE_NOT_FOUND` | 404 | 셀럽 스타일을 찾을 수 없음 |
| `PRODUCT_NOT_FOUND` | 404 | 상품을 찾을 수 없음 |

##### 크롤러 (Scraper)

| 코드 | 상태 | 설명 | `details` 예시 |
|------|------|------|---------------|
| `SCRAPER_TARGET_UNREACHABLE` | 502 | 크롤링 대상 사이트 접근 불가 | `{ "target": "musinsa.com", "timeout": 5000 }` |
| `SCRAPER_PARSE_FAILED` | 502 | HTML 파싱 실패 | `{ "target": "musinsa.com", "selector": ".product-price" }` |
| `PRICE_DATA_STALE` | 200 | 캐시된 가격 데이터를 폴백으로 사용 중 (경고) | `{ "cachedAt": "2025-03-15T09:00:00Z" }` |

##### 업로드 (Upload)

| 코드 | 상태 | 설명 | `details` 예시 |
|------|------|------|---------------|
| `UPLOAD_NO_FILE` | 400 | 파일이 첨부되지 않음 | — |
| `UPLOAD_INVALID_TYPE` | 400 | 허용되지 않는 파일 형식 | `{ "allowed": ["image/jpeg", "image/png", "image/webp", "image/avif"] }` |
| `UPLOAD_FILE_TOO_LARGE` | 413 | 파일 크기 초과 (10MB) | `{ "maxBytes": 10485760, "actualBytes": 15000000 }` |
| `UPLOAD_INVALID_FOLDER` | 400 | 허용되지 않는 업로드 폴더 | `{ "allowed": ["styles", "products", "platforms", "categories"] }` |
| `UPLOAD_FAILED` | 502 | Cloudinary 업로드 실패 | — |
| `CLOUDINARY_NOT_CONFIGURED` | 503 | Cloudinary 환경변수 미설정 | — |

##### 인증 (Auth) — Phase 4에서 활성화

| 코드 | 상태 | 설명 |
|------|------|------|
| `AUTH_REQUIRED` | 401 | 로그인이 필요한 요청 |
| `AUTH_TOKEN_EXPIRED` | 401 | 세션/토큰 만료 |
| `AUTH_FORBIDDEN` | 403 | 권한 없음 |

### 에러 코드 → HTTP 상태 코드 매핑

에러 코드와 HTTP 상태 코드의 짝을 한 곳에서 관리한다. 개발자가 에러를 throw할 때 상태 코드를 직접 입력하면 실수(예: `STYLE_NOT_FOUND`인데 400을 넘기는 등)가 발생할 수 있다. 매핑 테이블을 두면 에러 코드만 지정해도 상태 코드가 자동으로 결정된다.

```typescript
// src/lib/api/errorCodes.ts 에 함께 정의
export const ERROR_STATUS_MAP: Record<ErrorCode, number> = {
  INTERNAL_SERVER_ERROR: 500,
  METHOD_NOT_ALLOWED: 405,
  MISSING_REQUIRED_FIELD: 400,
  INVALID_FILTER_VALUE: 400,
  INVALID_SORT_VALUE: 400,
  INVALID_PAGINATION: 400,
  INVALID_ID_FORMAT: 400,
  CATEGORY_NOT_FOUND: 404,
  STYLE_NOT_FOUND: 404,
  PRODUCT_NOT_FOUND: 404,
  SCRAPER_TARGET_UNREACHABLE: 502,
  SCRAPER_PARSE_FAILED: 502,
  PRICE_DATA_STALE: 200,
  UPLOAD_NO_FILE: 400,
  UPLOAD_INVALID_TYPE: 400,
  UPLOAD_FILE_TOO_LARGE: 413,
  UPLOAD_INVALID_FOLDER: 400,
  UPLOAD_FAILED: 502,
  CLOUDINARY_NOT_CONFIGURED: 503,
  AUTH_REQUIRED: 401,
};
```

에러 클래스에서 매핑을 활용한다:

```typescript
// 사용 시: 에러 코드만 넘기면 상태 코드는 자동
throw AppError.fromCode("STYLE_NOT_FOUND", "해당 스타일을 찾을 수 없습니다");
// → statusCode: 404 (매핑 테이블에서 자동 결정)
```

### 구현 방법

#### 에러 클래스

기존 `AppError` 클래스에 `code` 필드와 `details` 필드를 추가하고, `fromCode` 정적 메서드로 매핑 테이블을 활용한다.

```typescript
// src/lib/api/errors.ts
import { ERROR_STATUS_MAP, type ErrorCode } from "./errorCodes";

export class AppError extends Error {
  constructor(
    message: string,
    public statusCode: number = 500,
    public code: ErrorCode = "INTERNAL_SERVER_ERROR",
    public details?: Record<string, unknown>,
  ) {
    super(message);
  }

  /** 에러 코드만 지정하면 상태 코드가 자동 결정된다 */
  static fromCode(
    code: ErrorCode,
    message: string,
    details?: Record<string, unknown>,
  ): AppError {
    return new AppError(message, ERROR_STATUS_MAP[code], code, details);
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string, code: ErrorCode) {
    super(`${resource}을(를) 찾을 수 없습니다`, ERROR_STATUS_MAP[code], code);
  }
}

export class ValidationError extends AppError {
  constructor(
    message: string,
    code: ErrorCode = "MISSING_REQUIRED_FIELD",
    details?: Record<string, unknown>,
  ) {
    super(message, ERROR_STATUS_MAP[code], code, details);
  }
}
```

#### 에러 핸들러 래퍼

`withErrorHandler`의 에러 응답에 `code`와 `details`를 포함한다.

```typescript
// src/lib/api/withErrorHandler.ts 응답 변경
return NextResponse.json(
  {
    status: error.statusCode,
    code: error.code,
    message: error.message,
    ...(error.details && { details: error.details }),
  },
  { status: error.statusCode },
);
```

#### 에러 응답 타입 (프론트엔드 공유)

```typescript
// src/types/api.ts
import type { ErrorCode } from "@/lib/api/errorCodes";

export interface ApiErrorResponse {
  status: number;
  code: ErrorCode;
  message: string;
  details?: Record<string, unknown>;
}
```

### 파일 구조

```
src/lib/api/
├── errorCodes.ts       ← ERROR_CODES 상수, ErrorCode 타입, ERROR_STATUS_MAP
├── errors.ts           ← AppError, NotFoundError, ValidationError 클래스
└── withErrorHandler.ts ← 에러 핸들러 래퍼 (code, details 포함 응답)

src/types/
└── api.ts              ← ApiErrorResponse 인터페이스
```

### 적용 시점

- Phase 1: `errorCodes.ts` 생성 (ERROR_CODES, ERROR_STATUS_MAP), `errors.ts`에 `code`/`details` 필드 추가, `ApiErrorResponse` 타입 정의
- Phase 2: API Route 개발 시 모든 에러에 코드 부여, `withErrorHandler`에 `code`/`details` 응답 적용
- Phase 3: 크롤러 관련 에러 코드 활성화, `details`에 크롤러 컨텍스트 포함
- Phase 4: Auth 에러 코드 주석 해제 및 활성화

---

## 6. 데이터 시드 규칙

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
| Category (대분류) | 6개 | 아우터, 상의, 하의, 원피스/스커트, 신발, 가방 |
| CelebStyle | 카테고리당 3~5개 | 성별/시즌이 골고루 분포되도록 |
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
    "seed": "npx tsx prisma/seed.ts"
  }
}
```

### 적용 시점

- Phase 1: 카테고리 + 셀럽 스타일 시드 작성 (MVP UI 개발용)
- Phase 2: 유사 상품 + 구매처 시드 추가
- Phase 3: Placeholder 이미지를 실제 Cloudinary 이미지로 교체

---

## 7. 성능 기준 (Performance Budget)

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

## 8. 로깅 / 모니터링 규칙

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
