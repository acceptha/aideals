# API 엔드포인트 상세

> API Route 작업 시 이 문서를 참조한다.
> API 패턴(withErrorHandler, 응답 포맷 등)은 `CLAUDE.md`의 코드 패턴 가이드 섹션 참조.
> 쿼리 파라미터는 각 라우트의 `parseQueryParams` 규칙이 원본이다. 규칙에 없는 값은 400(`INVALID_FILTER_VALUE` 등)으로 거부된다.

---

## 카테고리

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/categories` | 카테고리 목록 (대분류 6개) | - |
| GET | `/api/categories/:id/styles` | 특정 카테고리의 셀럽 스타일 목록 | `gender` (male, female), `color`, `page` (기본 1), `limit` (기본 20, 최대 100) |

## 셀럽 스타일

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/styles` | 스타일 목록 (필터링, 시즌 자동 정렬) | `categoryId`, `gender` (male, female), `color`, `page`, `limit`, `sort` (createdAt_desc, celebName_asc) |
| GET | `/api/styles/:id` | 스타일 상세 정보 | - |
| GET | `/api/styles/:id/products` | 해당 스타일의 유사 상품 목록 | `sort` (price, brand, similarity) |

## 상품

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/products/:id` | 상품 상세 정보 | - |
| GET | `/api/products/:id/links` | 구매 가능 플랫폼 목록 | `sort` (price) |

## 검색

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/search` | 통합 검색 | `q` (검색어, 필수), `type` (celeb, brand, product) |

## 관리자 / 운영

| 메서드 | 경로 | 인증 | 설명 |
|--------|------|------|------|
| POST | `/api/admin/upload` | `Authorization: Bearer <CRON_SECRET>` | 이미지 파일을 Cloudinary에 업로드 (multipart: `file`, `folder`, `tags`) |
| GET | `/api/admin/images/search` | 관리자 세션 | Unsplash 이미지 검색 (`q` 필수, `page`, `perPage` 최대 30). 키 미설정 시 503 |
| POST | `/api/admin/images/import` | 관리자 세션 | 외부 이미지 URL을 Cloudinary로 복사하고 출처 메타데이터 반환 (JSON: `imageUrl`, `sourceUrl`, `photographer`, `sourceName`, `licenseType?`, `folder?`, `downloadTracker?`) |
| GET | `/api/cron/crawl` | `Authorization: Bearer <CRON_SECRET>` | 가격 크롤링 (Vercel Cron 매일 00:00 UTC). 검색 페이지 URL 링크는 건너뜀 |
| GET/POST | `/api/auth/[...nextauth]` | - | NextAuth.js (카카오/구글). 환경변수가 설정된 프로바이더만 활성 |

- 관리자 세션 API는 비로그인 시 401(`AUTH_REQUIRED`), 일반 사용자는 403(`AUTH_FORBIDDEN`)
- 관리자 CRUD는 API가 아닌 Server Actions(`src/app/admin/actions.ts`)로 처리한다
