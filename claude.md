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

## 디렉토리 구조

```
aideals/
├── prisma/
│   └── schema.prisma              # 데이터 모델 정의
├── public/
│   ├── icons/                     # 카테고리 아이콘, PWA 아이콘
│   └── manifest.json              # PWA 매니페스트
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 루트 레이아웃 (글로벌 스타일, 메타데이터)
│   │   ├── page.tsx               # 홈 — 카테고리 선택 화면
│   │   ├── styles/
│   │   │   ├── page.tsx           # 셀럽 스타일 목록 (필터 + 그리드)
│   │   │   └── [id]/
│   │   │       └── page.tsx       # 스타일 상세 → 유사 상품 비교
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── page.tsx       # 상품 상세 → 구매처 목록
│   │   └── api/
│   │       ├── categories/
│   │       │   └── route.ts       # GET /api/categories
│   │       ├── styles/
│   │       │   ├── route.ts       # GET /api/styles
│   │       │   └── [id]/
│   │       │       ├── route.ts   # GET /api/styles/:id
│   │       │       └── products/
│   │       │           └── route.ts  # GET /api/styles/:id/products
│   │       ├── products/
│   │       │   └── [id]/
│   │       │       ├── route.ts   # GET /api/products/:id
│   │       │       └── links/
│   │       │           └── route.ts  # GET /api/products/:id/links
│   │       └── search/
│   │           └── route.ts       # GET /api/search?q=...&type=...
│   ├── components/
│   │   ├── ui/                    # 공통 UI (Button, Card, Modal, Skeleton 등)
│   │   ├── CategoryGrid.tsx       # 카테고리 아이콘 그리드
│   │   ├── StyleCard.tsx          # 셀럽 스타일 카드
│   │   ├── ProductCompareCard.tsx # 유사 상품 비교 카드
│   │   ├── PurchaseLinkList.tsx   # 구매처 목록
│   │   ├── FilterBar.tsx          # 필터 (성별, 시즌, 태그)
│   │   └── SearchBar.tsx          # 통합 검색
│   ├── lib/
│   │   ├── prisma.ts              # Prisma 클라이언트 싱글턴
│   │   ├── redis.ts               # Upstash Redis 클라이언트
│   │   ├── cloudinary.ts          # Cloudinary 설정 및 헬퍼
│   │   └── scraper/
│   │       ├── index.ts           # 크롤러 통합 진입점
│   │       ├── cheerio.ts         # 정적 HTML 파싱 크롤러
│   │       └── puppeteer.ts       # 동적 페이지 크롤러 (폴백)
│   ├── stores/
│   │   └── useFilterStore.ts      # Zustand: 필터 조건 전역 상태
│   └── types/
│       └── index.ts               # 공유 TypeScript 타입 정의
├── .env.local                     # 환경 변수 (로컬)
├── tailwind.config.ts
├── next.config.js
├── tsconfig.json
└── package.json
```

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

## 환경 변수

```env
# Database (Supabase)
DATABASE_URL="postgresql://..."

# Redis (Upstash)
UPSTASH_REDIS_REST_URL="https://..."
UPSTASH_REDIS_REST_TOKEN="..."

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME="..."
CLOUDINARY_API_KEY="..."
CLOUDINARY_API_SECRET="..."

# NextAuth
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="..."

# OAuth Providers
KAKAO_CLIENT_ID="..."
KAKAO_CLIENT_SECRET="..."
GOOGLE_CLIENT_ID="..."
GOOGLE_CLIENT_SECRET="..."
```

---

## 자주 쓰는 명령어

```bash
# 개발 서버
npm run dev

# 빌드 및 프로덕션 실행
npm run build
npm start

# Prisma
npx prisma migrate dev --name <설명>   # 마이그레이션 생성 및 적용
npx prisma generate                    # 클라이언트 재생성
npx prisma studio                      # DB GUI
npx prisma db seed                     # 시드 데이터 삽입

# 린트 및 타입 체크
npm run lint
npx tsc --noEmit

# 테스트
npm run test
```

---

## 반응형 브레이크포인트

| 이름 | 기준 | 용도 |
|------|------|------|
| 기본 (모바일) | < 768px | 모든 스타일의 기본값 |
| `md` | ≥ 768px | 태블릿 |
| `lg` | ≥ 1024px | 데스크톱 |
| `xl` | ≥ 1280px | 대형 화면 |

### 화면별 레이아웃

- **카테고리**: 모바일 3열 그리드 → 데스크톱 사이드바 + 4열
- **스타일 목록**: 모바일 2열 → 데스크톱 4열
- **상품 비교**: 모바일 수직 리스트 → 데스크톱 3열 그리드
- **구매처**: 모바일 풀너비 리스트 → 데스크톱 테이블

---

## 캐싱 전략

| 대상 | 저장소 | TTL | 갱신 조건 |
|------|--------|-----|-----------|
| 카테고리 트리 | Redis | 24시간 | 관리자 수정 시 무효화 |
| 셀럽 스타일 목록 | Redis | 6시간 | 신규 등록 시 무효화 |
| 유사 상품 목록 | Redis | 6시간 | 상품 추가/삭제 시 무효화 |
| 가격 정보 (PurchaseLink) | Redis | 1~3시간 | 크롤러 재수집 시 갱신 |
| 정적 페이지 | Next.js ISR | 1시간 | revalidate 설정 |

---

## 개발 단계별 우선순위

### Phase 1 — MVP (2주)

- [ ] Next.js 프로젝트 초기 설정 (TailwindCSS, TypeScript, ESLint)
- [ ] Prisma 스키마 정의 및 Supabase 연동
- [ ] 목(mock) 데이터 시드 작성
- [ ] CategoryGrid 컴포넌트 + 홈 페이지
- [ ] StyleCard 컴포넌트 + 스타일 목록 페이지
- [ ] 반응형 레이아웃 완성

### Phase 2 — 핵심 기능 (2주)

- [ ] API Routes 구현 (categories, styles, products, search)
- [ ] ProductCompareCard 컴포넌트 + 스타일 상세 페이지
- [ ] PurchaseLinkList 컴포넌트 + 상품 상세 페이지
- [ ] FilterBar + Zustand 스토어 + URL 동기화
- [ ] 통합 검색 기능

### Phase 3 — 데이터 확장 (2주)

- [ ] Cheerio 기반 가격 크롤러 구현
- [ ] Puppeteer 폴백 크롤러
- [ ] Upstash Redis 캐싱 적용
- [ ] Cloudinary 이미지 업로드 파이프라인
- [ ] 관리자 페이지 (콘텐츠 CRUD)

### Phase 4 — 고도화 (2주)

- [ ] next-pwa 적용 (서비스 워커, 오프라인 캐싱)
- [ ] NextAuth.js 소셜 로그인 (카카오, 구글)
- [ ] 북마크/찜 기능
- [ ] 가격 변동 알림 (Vercel Cron + 푸시)
- [ ] GitHub Actions CI/CD 파이프라인

---

## 주의사항

- Prisma 클라이언트를 Server Component나 API Route에서만 사용한다. 클라이언트 컴포넌트에서 직접 import하면 빌드가 실패한다.
- `"use client"` 지시어는 실제로 브라우저 상호작용이 필요한 컴포넌트에만 붙인다. 남용하면 Server Components의 성능 이점을 잃는다.
- Puppeteer는 Vercel 서버리스 함수의 50MB 제한에 걸릴 수 있다. `@sparticuz/chromium`을 사용하여 경량 Chromium을 번들링한다.
- 환경 변수 중 `NEXT_PUBLIC_` 접두사가 붙은 것만 클라이언트에 노출된다. API 키, 시크릿은 절대 `NEXT_PUBLIC_`을 붙이지 않는다.
- 외부 플랫폼 링크에는 반드시 `rel="noopener noreferrer"`를 추가한다.
- 이미지 도메인을 추가할 때는 `next.config.js`의 `images.remotePatterns`를 업데이트한다.
