# 데이터 모델 상세

> DB 관련 작업 시 이 문서와 `prisma/schema.prisma`(원본)를 함께 참조한다.
> 스키마 구조는 반드시 `prisma/schema.prisma`를 기준으로 한다 (이 문서에 스키마를 복사하지 않는다).

---

## 핵심 엔티티 & 관계

```
Category ──1:N──▶ CelebStyle ──1:N──▶ SimilarProduct ──1:N──▶ PurchaseLink
```

- Category는 대분류 6개(아우터, 상의, 하의, 원피스/스커트, 신발, 가방)만 존재. 세부 카테고리(소분류) 없음.

---

## 비즈니스 규칙

- `gender` 허용 값: `"male"` | `"female"`
- `season` 허용 값: `"spring"` | `"summer"` | `"fall"` | `"winter"` (시즌 자동 정렬용, 필터 UI 노출 안 함)
- `colors`는 문자열 배열 (예: `["블랙", "화이트", "베이지"]`)
- `currency` 기본값: `"KRW"`
- `similarityScore` 범위: 0~1
- `inStock` 기본값: `true`
- `sortOrder`는 카테고리 표시 순서 (낮을수록 먼저 표시)
- CelebStyle 출처 메타데이터(`sourceUrl`, `photographer`, `sourceName`, `licenseType`)는 모두 nullable. `photographer`와 `sourceName`이 둘 다 있을 때만 스타일 상세에 "Photo: 작가 / 소스"로 표기
- User `role` 허용 값: `"user"`(기본) | `"admin"`. 관리자 지정은 `npm run set-admin`
- PurchaseLink `productUrl`이 검색 결과 페이지(`/search`, `searchResult`)면 크롤러가 가격을 갱신하지 않는다 (`isSearchPageUrl`)

---

## 테이블 매핑

| 모델 | DB 테이블명 |
|------|------------|
| Category | `categories` |
| CelebStyle | `celeb_styles` |
| SimilarProduct | `similar_products` |
| PurchaseLink | `purchase_links` |
| User / Account / Session / VerificationToken | `users` / `accounts` / `sessions` / `verification_tokens` (NextAuth Prisma Adapter) |

---

## 보안 (RLS)

- public 스키마의 모든 테이블은 RLS가 켜져 있고 정책은 없다 → Supabase REST API(anon/publishable 키)로는 읽기·쓰기 모두 불가
- 앱은 Prisma로 테이블 소유자(`postgres`) 계정을 사용해 RLS 영향을 받지 않는다
- 새 테이블을 추가하는 마이그레이션에는 `ALTER TABLE "<table>" ENABLE ROW LEVEL SECURITY;`를 함께 넣는다
