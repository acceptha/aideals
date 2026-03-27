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

---

## 테이블 매핑

| 모델 | DB 테이블명 |
|------|------------|
| Category | `categories` |
| CelebStyle | `celeb_styles` |
| SimilarProduct | `similar_products` |
| PurchaseLink | `purchase_links` |
