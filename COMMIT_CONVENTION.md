# Git Commit Message Convention — aideals

> Claude Code로 개발 시 반드시 이 규칙에 맞춰 커밋 메시지를 작성한다.
> `.git/hooks/commit-msg` 훅이 자동으로 규칙을 검증한다.

---

## 커밋 메시지 형식

```
<type>(<scope>): <subject>

[body]

[footer]
```

### 예시

```
feat(style): 셀럽 스타일 목록 필터링 기능 구현

- 성별, 시즌, 태그 기반 필터 추가
- useFilterStore와 URL 쿼리 파라미터 동기화
- Intersection Observer 기반 무한 스크롤 적용

Phase: 2
```

---

## Type (필수)

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

---

## Scope (필수)

프로젝트의 도메인 모듈 또는 기술 영역을 나타낸다.

### 도메인 Scope

| Scope | 대상 |
|-------|------|
| `category` | 카테고리 트리, CategoryGrid, `/api/categories` |
| `style` | 셀럽 스타일, StyleCard, FilterBar, `/api/styles` |
| `product` | 유사 상품 비교, ProductCompareCard, `/api/products` |
| `purchase` | 구매처 목록, PurchaseLinkList, `/api/products/:id/links` |
| `search` | 통합 검색, SearchBar, `/api/search` |

### 기술 Scope

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

---

## Subject (필수)

- 한글로 작성한다
- 50자 이내로 간결하게 작성한다
- 마침표를 붙이지 않는다
- 명령형으로 작성한다 (예: "추가", "수정", "제거", "개선")

---

## Body (선택)

- Subject만으로 설명이 부족할 때 작성한다
- 무엇을, 왜 변경했는지 설명한다
- 각 항목은 `-`로 시작한다
- 한 줄은 72자 이내로 작성한다

---

## Footer (선택)

- `Phase: 1~4` — 개발 로드맵 단계 표기
- `Breaking:` — 호환성이 깨지는 변경 사항
- `Closes: #이슈번호` — 관련 이슈 닫기
- `Related: #이슈번호` — 관련 이슈 참조

---

## 커밋 메시지 예시 모음

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
feat(scraper): Puppeteer 동적 페이지 폴백 크롤러 추가
perf(cache): Upstash Redis 가격 캐싱 적용
feat(image): Cloudinary 이미지 업로드 파이프라인 구현

# Phase 4 — 고도화
feat(pwa): next-pwa 서비스 워커 및 오프라인 캐싱 적용
feat(auth): NextAuth.js 카카오/구글 소셜 로그인 연동
ci(cicd): GitHub Actions lint/typecheck/test 파이프라인 구성

# 일반
fix(product): 가격순 정렬 시 null 가격 처리 오류 수정
refactor(store): useFilterStore 셀렉터 패턴 개선
style(ui): Button 컴포넌트 ESLint 규칙 적용
docs(api): 스타일 API 엔드포인트 명세 추가
chore(deps): zustand 4.5.0 버전 업데이트
```
