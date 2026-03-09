# 패션 비교 플랫폼 설계 문서

**프로젝트명:** aideals
**문서 버전:** v1.1
**작성일:** 2026-03-09

---

## 1. 프로젝트 개요

사용자가 원하는 옷 카테고리를 선택하면, 해당 아이템을 착용한 셀럽/인플루언서의 스타일링 사진을 탐색하고, 유사 상품을 브랜드·가격별로 비교한 뒤, 최저가 구매처까지 한 번에 확인할 수 있는 모바일 우선(Mobile-First) 웹 애플리케이션이다.

---

## 2. 핵심 사용자 플로우

```
[카테고리 선택] → [셀럽 스타일 탐색] → [유사 상품 비교] → [구매처 확인]
```

### Step 1 — 카테고리 선택
사용자가 의류 카테고리(아우터, 상의, 하의, 원피스, 신발, 악세서리 등)와 세부 카테고리(예: 아우터 → 블레이저, 패딩, 코트)를 선택한다.

### Step 2 — 셀럽/인플루언서 스타일 탐색
선택한 카테고리에 해당하는 셀럽·인플루언서 착용 사진이 그리드 형태로 노출된다. 필터(성별, 스타일 태그, 시즌)를 통해 결과를 좁힐 수 있다.

### Step 3 — 유사 상품 비교
사진을 선택하면, 해당 아이템과 유사한 여러 브랜드의 상품이 카드 리스트로 표시된다. 각 카드에는 상품 이미지, 브랜드명, 상품명, 가격이 포함되며, 가격순·브랜드순·유사도순 정렬이 가능하다.

### Step 4 — 구매처 확인
특정 상품을 선택하면 해당 상품을 판매하는 플랫폼(무신사, 29CM, W컨셉, 공식몰, 쿠팡 등)의 목록이 가격과 함께 표시되고, 클릭 시 해당 플랫폼의 상품 페이지로 이동(외부 링크)한다.

---

## 3. 시스템 아키텍처

### 3.1 전체 구조 (3-Tier)

```
┌─────────────────────────────────────────────────┐
│                  Client (SPA)                   │
│          Next.js + React + TailwindCSS          │
│            (PWA · Mobile-First)                 │
└────────────────────┬────────────────────────────┘
                     │  REST / GraphQL
┌────────────────────▼────────────────────────────┐
│                 API Server                      │
│              Node.js + Express                  │
│         (또는 Next.js API Routes)               │
│                                                 │
│  ┌────────────┐ ┌──────────┐ ┌───────────────┐  │
│  │ Category   │ │ Style    │ │ Product       │  │
│  │ Service    │ │ Service  │ │ Compare Svc   │  │
│  └────────────┘ └──────────┘ └───────────────┘  │
│  ┌────────────┐ ┌──────────────────────────┐    │
│  │ Price      │ │ External API Gateway     │    │
│  │ Aggregator │ │ (Affiliate / Crawling)   │    │
│  └────────────┘ └──────────────────────────┘    │
└────────────────────┬────────────────────────────┘
                     │
┌────────────────────▼────────────────────────────┐
│                 Data Layer                      │
│                                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │PostgreSQL│  │  Redis   │  │ Cloudinary/  │  │
│  │ (메인DB) │  │ (캐시)   │  │ S3 (이미지)  │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└─────────────────────────────────────────────────┘
```

### 3.2 모듈별 역할

| 모듈 | 역할 |
|------|------|
| **Category Service** | 카테고리 트리 관리, 세부 카테고리 CRUD |
| **Style Service** | 셀럽/인플루언서 착용 사진 및 메타데이터 관리, 태그 기반 검색 |
| **Product Compare Service** | 착용 아이템 기반 유사 상품 매칭, 브랜드·가격 비교 데이터 생성 |
| **Price Aggregator** | 복수 쇼핑 플랫폼의 가격·재고·URL 수집 및 캐싱 |
| **External API Gateway** | 제휴 API(무신사, 29CM 등) 및 크롤링 어댑터 통합 관리 |

---

## 4. 데이터 모델 (ERD 요약)

### 4.1 주요 엔티티

```
Category
├── id (PK)
├── name
├── parent_id (FK, self-ref)  // 대분류-소분류 트리
├── icon_url
└── sort_order

CelebStyle
├── id (PK)
├── celeb_name
├── image_url
├── category_id (FK → Category)
├── tags[]           // ["캐주얼", "스트릿", "미니멀"]
├── gender
├── season
└── created_at

SimilarProduct
├── id (PK)
├── style_id (FK → CelebStyle)
├── brand_name
├── product_name
├── product_image_url
├── representative_price
├── similarity_score   // 0.0 ~ 1.0
└── created_at

PurchaseLink
├── id (PK)
├── product_id (FK → SimilarProduct)
├── platform_name      // "무신사", "29CM", "쿠팡" 등
├── platform_logo_url
├── price
├── currency
├── product_url
├── in_stock (boolean)
└── last_checked_at
```

### 4.2 관계 요약

- Category : CelebStyle = 1 : N
- CelebStyle : SimilarProduct = 1 : N
- SimilarProduct : PurchaseLink = 1 : N

---

## 5. 기술 스택 선정 및 근거

### 5.1 프론트엔드

#### Next.js 14 (App Router) — 프레임워크

**후보군:** Next.js vs Vite + React SPA vs Nuxt.js (Vue)

이 프로젝트는 이미지 중심의 콘텐츠를 다루기 때문에 검색 엔진에 상품·셀럽 스타일 페이지가 노출되는 것이 장기적으로 중요하다. Next.js의 SSR/SSG를 활용하면 크롤러에게 완성된 HTML을 제공할 수 있어 SEO를 자연스럽게 확보할 수 있다. Vite + React SPA는 빌드 속도는 빠르지만 클라이언트 사이드 렌더링만 가능해 SEO에 불리하고, 별도 서버를 구성해야 한다. Nuxt.js는 SSR을 지원하지만 Vue 생태계는 React 대비 패션/이커머스 관련 오픈소스 컴포넌트(이미지 갤러리, 무한 스크롤 등)가 적다.

또한 Next.js의 API Routes를 BFF(Backend For Frontend)로 활용하면 별도의 Express 서버 없이 프론트엔드와 백엔드를 하나의 프로젝트에서 관리할 수 있어, 토이 프로젝트의 운영 복잡도를 크게 낮출 수 있다. React Server Components를 통해 셀럽 스타일 목록처럼 정적에 가까운 데이터를 서버에서 렌더링하면 클라이언트 번들 사이즈를 줄이고 초기 로딩 속도를 개선할 수 있다.

#### TailwindCSS — 스타일링

**후보군:** TailwindCSS vs styled-components vs CSS Modules

패션 플랫폼은 카드 그리드, 이미지 갤러리, 필터 UI 등 반복적인 레이아웃 패턴이 많다. TailwindCSS는 유틸리티 클래스 기반이라 이런 반복 패턴을 빠르게 조합할 수 있고, `sm:`, `md:`, `lg:` 같은 반응형 접두사가 기본 내장되어 있어 모바일 퍼스트 설계에 자연스럽게 맞는다.

styled-components는 CSS-in-JS 방식으로 컴포넌트 단위 스타일링에 강하지만, 런타임에 스타일을 생성하기 때문에 이미지가 대량으로 렌더링되는 페이지에서 성능 오버헤드가 발생할 수 있다. 또한 Next.js App Router의 Server Components와 함께 사용할 때 추가적인 설정이 필요하다. CSS Modules는 안정적이지만 반응형 유틸리티를 직접 작성해야 하므로 개발 속도가 느려진다.

#### Zustand — 상태관리

**후보군:** Zustand vs Redux Toolkit vs React Context + useReducer

이 프로젝트에서 전역으로 관리해야 할 상태는 필터 조건(카테고리, 성별, 시즌, 정렬 기준)과 북마크 목록 정도다. Redux Toolkit은 슬라이스, 미들웨어, 셀렉터 등 강력한 기능을 제공하지만, 이 규모에서는 보일러플레이트가 과도하다. React Context + useReducer는 외부 의존성 없이 사용 가능하지만, 컨텍스트 값이 변경될 때마다 구독 중인 모든 컴포넌트가 리렌더링되는 문제가 있어 필터 변경이 잦은 UI에서는 비효율적이다.

Zustand는 단 몇 줄로 스토어를 생성할 수 있고, 셀렉터 기반으로 필요한 상태만 구독하기 때문에 불필요한 리렌더링이 발생하지 않는다. 번들 사이즈도 약 1KB 수준으로 매우 가볍다.

#### next/image — 이미지 최적화

**후보군:** next/image vs 직접 구현(lazy loading + srcset) vs Cloudinary URL 변환

패션 플랫폼 특성상 한 페이지에 수십 장의 고해상도 이미지가 로드되므로 이미지 최적화가 성능의 핵심이다. next/image는 자동 lazy loading, WebP/AVIF 포맷 변환, 디바이스별 반응형 사이즈 생성, 레이아웃 시프트 방지(width/height 기반 placeholder)를 프레임워크 레벨에서 제공한다.

직접 구현하면 Intersection Observer, srcset, picture 태그 등을 수동으로 관리해야 하고, 포맷 변환을 위한 별도 빌드 파이프라인이 필요하다. Cloudinary URL 변환 방식은 강력하지만 모든 이미지가 Cloudinary를 경유해야 하므로 비용과 의존성이 증가한다. next/image는 Vercel 배포 시 Edge Network에서 이미지 최적화가 자동으로 처리되므로 추가 비용 없이 성능을 확보할 수 있다.

#### next-pwa — PWA 지원

**후보군:** next-pwa vs Workbox 직접 설정 vs 네이티브 앱(React Native)

모바일 사용자가 브라우저에서 바로 홈 화면에 추가하고, 오프라인에서도 최근 탐색한 스타일을 확인할 수 있도록 PWA를 적용한다. next-pwa는 Next.js 빌드 과정에 Workbox를 자동 통합해 서비스 워커와 매니페스트를 생성하므로, 설정 한두 줄로 PWA 기능을 활성화할 수 있다.

Workbox를 직접 설정하면 캐싱 전략(Network First, Cache First 등)을 세밀하게 제어할 수 있지만, 초기 구성이 복잡하고 Next.js의 빌드 결과물과 통합하려면 추가 작업이 필요하다. React Native는 네이티브 수준의 사용자 경험을 제공하지만, 별도 코드베이스를 관리해야 하고, 앱 스토어 배포·심사 과정이 필요해 토이 프로젝트에는 과도한 선택이다.

---

### 5.2 백엔드

#### Node.js 20 LTS — 런타임

**후보군:** Node.js vs Python (FastAPI) vs Go (Gin)

프론트엔드를 Next.js(React)로 구성했으므로, 백엔드도 Node.js를 사용하면 프로젝트 전체를 TypeScript 단일 언어로 통일할 수 있다. 이는 타입 정의 파일(types/)을 프론트엔드와 백엔드가 공유할 수 있다는 의미로, API 응답 타입이 변경될 때 양쪽을 동시에 수정할 수 있어 개발 효율이 높아진다.

Python(FastAPI)은 데이터 처리와 머신러닝 통합에 유리하지만, 향후 이미지 유사도 검색 같은 ML 기능은 별도 마이크로서비스로 분리하는 것이 더 적합하다. Go는 높은 동시성 처리에 강하지만, 토이 프로젝트 수준의 트래픽에서는 Node.js의 이벤트 루프만으로 충분하고, Go의 학습 비용이 프로젝트 일정에 부담이 된다.

#### Next.js API Routes — API 레이어

**후보군:** Next.js API Routes vs Express 별도 서버 vs NestJS

Next.js API Routes를 사용하면 `/src/app/api/` 디렉토리 아래에 엔드포인트를 파일 기반으로 구성할 수 있어, 프론트엔드와 동일한 프로젝트에서 API를 관리하게 된다. 배포 시에도 Vercel에 단일 프로젝트로 올리면 되므로 인프라 관리가 단순해진다.

Express 별도 서버는 라우팅과 미들웨어의 유연성이 높지만, 프론트엔드와 별도 레포지토리·별도 배포가 필요해 운영 복잡도가 증가한다. NestJS는 모듈·서비스·컨트롤러의 계층 구조와 의존성 주입(DI)을 통해 대규모 프로젝트에 적합한 아키텍처를 제공하지만, 4개 남짓의 도메인(카테고리, 스타일, 상품, 구매처)을 다루는 이 프로젝트에서는 프레임워크의 구조적 오버헤드가 오히려 개발 속도를 늦춘다.

다만, API Routes는 장기 실행 작업(크롤링 등)에는 적합하지 않으므로, 가격 수집용 크롤러는 별도의 스크립트나 서버리스 함수(Vercel Cron)로 분리한다.

#### Prisma — ORM

**후보군:** Prisma vs Drizzle ORM vs TypeORM vs Raw SQL

Prisma는 `schema.prisma` 파일에 데이터 모델을 선언하면 TypeScript 타입이 자동 생성되므로, 쿼리 작성 시 자동완성과 타입 체크가 가능하다. 예를 들어 `prisma.celebStyle.findMany({ include: { similarProducts: true } })`를 작성하면 반환 타입까지 자동 추론된다. 마이그레이션도 `prisma migrate dev` 한 줄로 스키마 변경이 DB에 반영된다.

Drizzle ORM은 경량이고 SQL에 가까운 API를 제공해 최근 주목받고 있지만, 생태계와 문서가 Prisma 대비 아직 성숙하지 않다. TypeORM은 데코레이터 기반으로 NestJS와 궁합이 좋지만, 단독 사용 시 설정이 복잡하고 타입 추론이 Prisma보다 약하다. Raw SQL은 유연하지만 스키마 변경 추적과 타입 안전성을 직접 관리해야 하므로 생산성이 떨어진다.

#### NextAuth.js — 인증

**후보군:** NextAuth.js vs Supabase Auth vs 직접 구현(JWT + bcrypt)

이 프로젝트에서 인증은 핵심 기능이 아니라 북마크·찜 기능을 위한 부가 기능이다. NextAuth.js는 카카오, 구글, 네이버 등 소셜 로그인 Provider를 설정 파일에 추가하는 것만으로 인증 플로우가 완성되고, 세션 관리와 CSRF 보호가 내장되어 있어 보안 고려 사항이 줄어든다.

Supabase Auth는 Supabase를 DB로 사용하고 있어 통합이 자연스럽지만, 인증 로직이 Supabase에 강하게 결합되어 나중에 DB를 교체하기 어렵다. 직접 구현은 JWT 토큰 관리, 리프레시 토큰 로테이션, 비밀번호 해싱 등을 모두 직접 작성해야 하므로 보안 취약점이 생길 가능성이 높고 개발 시간도 길어진다.

#### Puppeteer / Cheerio — 가격 수집

**후보군:** Puppeteer + Cheerio vs Playwright vs 제휴(Affiliate) API 전용

가격 정보를 수집하려면 쇼핑 플랫폼의 데이터에 접근해야 한다. 제휴 API를 제공하는 플랫폼(쿠팡 파트너스, 무신사 제휴 등)은 API를 우선 사용하되, API를 제공하지 않는 플랫폼은 웹 크롤링이 불가피하다.

Cheerio는 정적 HTML을 파싱하는 경량 라이브러리로, 서버 사이드 렌더링되는 페이지에서 빠르게 가격을 추출할 수 있다. 자바스크립트로 동적 렌더링되는 페이지에는 Puppeteer(헤드리스 Chrome)를 사용해 완전히 렌더링된 DOM에서 데이터를 가져온다. 단계적으로 Cheerio를 먼저 시도하고, 실패하면 Puppeteer로 폴백하는 전략을 사용한다.

Playwright는 Puppeteer보다 크로스 브라우저 지원이 강하지만, 가격 크롤링에는 Chrome만으로 충분하고, Puppeteer가 더 가볍고 Vercel 환경에서의 호환성 사례가 풍부하다.

---

### 5.3 데이터 & 인프라

#### PostgreSQL (Supabase) — 메인 DB

**후보군:** PostgreSQL(Supabase) vs MySQL(PlanetScale) vs MongoDB Atlas

이 프로젝트의 데이터는 카테고리-스타일-상품-구매처 간의 명확한 관계(1:N)를 가지고 있어 관계형 데이터베이스가 자연스럽다. PostgreSQL은 JSON 컬럼(tags 배열 저장), Full-Text Search(셀럽명·브랜드명 검색), 그리고 Window Function(가격 순위 산출) 등 이 프로젝트에 필요한 고급 기능을 기본 제공한다.

Supabase를 선택한 이유는 무료 티어에서 500MB 스토리지와 무제한 API 요청을 제공하고, Prisma와의 연동이 커넥션 스트링 하나로 완료되기 때문이다. PlanetScale은 MySQL 기반으로 외래 키 제약(Foreign Key)을 지원하지 않아 데이터 무결성을 애플리케이션 레벨에서 관리해야 하는 부담이 있다. MongoDB는 스키마리스 특성이 유연하지만, 상품-구매처 같은 정형 관계를 조인 없이 처리하면 데이터 중복과 일관성 문제가 발생할 수 있다.

#### Redis (Upstash) — 캐시

**후보군:** Upstash Redis vs Vercel KV vs 인메모리 캐시(node-cache)

가격 정보는 실시간으로 변동하지만, 매 요청마다 크롤링하는 것은 비효율적이고 대상 사이트에 부담을 준다. Redis에 가격 데이터를 TTL(Time-To-Live) 1~6시간으로 캐싱하면 반복 요청을 줄이면서도 적정 수준의 최신성을 유지할 수 있다.

Upstash를 선택한 이유는 서버리스 환경(Vercel)에 최적화된 HTTP 기반 Redis 클라이언트를 제공하고, 일 10,000건의 무료 요청을 제공하기 때문이다. Vercel KV는 내부적으로 Upstash를 사용하지만 Vercel 종속이 강해지는 단점이 있다. node-cache 같은 인메모리 캐시는 서버리스 함수가 매 요청마다 Cold Start 될 수 있는 Vercel 환경에서는 캐시가 유지되지 않아 실효성이 낮다.

#### Cloudinary — 이미지 저장/변환

**후보군:** Cloudinary vs AWS S3 + CloudFront vs Vercel Blob

셀럽 스타일 사진과 상품 이미지를 저장하고 서빙하는 CDN이 필요하다. Cloudinary는 업로드 시 자동으로 포맷 최적화(WebP/AVIF), 리사이즈, 크롭을 URL 파라미터만으로 처리하고, 글로벌 CDN으로 빠르게 전송한다. 무료 티어에서 월 25GB 대역폭과 25,000건의 변환을 제공해 토이 프로젝트에 충분하다.

AWS S3 + CloudFront는 확장성과 커스터마이징에서 우위지만, 이미지 변환을 위해 Lambda@Edge를 별도 구성해야 하고, AWS 계정 관리와 IAM 설정이 토이 프로젝트에는 과도하다. Vercel Blob은 파일 저장은 가능하지만 이미지 변환 기능이 없어 리사이즈/포맷 변환을 별도로 처리해야 한다.

#### Vercel — 배포 플랫폼

**후보군:** Vercel vs Netlify vs AWS Amplify vs Railway

Next.js를 만든 Vercel이 배포 플랫폼이므로 프레임워크와의 호환성이 가장 높다. Edge Network 기반 자동 CDN, Preview Deployment(PR별 미리보기 URL), 서버리스 함수 자동 배포, 환경 변수 관리 등이 설정 없이 작동한다.

Netlify는 정적 사이트에 강하지만 Next.js의 최신 기능(Server Components, Streaming SSR)을 완벽히 지원하지 않는 경우가 있다. AWS Amplify는 AWS 생태계와의 통합이 강하지만 설정이 복잡하다. Railway는 백엔드 서비스 호스팅에 적합하지만 프론트엔드 특화 기능(Edge SSR, 이미지 최적화)이 없다.

무료 티어에서 월 100GB 대역폭, 서버리스 함수 100시간 실행을 제공해 토이 프로젝트 규모에서 비용이 발생하지 않는다.

#### GitHub Actions — CI/CD

**후보군:** GitHub Actions vs GitLab CI vs CircleCI

코드를 GitHub에 호스팅할 경우 GitHub Actions가 가장 자연스러운 선택이다. Public 레포지토리는 무료이고, Private 레포지토리도 월 2,000분의 무료 실행 시간을 제공한다. Vercel은 GitHub 연동 시 Push/PR 이벤트에 자동으로 배포를 트리거하므로, CI/CD 파이프라인을 최소한의 YAML 파일로 구성할 수 있다.

린트 검사(ESLint), 타입 체크(TypeScript), 테스트(Vitest) → Vercel 자동 배포 순서의 파이프라인을 구성하면 코드 품질을 유지하면서도 배포 프로세스를 자동화할 수 있다.

---

### 5.4 기술 스택 요약 매트릭스

| 영역 | 선택 | 핵심 선정 이유 | 탈락 후보 | 탈락 사유 |
|------|------|---------------|-----------|-----------|
| 프레임워크 | Next.js 14 | SSR/SSG + API Routes 풀스택 | Vite SPA | SEO 불가, 별도 서버 필요 |
| 스타일링 | TailwindCSS | 반응형 유틸리티 내장, 빠른 개발 | styled-components | 런타임 오버헤드, RSC 비호환 |
| 상태관리 | Zustand | 경량(1KB), 셀렉터 기반 | Redux Toolkit | 과도한 보일러플레이트 |
| 이미지 | next/image | 자동 최적화, Vercel Edge 통합 | 직접 구현 | 수동 관리 비용 |
| PWA | next-pwa | 설정 최소, Workbox 자동 통합 | React Native | 별도 코드베이스 필요 |
| 런타임 | Node.js 20 | TypeScript 공유, 생태계 풍부 | Go | 학습 비용, 과도한 성능 |
| API | API Routes | 단일 프로젝트 관리, Vercel 배포 | NestJS | 구조적 오버헤드 |
| ORM | Prisma | 타입 자동 생성, 마이그레이션 | TypeORM | 설정 복잡, 타입 추론 약함 |
| 인증 | NextAuth.js | 소셜 로그인 간편 연동 | 직접 구현 | 보안 취약점 리스크 |
| 크롤링 | Cheerio + Puppeteer | 경량 우선, 동적 페이지 폴백 | Playwright | 과도한 크로스브라우저 |
| DB | PostgreSQL(Supabase) | 관계형 적합, 무료 티어 | MongoDB | 관계 데이터에 부적합 |
| 캐시 | Redis(Upstash) | 서버리스 최적화, HTTP 클라이언트 | node-cache | Cold Start 시 캐시 소멸 |
| 이미지 CDN | Cloudinary | URL 기반 변환, CDN 내장 | S3 + CloudFront | Lambda@Edge 별도 구성 |
| 배포 | Vercel | Next.js 최적 호스팅, 무료 티어 | Netlify | RSC 지원 불완전 |
| CI/CD | GitHub Actions | GitHub 통합, 무료 2,000분/월 | CircleCI | 별도 서비스 관리 |

---

## 6. API 설계 (주요 엔드포인트)

### 6.1 카테고리

```
GET  /api/categories              // 전체 카테고리 트리 조회
GET  /api/categories/:id/styles   // 특정 카테고리의 셀럽 스타일 목록
```

### 6.2 셀럽 스타일

```
GET  /api/styles                  // 스타일 목록 (필터: category, gender, tags, season)
GET  /api/styles/:id              // 스타일 상세
GET  /api/styles/:id/products     // 해당 스타일의 유사 상품 목록
```

### 6.3 상품 비교

```
GET  /api/products/:id            // 상품 상세
GET  /api/products/:id/links      // 구매 가능 플랫폼 목록 (가격 포함)
```

### 6.4 검색

```
GET  /api/search?q=...&type=...   // 통합 검색 (셀럽명, 브랜드명, 상품명)
```

---

## 7. 모바일 대응 전략

### 7.1 Mobile-First 반응형

TailwindCSS의 기본 breakpoint 체계를 활용하여 모바일(기본) → 태블릿(md) → 데스크톱(lg) 순서로 설계한다.

| 화면 | 모바일 (< 768px) | 데스크톱 (≥ 1024px) |
|------|-------------------|---------------------|
| 카테고리 | 아이콘 그리드 (3열) | 사이드바 + 아이콘 (4열) |
| 스타일 목록 | 카드 그리드 (2열) | 카드 그리드 (4열) |
| 상품 비교 | 수직 카드 리스트 | 수평 카드 그리드 (3열) |
| 구매처 | 풀 너비 리스트 | 테이블 형태 |

### 7.2 PWA 적용

서비스 워커를 통한 오프라인 캐싱, 홈 화면 추가(Add to Home Screen), 푸시 알림(가격 변동 알림) 기능을 단계적으로 적용한다.

### 7.3 성능 최적화

- next/image를 활용한 이미지 lazy loading 및 자동 포맷 최적화
- Intersection Observer 기반 무한 스크롤
- React Server Components로 초기 번들 사이즈 최소화
- Redis 캐싱으로 가격 API 응답 속도 개선 (TTL: 1~6시간)

---

## 8. 프로젝트 디렉토리 구조

```
aideals/
├── prisma/
│   └── schema.prisma
├── public/
│   └── icons/
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx                  // 홈 (카테고리 선택)
│   │   ├── styles/
│   │   │   ├── page.tsx              // 스타일 목록
│   │   │   └── [id]/
│   │   │       └── page.tsx          // 스타일 상세 → 유사 상품
│   │   ├── products/
│   │   │   └── [id]/
│   │   │       └── page.tsx          // 상품 상세 → 구매처
│   │   └── api/
│   │       ├── categories/
│   │       ├── styles/
│   │       ├── products/
│   │       └── search/
│   ├── components/
│   │   ├── ui/                       // 공통 UI (Button, Card, Modal 등)
│   │   ├── CategoryGrid.tsx
│   │   ├── StyleCard.tsx
│   │   ├── ProductCompareCard.tsx
│   │   └── PurchaseLinkList.tsx
│   ├── lib/
│   │   ├── prisma.ts
│   │   ├── redis.ts
│   │   └── scraper/                  // 가격 크롤링 모듈
│   ├── stores/
│   │   └── useFilterStore.ts
│   └── types/
│       └── index.ts
├── tailwind.config.ts
├── next.config.js
└── package.json
```

---

## 9. 개발 로드맵

| 단계 | 기간 | 범위 |
|------|------|------|
| **Phase 1 — MVP** | 2주 | 카테고리 선택 → 셀럽 스타일 목록 (목 데이터 기반), 반응형 UI 완성 |
| **Phase 2 — 핵심 기능** | 2주 | DB 연동, 유사 상품 비교 화면, 구매처 목록, 검색 기능 |
| **Phase 3 — 데이터 확장** | 2주 | 가격 크롤러 구현, 실제 플랫폼 연동, 관리자 페이지(콘텐츠 등록) |
| **Phase 4 — 고도화** | 2주 | PWA 적용, 가격 변동 알림, 북마크/찜 기능, 소셜 로그인 |

---

## 10. 향후 확장 고려사항

- **이미지 유사도 검색**: 사용자가 사진을 업로드하면 유사한 셀럽 스타일을 찾아주는 기능 (TensorFlow.js 또는 외부 Vision API 활용)
- **가격 추적 알림**: 특정 상품의 가격이 목표가 이하로 내려가면 푸시 알림 발송
- **커뮤니티 기능**: 사용자 스타일 공유, 코디 투표
- **제휴 수익화**: 구매 링크에 어필리에이트 파라미터 삽입으로 수익 모델 확보
- **AI 추천**: 사용자 탐색 이력 기반 개인화 스타일 추천 (협업 필터링)
