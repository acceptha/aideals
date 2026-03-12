# CLAUDE.md — aideals 프로젝트 가이드

> 이 파일은 Claude Code가 이 프로젝트를 이해하고 작업할 때 참조하는 문서입니다.

---

## 프로젝트 개요

aideals는 패션 비교 플랫폼이다. 사용자가 의류 카테고리를 선택하면 해당 아이템을 착용한 셀럽/인플루언서 사진을 탐색하고, 유사 상품을 브랜드·가격별로 비교한 뒤, 구매 가능한 플랫폼까지 확인할 수 있는 모바일 우선(Mobile-First) 웹 애플리케이션이다.

### 핵심 사용자 플로우

```
카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인
```

1. **카테고리 선택**: 대분류(아우터, 상의, 하의, 원피스, 신발, 악세서리) → 소분류(블레이저, 패딩, 코트 등) 선택
2. **셀럽 스타일 탐색**: 선택 카테고리에 해당하는 착용 사진 그리드 노출. 성별·스타일 태그·시즌 필터 지원
3. **유사 상품 비교**: 사진 선택 시 유사 상품 카드 리스트 표시 (이미지, 브랜드, 상품명, 가격). 가격순·브랜드순·유사도순 정렬
4. **구매처 확인**: 상품 선택 시 판매 플랫폼 목록(무신사, 29CM, W컨셉, 쿠팡 등) + 가격 표시. 클릭 시 외부 링크 이동

---

## 기술 스택

| 영역 | 기술 | 버전 |
|------|------|------|
| 프레임워크 | Next.js (App Router) | 14.x |
| 언어 | TypeScript | 5.x |
| 스타일링 | TailwindCSS | 3.x |
| 상태관리 | Zustand | 4.x |
| ORM | Prisma | 5.x |
| DB | PostgreSQL (Supabase) | - |
| 캐시 | Redis (Upstash) | - |
| 인증 | NextAuth.js | 4.x |
| 이미지 CDN | Cloudinary | - |
| PWA | next-pwa | - |
| 크롤링 | Cheerio + Puppeteer | - |
| 배포 | Vercel | - |
| CI/CD | GitHub Actions | - |

---

## 데이터 모델

### Prisma 스키마 핵심 모델

```prisma
model Category {
  id        String   @id @default(cuid())
  name      String
  parentId  String?  @map("parent_id")
  parent    Category?  @relation("CategoryTree", fields: [parentId], references: [id])
  children  Category[] @relation("CategoryTree")
  iconUrl   String?  @map("icon_url")
  sortOrder Int      @default(0) @map("sort_order")
  styles    CelebStyle[]
}

model CelebStyle {
  id         String   @id @default(cuid())
  celebName  String   @map("celeb_name")
  imageUrl   String   @map("image_url")
  categoryId String   @map("category_id")
  category   Category @relation(fields: [categoryId], references: [id])
  tags       String[] // ["캐주얼", "스트릿", "미니멀"]
  gender     String   // "male" | "female" | "unisex"
  season     String   // "spring" | "summer" | "fall" | "winter" | "all"
  products   SimilarProduct[]
  createdAt  DateTime @default(now()) @map("created_at")
}

model SimilarProduct {
  id                 String   @id @default(cuid())
  styleId            String   @map("style_id")
  style              CelebStyle @relation(fields: [styleId], references: [id])
  brandName          String   @map("brand_name")
  productName        String   @map("product_name")
  productImageUrl    String   @map("product_image_url")
  representativePrice Int     @map("representative_price")
  similarityScore    Float    @default(0) @map("similarity_score")
  purchaseLinks      PurchaseLink[]
  createdAt          DateTime @default(now()) @map("created_at")
}

model PurchaseLink {
  id              String   @id @default(cuid())
  productId       String   @map("product_id")
  product         SimilarProduct @relation(fields: [productId], references: [id])
  platformName    String   @map("platform_name")
  platformLogoUrl String?  @map("platform_logo_url")
  price           Int
  currency        String   @default("KRW")
  productUrl      String   @map("product_url")
  inStock         Boolean  @default(true) @map("in_stock")
  lastCheckedAt   DateTime @default(now()) @map("last_checked_at")
}
```

### 관계

- Category → CelebStyle: 1:N (하나의 카테고리에 여러 셀럽 스타일)
- CelebStyle → SimilarProduct: 1:N (하나의 스타일에 여러 유사 상품)
- SimilarProduct → PurchaseLink: 1:N (하나의 상품에 여러 구매처)
- Category → Category: self-referencing (대분류-소분류 트리)

---

## API 엔드포인트

### 카테고리

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/categories` | 전체 카테고리 트리 조회 | - |
| GET | `/api/categories/:id/styles` | 특정 카테고리의 셀럽 스타일 목록 | `gender`, `season`, `tags`, `page`, `limit` |

### 셀럽 스타일

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/styles` | 스타일 목록 (필터링) | `categoryId`, `gender`, `season`, `tags`, `page`, `limit`, `sort` |
| GET | `/api/styles/:id` | 스타일 상세 정보 | - |
| GET | `/api/styles/:id/products` | 해당 스타일의 유사 상품 목록 | `sort` (price, brand, similarity) |

### 상품

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/products/:id` | 상품 상세 정보 | - |
| GET | `/api/products/:id/links` | 구매 가능 플랫폼 목록 | `sort` (price) |

### 검색

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/search` | 통합 검색 | `q` (검색어), `type` (celeb, brand, product) |

---

## 주요 컴포넌트 명세

### CategoryGrid

- 카테고리 아이콘을 그리드로 표시
- 모바일: 3열, 데스크톱: 사이드바 + 4열
- 대분류 선택 시 소분류 펼침(드릴다운)

### StyleCard

- 셀럽 착용 사진 + 이름 + 태그 배지
- next/image 사용, lazy loading 필수
- 클릭 시 `/styles/[id]`로 이동

### ProductCompareCard

- 상품 이미지 + 브랜드명 + 상품명 + 가격
- 유사도 점수 시각적 표시 (프로그레스 바 등)
- 클릭 시 `/products/[id]`로 이동

### PurchaseLinkList

- 플랫폼 로고 + 이름 + 가격 + 재고 상태
- 최저가 하이라이트
- 클릭 시 외부 URL 새 탭 오픈 (`target="_blank"`, `rel="noopener noreferrer"`)

### FilterBar

- 성별(남/여/공용), 시즌(봄/여름/가을/겨울), 스타일 태그 다중 선택
- Zustand `useFilterStore`와 연동
- URL 쿼리 파라미터와 동기화 (`useSearchParams`)

---

## 코딩 컨벤션

### 일반 규칙

- 모든 코드는 TypeScript로 작성한다. `any` 사용을 금지한다.
- `src/types/index.ts`에 공유 타입을 정의하고, 프론트엔드와 API 양쪽에서 import한다.
- 컴포넌트는 함수형 컴포넌트 + Arrow Function으로 작성한다.
- 파일명은 컴포넌트는 PascalCase, 유틸/라이브러리는 camelCase를 사용한다.

### Next.js App Router

- 페이지 컴포넌트는 기본적으로 Server Component로 작성한다.
- 클라이언트 상호작용이 필요한 컴포넌트만 `"use client"` 지시어를 사용한다.
- API Route에서는 `NextRequest`/`NextResponse`를 사용한다.
- 데이터 페칭은 Server Component에서 직접 Prisma를 호출하거나, 클라이언트에서는 `fetch` + SWR 패턴을 사용한다.

### 스타일링 (TailwindCSS)

- Mobile-First로 작성한다: 기본 스타일이 모바일, `md:`, `lg:` 접두사로 확장한다.
- 커스텀 CSS 파일은 사용하지 않는다. 모든 스타일은 Tailwind 유틸리티 클래스로 처리한다.
- 반복되는 스타일 조합은 컴포넌트로 추출하되, `@apply`는 사용하지 않는다.
- 색상, 간격 등의 디자인 토큰은 `tailwind.config.ts`의 `theme.extend`에 정의한다.

### 상태관리 (Zustand)

- 스토어는 `src/stores/` 디렉토리에 `use[Name]Store.ts` 형식으로 작성한다.
- 셀렉터를 사용하여 필요한 상태만 구독한다: `const gender = useFilterStore(s => s.gender)`
- 서버 데이터(API 응답)는 Zustand에 넣지 않는다. Server Component에서 직접 패칭하거나 SWR을 사용한다.

### Prisma

- Prisma 클라이언트는 `src/lib/prisma.ts`에서 싱글턴으로 관리한다.
- 쿼리 시 `select`나 `include`를 명시하여 필요한 필드만 가져온다.
- 스키마 변경 후에는 반드시 `npx prisma migrate dev --name <설명>`을 실행한다.
- 시드 데이터는 `prisma/seed.ts`에 작성한다.

### 이미지

- 모든 이미지는 `next/image`의 `<Image>` 컴포넌트를 사용한다.
- `width`, `height` 또는 `fill` 속성을 반드시 지정하여 레이아웃 시프트를 방지한다.
- 외부 이미지 도메인은 `next.config.js`의 `images.remotePatterns`에 등록한다.

### 에러 처리

- API Route에서는 try-catch로 감싸고, 적절한 HTTP 상태 코드와 에러 메시지를 반환한다.
- 페이지에는 `error.tsx`와 `loading.tsx`를 배치하여 에러/로딩 상태를 처리한다.
- 크롤러 실패 시 Redis 캐시의 이전 데이터를 폴백으로 사용한다.

---

## 코드 패턴 가이드

> 이 섹션은 프로젝트 전체에서 일관된 코드 스타일을 유지하기 위한 패턴 레퍼런스다.
> 새 파일을 생성하거나 기존 코드를 수정할 때 반드시 이 패턴을 따른다.

---

### 1. 파일 내부 코드 순서

모든 `.tsx` / `.ts` 파일은 아래 순서를 따른다:

```
1. "use client" 지시어 (필요한 경우만)
2. 외부 라이브러리 import
3. 내부 모듈 import (components, lib, stores, types 순)
4. interface / type 정의
5. 상수 정의
6. 헬퍼 함수 (컴포넌트 밖)
7. 메인 컴포넌트 or 핸들러 함수
8. 서브 컴포넌트 (같은 파일 내에서만 쓰이는 경우)
```

---

### 2. 타입 정의 규칙

- **Props, API 요청/응답 등 객체 형태**는 `interface`를 사용한다.
- **유니온, 유틸리티 타입 조합**만 `type`을 사용한다.
- 공유 타입은 `src/types/index.ts`에, 특정 도메인 타입은 `src/types/<domain>.ts`에 정의한다.

---

### 3. 컴포넌트 패턴

#### 3.1 Server Component (기본)

페이지 컴포넌트와 데이터 패칭이 필요한 컴포넌트는 Server Component로 작성한다. `"use client"` 지시어 없이 `async` 함수로 선언하며, Prisma 호출이나 시크릿 접근을 직접 수행한다.

#### 3.2 Client Component

사용자 상호작용(클릭, 입력, 상태 변경)이 필요한 컴포넌트에만 `"use client"`를 파일 최상단에 붙인다. Hook(useState, useEffect 등)이나 이벤트 핸들러가 필요한 경우가 해당된다.

#### 3.3 Server / Client 컴포넌트 분리 기준

| 기준 | Server Component | Client Component |
|------|-----------------|------------------|
| 데이터 패칭 (Prisma, fetch) | ✅ | ❌ |
| DB/시크릿 접근 | ✅ | ❌ |
| 단순 표시 (props만 받아서 렌더링) | ✅ | ❌ |
| onClick, onChange 등 이벤트 | ❌ | ✅ |
| useState, useEffect 등 Hook | ❌ | ✅ |
| Zustand 스토어 접근 | ❌ | ✅ |
| URL 파라미터 읽기/쓰기 (useSearchParams) | ❌ | ✅ |

**패턴:** Server Component가 데이터를 패칭하고, Client Component에 props로 내려준다.

```
ServerPage (데이터 패칭)
  └─ ClientFilterBar (사용자 입력)
  └─ ServerStyleCard (표시만)
       └─ ClientBookmarkButton (클릭 이벤트)
```

---

### 4. API Route 패턴

#### 4.1 기본 구조

모든 API Route 핸들러는 `withErrorHandler` 래퍼로 감싸서 에러 처리를 통일한다.

```typescript
// src/app/api/styles/route.ts
export const GET = withErrorHandler(async (req: NextRequest) => {
  const params = parseQueryParams<GetStylesParams>(req, { /* 규칙 */ });
  const styles = await prisma.celebStyle.findMany({ ... });
  return NextResponse.json({ data: styles, pagination: { ... } });
});
```

#### 4.2 동적 라우트 (단건 조회)

```typescript
// src/app/api/styles/[id]/route.ts
export const GET = withErrorHandler(async (req: NextRequest, ctx: RouteContext) => {
  const { id } = await ctx.params;
  const style = await prisma.celebStyle.findUnique({ where: { id } });
  if (!style) throw new NotFoundError("스타일");
  return NextResponse.json(style);
});
```

#### 4.3 API 응답 포맷

```
성공 (단건):  200 { id, name, ... }           ← 데이터 직접 반환
성공 (목록):  200 { data: [...], pagination }  ← data 배열 + 페이지네이션
에러:        4xx/5xx { status, message }       ← 상태코드 + 메시지
```

---

### 5. 에러 처리 (중앙 집중)

#### 5.1 커스텀 에러 클래스

```typescript
// src/lib/api/errors.ts
export class AppError extends Error {
  constructor(message: string, public statusCode: number = 500) {
    super(message);
  }
}
export class NotFoundError extends AppError {
  constructor(resource: string) { super(`${resource}을(를) 찾을 수 없습니다`, 404); }
}
export class ValidationError extends AppError {
  constructor(message: string) { super(message, 400); }
}
```

#### 5.2 에러 핸들러 래퍼

```typescript
// src/lib/api/withErrorHandler.ts
export const withErrorHandler = (handler: RouteHandler): RouteHandler => {
  return async (req, ctx) => {
    try {
      return await handler(req, ctx);
    } catch (error) {
      if (error instanceof AppError) {
        return NextResponse.json(
          { status: error.statusCode, message: error.message },
          { status: error.statusCode },
        );
      }
      console.error("[API Error]", error);
      return NextResponse.json(
        { status: 500, message: "서버 내부 오류가 발생했습니다" },
        { status: 500 },
      );
    }
  };
};
```

핸들러 내부에서는 `throw`만 하면 `withErrorHandler`가 일괄 처리한다.

---

### 6. 파라미터 검증

#### 6.1 쿼리 파라미터 파서 (GET)

```typescript
// src/lib/api/parseQueryParams.ts — 핵심 구조
export const parseQueryParams = <T>(req: NextRequest, rules: ParamRules): T => {
  // searchParams에서 값 추출 → rules 기반 타입 변환/검증 → 실패 시 ValidationError throw
};

// 사용: parseQueryParams<GetStylesParams>(req, {
//   gender: { type: "string", enum: ["male", "female", "unisex"] },
//   page:   { type: "number", default: 1, min: 1 },
//   limit:  { type: "number", default: 20, min: 1, max: 100 },
// });
```

ParamRule 인터페이스: `{ type, required?, default?, enum?, min?, max? }`

#### 6.2 Request Body 검증 (POST/PUT/PATCH)

```typescript
// src/lib/api/parseBody.ts — 핵심 구조
export const parseBody = async <T>(req: NextRequest, requiredFields: string[]): Promise<T> => {
  // req.json() 파싱 → requiredFields 존재 여부 검증 → 실패 시 ValidationError throw
};
```

---

### 7. 프로젝트 구조 규칙

```
src/
├── app/                          # Next.js App Router (페이지 + API)
│   ├── api/                      # API Route 핸들러
│   └── (pages)/                  # 페이지 컴포넌트
├── components/
│   ├── ui/                       # 범용 UI (Button, Card, Modal, Skeleton)
│   ├── [ComponentName].tsx       # 도메인 컴포넌트 (CategoryGrid, StyleCard 등)
│   └── [ComponentName].client.tsx # 같은 이름의 Client 분리본 (필요 시)
├── lib/
│   ├── api/                      # API 유틸리티 (에러, 파서, 핸들러 래퍼)
│   ├── prisma.ts                 # Prisma 클라이언트 싱글턴
│   ├── redis.ts                  # Upstash Redis 클라이언트
│   └── scraper/                  # 크롤러 모듈
├── stores/                       # Zustand 스토어
├── types/                        # 공유 타입 정의
│   ├── index.ts                  # 도메인 엔티티 타입
│   └── api.ts                    # API 요청/응답 타입
└── utils/                        # 순수 유틸 함수 (포맷, 변환 등)
```

### 배치 규칙

- **한 곳에서만 쓰이는 타입**: 해당 파일 내부에 정의
- **2곳 이상에서 쓰이는 타입**: `src/types/`로 이동
- **컴포넌트와 1:1 대응되는 Client 분리**: `ComponentName.client.tsx` 네이밍
- **API 유틸리티**: 반드시 `src/lib/api/` 아래에 배치
- **순수 함수 (날짜 포맷, 가격 포맷 등)**: `src/utils/`에 배치

---

### 8. Export 규칙

| 대상 | 방식 | 이유 |
|------|------|------|
| 페이지 컴포넌트 (page.tsx) | `export default` | Next.js App Router 요구사항 |
| 일반 컴포넌트 | `export { ComponentName }` | 명시적 named export, barrel export 가능 |
| 라이브러리/유틸 함수 | `export const fn = ...` | named export |
| 타입/인터페이스 | `export interface ...` | named export |
| Zustand 스토어 | `export const useXxxStore = ...` | named export |

---

## Git 커밋

> 커밋 시 반드시 `npm run commit`을 사용한다. 상세 규칙은 `COMMIT_CONVENTION.md` 참고.

---

## 주의사항

- Prisma 클라이언트를 Server Component나 API Route에서만 사용한다. 클라이언트 컴포넌트에서 직접 import하면 빌드가 실패한다.
- `"use client"` 지시어는 실제로 브라우저 상호작용이 필요한 컴포넌트에만 붙인다. 남용하면 Server Components의 성능 이점을 잃는다.
- Puppeteer는 Vercel 서버리스 함수의 50MB 제한에 걸릴 수 있다. `@sparticuz/chromium`을 사용하여 경량 Chromium을 번들링한다.
- 환경 변수 중 `NEXT_PUBLIC_` 접두사가 붙은 것만 클라이언트에 노출된다. API 키, 시크릿은 절대 `NEXT_PUBLIC_`을 붙이지 않는다.
- 외부 플랫폼 링크에는 반드시 `rel="noopener noreferrer"`를 추가한다.
- 이미지 도메인을 추가할 때는 `next.config.js`의 `images.remotePatterns`를 업데이트한다.
