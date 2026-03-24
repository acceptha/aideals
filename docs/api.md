# API 엔드포인트 상세

> API Route 작업 시 이 문서를 참조한다.
> API 패턴(withErrorHandler, 응답 포맷 등)은 `claude.md`의 코드 패턴 가이드 섹션 참조.

---

## 카테고리

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/categories` | 전체 카테고리 트리 조회 | - |
| GET | `/api/categories/:id/styles` | 특정 카테고리의 셀럽 스타일 목록 | `gender`, `season`, `tags`, `page`, `limit` |

## 셀럽 스타일

| 메서드 | 경로 | 설명 | 쿼리 파라미터 |
|--------|------|------|---------------|
| GET | `/api/styles` | 스타일 목록 (필터링) | `categoryId`, `gender`, `season`, `tags`, `page`, `limit`, `sort` |
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
| GET | `/api/search` | 통합 검색 | `q` (검색어), `type` (celeb, brand, product) |
