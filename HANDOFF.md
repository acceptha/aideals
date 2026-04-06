# HANDOFF — Phase 1 진행 상태

> **작성일:** 2026-03-18
> **최종 수정:** 2026-03-27
> **현재 단계:** Phase 1 (MVP) 완료, Phase 2 UI 기능 남음
> **목표:** 카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인 전체 플로우 완성

---

## 현재 상태 (완료된 것)

### 인프라 / 설정

| 항목 | 파일 |
|------|------|
| Next.js 14 프로젝트 초기 설정 | `next.config.js`, `tailwind.config.ts`, `tsconfig.json` |
| Prisma 스키마 (4테이블) + 마이그레이션 | `prisma/schema.prisma`, `prisma/migrations/` |
| 환경변수 관리 모듈 | `src/lib/env.ts` |
| 환경변수 검증 스크립트 | `scripts/validate-env.ts` |
| Prisma 싱글턴 | `src/lib/prisma.ts` |
| 구조화 로거 | `src/lib/logger.ts` |
| 커밋 훅 (commit-msg + pre-commit) | `.git/hooks/` |
| vitest 설치 | `package.json` devDependencies |

### API 유틸리티

| 항목 | 파일 |
|------|------|
| AppError / NotFoundError / ValidationError | `src/lib/api/errors.ts` |
| 에러 코드 상수 (ERROR_CODES, ERROR_STATUS_MAP) | `src/lib/api/errorCodes.ts` |
| withErrorHandler 래퍼 | `src/lib/api/withErrorHandler.ts` |
| parseQueryParams 파서 | `src/lib/api/parseQueryParams.ts` |

### 공유 타입

| 항목 | 파일 |
|------|------|
| 도메인 엔티티 (Category, CelebStyle, SimilarProduct, PurchaseLink) | `src/types/index.ts` |
| API 요청/응답 (PaginatedResponse, GetStylesParams 등) | `src/types/api.ts` |
| 스크래퍼 타입 | `src/types/scraper.ts` |

### API Routes (Prisma 직접 호출, 전부 동작 확인 완료)

| 엔드포인트 | 파일 |
|-----------|------|
| `GET /api/categories` | `src/app/api/categories/route.ts` |
| `GET /api/categories/:id/styles` (필터 + 페이지네이션) | `src/app/api/categories/[id]/styles/route.ts` |
| `GET /api/styles` (필터 + 시즌 자동 정렬 + 페이지네이션) | `src/app/api/styles/route.ts` |
| `GET /api/styles/:id` | `src/app/api/styles/[id]/route.ts` |
| `GET /api/styles/:id/products` (유사도/가격/브랜드 정렬) | `src/app/api/styles/[id]/products/route.ts` |

### 시드 데이터 (DB에 삽입 완료)

| 테이블 | 건수 | 파일 |
|--------|------|------|
| categories | 6개 | `prisma/seed-data/categories.ts` |
| celeb_styles | 20개 | `prisma/seed-data/celebStyles.ts` |
| similar_products | 13개 | `prisma/seed-data/similarProducts.ts` |
| purchase_links | 21개 | `prisma/seed-data/purchaseLinks.ts` |
| seed runner | - | `prisma/seed.ts` (upsert 멱등 실행) |

### 컴포넌트

| 컴포넌트 | 타입 | 파일 |
|---------|------|------|
| CategoryGrid | Client | `src/components/CategoryGrid.client.tsx` |
| StyleCard | Server | `src/components/StyleCard.tsx` |
| FilterBar | Client | `src/components/FilterBar.client.tsx` |
| ProductCompareCard | Server | `src/components/ProductCompareCard.tsx` |
| PurchaseLinkList | Server | `src/components/PurchaseLinkList.tsx` |
| Badge | Server | `src/components/ui/Badge.tsx` |
| Skeleton | Server | `src/components/ui/Skeleton.tsx` |

### 페이지 (전부 Server Component, Prisma 직접 호출)

| 페이지 | 파일 |
|--------|------|
| 홈 (카테고리 그리드) | `src/app/page.tsx` |
| 스타일 목록 (필터 + 시즌 자동 정렬) | `src/app/styles/page.tsx` |
| 스타일 상세 (유사 상품 비교) | `src/app/styles/[id]/page.tsx` |
| 상품 상세 (구매처 목록, 최저가 하이라이트) | `src/app/products/[id]/page.tsx` |
| 스타일 로딩 스켈레톤 | `src/app/styles/loading.tsx` |
| 스타일 에러 처리 | `src/app/styles/error.tsx` |

### 상태관리

| 항목 | 파일 |
|------|------|
| useFilterStore (성별/색상/정렬) | `src/stores/useFilterStore.ts` |

### 테스트 (72개 전체 통과)

| 테스트 | 파일 | 건수 |
|--------|------|------|
| AppError / NotFoundError / ValidationError | `src/lib/api/errors.test.ts` | 10 |
| withErrorHandler 래퍼 | `src/lib/api/withErrorHandler.test.ts` | 6 |
| parseQueryParams 파서 | `src/lib/api/parseQueryParams.test.ts` | 14 |
| GET /api/categories | `src/app/api/categories/route.test.ts` | 4 |
| GET /api/categories/:id/styles | `src/app/api/categories/[id]/styles/route.test.ts` | 5 |
| GET /api/styles | `src/app/api/styles/route.test.ts` | 7 |
| GET /api/styles/:id | `src/app/api/styles/[id]/route.test.ts` | 4 |
| GET /api/styles/:id/products | `src/app/api/styles/[id]/products/route.test.ts` | 6 |
| GET /api/products/:id | `src/app/api/products/[id]/route.test.ts` | 4 |
| GET /api/products/:id/links | `src/app/api/products/[id]/links/route.test.ts` | 5 |
| GET /api/search | `src/app/api/search/route.test.ts` | 7 |

### 기타

| 항목 | 파일 |
|------|------|
| 무신사 스크래퍼 파서 | `src/lib/scraper/musinsa.ts` |
| next/image 외부 도메인 등록 (placehold.co) | `next.config.mjs` |

### 현재 src 구조

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← 홈 (Prisma → CategoryGrid)
│   ├── globals.css                 ← Tailwind directives만
│   ├── error.tsx                   ← 글로벌 에러 폴백
│   ├── not-found.tsx               ← 글로벌 404
│   ├── fonts/
│   ├── styles/
│   │   ├── page.tsx                ← 스타일 목록 (Prisma, 시즌 자동 정렬)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── [id]/
│   │       ├── page.tsx            ← 스타일 상세 → 유사 상품
│   │       └── not-found.tsx
│   ├── products/
│   │   └── [id]/
│   │       ├── page.tsx            ← 상품 상세 → 구매처
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       └── not-found.tsx
│   └── api/
│       ├── categories/
│       │   ├── route.ts
│       │   └── [id]/styles/route.ts
│       ├── styles/
│       │   ├── route.ts
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── products/route.ts
│       ├── products/
│       │   └── [id]/
│       │       ├── route.ts
│       │       └── links/route.ts
│       └── search/
│           └── route.ts
├── components/
│   ├── ui/
│   │   ├── Badge.tsx
│   │   └── Skeleton.tsx
│   ├── CategoryGrid.client.tsx
│   ├── StyleCard.tsx
│   ├── FilterBar.client.tsx
│   ├── ProductCompareCard.tsx
│   └── PurchaseLinkList.tsx
├── lib/
│   ├── api/
│   │   ├── errorCodes.ts
│   │   ├── errors.ts
│   │   ├── withErrorHandler.ts
│   │   └── parseQueryParams.ts
│   ├── prisma.ts
│   ├── logger.ts
│   ├── env.ts
│   ├── envRules.ts
│   └── scraper/
│       ├── musinsa.ts
│       └── __fixtures__/
├── stores/
│   └── useFilterStore.ts
└── types/
    ├── index.ts
    ├── api.ts
    └── scraper.ts
```

---

## 완료된 작업 (이전 잔여 → 해결)

| 항목 | 상태 | 관련 커밋 |
|------|------|-----------|
| CategoryGrid 아이콘 매핑 (`seed-cat-*`) | ✅ 완료 | `fb30141` |
| lib/api 유틸 단위 테스트 (30개) | ✅ 완료 | `715881e` |
| mockData.ts 삭제 | ✅ 완료 | — |
| Phase 2 API 구현 (products/:id, links, search) | ✅ 완료 | `54e2cab` |
| API Route 핸들러 단위 테스트 (42개, 8개 라우트) | ✅ 완료 | — |
| 글로벌 error.tsx + products/[id]/loading.tsx 추가 | ✅ 완료 | — |
| 페이지네이션 UI (styles 목록, 12개 단위) | ✅ 완료 | — |
| 가격대 필터 (~3만, 3~5만, 5~10만, 10~20만, 20만~) | ✅ 완료 | — |
| 상품 정렬 UI (유사도순/가격순/브랜드순) | ✅ 완료 | — |

---

## 남은 작업

없음 (Phase 2 범위 완료)

---

## 핵심 패턴 / 주의사항

### API Route 템플릿

```typescript
// src/app/api/xxx/route.ts
export const GET = withErrorHandler(async (req: NextRequest) => {
  const start = Date.now();
  const params = parseQueryParams<GetStylesParams>(req, { /* rules */ });
  const data = await prisma.xxx.findMany({ ... });
  logger.info("xxx 조회", { context: "api:xxx", duration: Date.now() - start });
  return NextResponse.json(data);
});
```

### 동적 라우트 템플릿

```typescript
// src/app/api/xxx/[id]/route.ts
export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;
  const item = await prisma.xxx.findUnique({ where: { id } });
  if (!item) throw new NotFoundError("xxx", "XXX_NOT_FOUND");
  return NextResponse.json(item);
});
```

### 절대 하면 안 되는 것

- `process.env.XXX` 직접 접근 금지 → `import { env } from "@/lib/env"` 사용
- Client Component에서 Prisma import 금지 → 빌드 실패
- `any` 타입 사용 금지
- `"use client"` 남용 금지 (실제 상호작용 필요한 컴포넌트만)
- 이미지 `<img>` 태그 직접 사용 금지 → `next/image` 사용

---

## 참고 문서

- `CLAUDE.md` — 코딩 컨벤션, 컴포넌트 패턴, API Route 패턴
- `PROJECT_RULES.md` — 테스트 전략(§1), 환경변수(§2), 커밋 규칙(§3), 에러 코드(§4)
- `aideals_design.md` — 프로젝트 전체 설계 문서
- `prisma/schema.prisma` — DB 스키마 (타입 정의의 원본)
