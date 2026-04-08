# HANDOFF — 프로젝트 진행 상태

> **작성일:** 2026-03-18
> **최종 수정:** 2026-04-08
> **현재 단계:** Phase 1~2 완료, Phase 3 (데이터 확장) 데이터 계층 추출 + Redis 캐싱 완료, 크롤러/Cloudinary 잔여
> **목표:** 카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인 전체 플로우 완성

---

## 현재 상태 (완료된 것)

### 인프라 / 설정

| 항목 | 파일 |
|------|------|
| Next.js 15 프로젝트 초기 설정 | `next.config.mjs`, `tailwind.config.ts`, `tsconfig.json` |
| Prisma 스키마 (4테이블) + 마이그레이션 | `prisma/schema.prisma`, `prisma/migrations/` |
| 환경변수 관리 모듈 | `src/lib/env.ts` |
| 환경변수 검증 스크립트 | `scripts/validate-env.ts` |
| Prisma 싱글턴 | `src/lib/prisma.ts` |
| 구조화 로거 | `src/lib/logger.ts` |
| 커밋 훅 (commit-msg + pre-commit) | `.git/hooks/` |
| vitest 설치 | `package.json` devDependencies |
| Upstash Redis 싱글턴 (없으면 캐시 스킵) | `src/lib/redis.ts` |
| 캐시 유틸 (withCache, buildCacheKey, invalidateCache, CACHE_TTL) | `src/lib/cache.ts` |

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

### 데이터 접근 계층 (캐싱 포함, API·페이지 공용)

| 모듈 | 함수 | 캐시 TTL | 파일 |
|------|------|----------|------|
| categories | `getCategories()`, `getCategoryById(id)` | CATEGORY (24h) | `src/lib/data/categories.ts` |
| styles | `getStylesWithCount(filter)`, `getStyleById(id)`, `getStyleProducts(styleId, filter)` | LIST (5m) / STYLE_DETAIL (10m) | `src/lib/data/styles.ts` |
| products | `getProductById(id)`, `getProductLinks(productId, sort)` | PRODUCT_DETAIL (10m) / PRICE (3m) | `src/lib/data/products.ts` |
| search | `searchAll(query, type)` | LIST (5m) | `src/lib/data/search.ts` |

### API Routes (data 계층 호출, 전부 동작 확인 완료)

| 엔드포인트 | 파일 |
|-----------|------|
| `GET /api/categories` | `src/app/api/categories/route.ts` |
| `GET /api/categories/:id/styles` (필터 + 페이지네이션) | `src/app/api/categories/[id]/styles/route.ts` |
| `GET /api/styles` (필터 + 시즌 자동 정렬 + 페이지네이션) | `src/app/api/styles/route.ts` |
| `GET /api/styles/:id` | `src/app/api/styles/[id]/route.ts` |
| `GET /api/styles/:id/products` (유사도/가격/브랜드/가격대 필터) | `src/app/api/styles/[id]/products/route.ts` |
| `GET /api/products/:id` | `src/app/api/products/[id]/route.ts` |
| `GET /api/products/:id/links` (가격순 정렬) | `src/app/api/products/[id]/links/route.ts` |
| `GET /api/search` (통합 검색: celeb/brand/product) | `src/app/api/search/route.ts` |

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
| Pagination | Client | `src/components/Pagination.client.tsx` |
| PriceFilter | Client | `src/components/PriceFilter.client.tsx` |
| ProductSortBar | Client | `src/components/ProductSortBar.client.tsx` |
| ProductCompareCard | Server | `src/components/ProductCompareCard.tsx` |
| PurchaseLinkList | Server | `src/components/PurchaseLinkList.tsx` |
| Badge | Server | `src/components/ui/Badge.tsx` |
| Skeleton | Server | `src/components/ui/Skeleton.tsx` |

### 페이지 (전부 Server Component, data 계층 호출)

| 페이지 | 파일 |
|--------|------|
| 홈 (카테고리 그리드) | `src/app/page.tsx` |
| 스타일 목록 (필터 + 시즌 자동 정렬 + 페이지네이션) | `src/app/styles/page.tsx` |
| 스타일 상세 (유사 상품 비교 + 가격대 필터 + 정렬) | `src/app/styles/[id]/page.tsx` |
| 상품 상세 (구매처 목록, 최저가 하이라이트) | `src/app/products/[id]/page.tsx` |
| 스타일 로딩 스켈레톤 | `src/app/styles/loading.tsx` |
| 스타일 에러 처리 | `src/app/styles/error.tsx` |

### 상태관리

| 항목 | 파일 |
|------|------|
| useFilterStore (성별/색상/정렬) | `src/stores/useFilterStore.ts` |

### 테스트 (72개 전체 통과, data 계층 mock 기반)

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
| withErrorHandler RouteContext 타입 export | `src/lib/api/withErrorHandler.ts` |

### 현재 src 구조

```
src/
├── app/
│   ├── layout.tsx
│   ├── page.tsx                    ← 홈 (data 계층 → CategoryGrid)
│   ├── globals.css                 ← Tailwind directives만
│   ├── error.tsx                   ← 글로벌 에러 폴백
│   ├── not-found.tsx               ← 글로벌 404
│   ├── fonts/
│   ├── styles/
│   │   ├── page.tsx                ← 스타일 목록 (data 계층, 시즌 자동 정렬, 페이지네이션)
│   │   ├── loading.tsx
│   │   ├── error.tsx
│   │   └── [id]/
│   │       ├── page.tsx            ← 스타일 상세 → 유사 상품 (가격대 필터 + 정렬)
│   │       └── not-found.tsx
│   ├── products/
│   │   └── [id]/
│   │       ├── page.tsx            ← 상품 상세 → 구매처
│   │       ├── loading.tsx
│   │       ├── error.tsx
│   │       └── not-found.tsx
│   └── api/
│       ├── categories/
│       │   ├── route.ts            (+route.test.ts)
│       │   └── [id]/styles/route.ts (+route.test.ts)
│       ├── styles/
│       │   ├── route.ts            (+route.test.ts)
│       │   └── [id]/
│       │       ├── route.ts        (+route.test.ts)
│       │       └── products/route.ts (+route.test.ts)
│       ├── products/
│       │   └── [id]/
│       │       ├── route.ts        (+route.test.ts)
│       │       └── links/route.ts  (+route.test.ts)
│       └── search/
│           └── route.ts            (+route.test.ts)
├── components/
│   ├── ui/
│   │   ├── Badge.tsx
│   │   └── Skeleton.tsx
│   ├── CategoryGrid.client.tsx
│   ├── StyleCard.tsx
│   ├── FilterBar.client.tsx
│   ├── Pagination.client.tsx       ← 페이지네이션 UI
│   ├── PriceFilter.client.tsx      ← 가격대 필터
│   ├── ProductSortBar.client.tsx   ← 상품 정렬 바
│   ├── ProductCompareCard.tsx
│   └── PurchaseLinkList.tsx
├── lib/
│   ├── api/
│   │   ├── errorCodes.ts
│   │   ├── errors.ts              (+errors.test.ts)
│   │   ├── withErrorHandler.ts    (+withErrorHandler.test.ts)
│   │   └── parseQueryParams.ts    (+parseQueryParams.test.ts)
│   ├── data/                       ← 데이터 접근 계층 (캐싱 포함)
│   │   ├── categories.ts           ← getCategories, getCategoryById
│   │   ├── styles.ts               ← getStylesWithCount, getStyleById, getStyleProducts
│   │   ├── products.ts             ← getProductById, getProductLinks
│   │   └── search.ts              ← searchAll
│   ├── prisma.ts
│   ├── redis.ts                    ← Upstash Redis 싱글턴 (없으면 null)
│   ├── cache.ts                    ← withCache, buildCacheKey, invalidateCache, CACHE_TTL
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
| API Route 핸들러 단위 테스트 (42개, 8개 라우트) | ✅ 완료 | `1963176` |
| 글로벌 error.tsx + products/[id]/loading.tsx 추가 | ✅ 완료 | `4e93345` |
| 페이지네이션 UI (styles 목록, 12개 단위) | ✅ 완료 | `5549537` |
| 가격대 필터 (~3만, 3~5만, 5~10만, 10~20만, 20만~) | ✅ 완료 | `5549537` |
| 상품 정렬 UI (유사도순/가격순/브랜드순) | ✅ 완료 | `5549537` |
| Upstash Redis 연동 + 캐시 유틸 구현 | ✅ 완료 | — (unstaged) |
| 데이터 접근 계층 추출 (`src/lib/data/` 4파일) | ✅ 완료 | — (unstaged) |
| API Route 8개 + 페이지 4개 → data 계층 리팩토링 | ✅ 완료 | — (unstaged) |
| 테스트 Prisma mock → data 계층 mock 전환 | ✅ 완료 | — (unstaged) |
| 문서 업데이트 (claude.md, PROJECT_RULES.md, README.md) | ✅ 완료 | — (unstaged) |

---

## 남은 작업

### Phase 3 잔여

- Cheerio 기반 가격 크롤러 구현 (musinsa.ts 확장)
- Cloudinary 이미지 업로드 파이프라인 (계정 필요)

### Phase 4

- NextAuth.js 인증 (카카오/구글 소셜 로그인)
- 관리자 페이지
- PWA 설정

### 기술 부채

- **시즌 정렬 로직 중복**: `src/app/api/styles/route.ts`와 `src/app/styles/page.tsx`에 `SEASON_BY_MONTH` 상수 및 시즌 정렬 로직이 중복됨. 순수 유틸 함수가 여러 개 생기면 `src/utils/`로 추출 필요 (TODO 코멘트 있음)
- **JS 레벨 페이지네이션**: `getStylesWithCount`가 전체 데이터를 반환한 뒤 JS `Array.slice()`로 페이지네이션 처리 중. 현재 규모(20건)에서는 문제없으나, 데이터 1000건 이상 시 Prisma `skip`/`take` 기반 DB 레벨 페이지네이션으로 전환 필요
- **검색 캐싱 전략**: 현재 `searchAll`은 모든 검색어를 캐싱하지만, 검색어가 다양하여 캐시 효율이 낮음. 인기 검색어만 캐싱하도록 전환 필요 (Redis Sorted Set 카운터 방식 검토)
- **Date 역직렬화**: Redis 캐시에서 반환된 Date 필드가 string으로 변환됨. 현재 소비측에서 `new Date()` 래핑으로 방어 처리. Date 필드가 많아지면 역직렬화 유틸 도입 검토 (cache.ts에 TODO 있음)

---

## 핵심 패턴 / 주의사항

### API Route 템플릿

```typescript
// src/app/api/xxx/route.ts — data 계층 함수를 호출하고, Prisma를 직접 사용하지 않는다
export const GET = withErrorHandler(async (req: NextRequest) => {
  const start = Date.now();
  const params = parseQueryParams<GetStylesParams>(req, { /* rules */ });
  const [data, total] = await getStylesWithCount({ ... });
  logger.info("xxx 조회", { context: "api:xxx", duration: Date.now() - start });
  return NextResponse.json({ data, pagination: { page, limit, total, totalPages } });
});
```

### 동적 라우트 템플릿

```typescript
// src/app/api/xxx/[id]/route.ts — data 계층 함수 호출, 캐싱은 data 계층 내부에서 처리
export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;
  const item = await getXxxById(id);  // src/lib/data/xxx.ts
  if (!item) throw new NotFoundError("xxx", "XXX_NOT_FOUND");
  return NextResponse.json(item);
});
```

### 캐시 무효화 (`invalidateCache`) 사용 가이드

`src/lib/cache.ts`에 `invalidateCache(pattern)` 함수가 정의되어 있으나, 현재 프로젝트는 GET 전용 API만 존재하여 **호출하는 곳이 없다.** TTL 만료에 의한 자연 갱신으로 충분한 상태.

다음 시점에 도입이 필요하다:

| 시점 | 무효화 대상 | 예시 |
|------|------------|------|
| 크롤러가 가격 데이터 갱신 후 | 해당 상품 + 관련 목록 캐시 | `invalidateCache("products:id=${productId}*")` + `invalidateCache("styles:*")` |
| 관리자 API로 스타일 CUD 시 | 스타일 목록 + 해당 카테고리 캐시 | `invalidateCache("styles:*")` + `invalidateCache("categories:id=${categoryId}:styles*")` |
| 카테고리 구조 변경 시 | 카테고리 전체 캐시 | `invalidateCache("categories:*")` |

**원칙:**
- DB에 CUD(Create/Update/Delete) 직후 관련 캐시를 즉시 무효화
- 패턴은 최소 범위로 지정 (`"*"` 전체 삭제보다 영향받는 prefix만)
- 연쇄 무효화 고려 (가격 변경 → 상품 캐시 + 목록 정렬 캐시 함께 무효화)

### 절대 하면 안 되는 것

- `process.env.XXX` 직접 접근 금지 → `import { env } from "@/lib/env"` 사용
- Client Component에서 Prisma import 금지 → 빌드 실패
- API Route / 페이지에서 Prisma 직접 호출 금지 → `src/lib/data/` 계층 함수 사용
- `any` 타입 사용 금지
- `"use client"` 남용 금지 (실제 상호작용 필요한 컴포넌트만)
- 이미지 `<img>` 태그 직접 사용 금지 → `next/image` 사용

---

## 참고 문서

- `CLAUDE.md` — 코딩 컨벤션, 컴포넌트 패턴, API Route 패턴
- `PROJECT_RULES.md` — 테스트 전략(§1), 환경변수(§2), 커밋 규칙(§3), 에러 코드(§4)
- `aideals_design.md` — 프로젝트 전체 설계 문서
- `prisma/schema.prisma` — DB 스키마 (타입 정의의 원본)
