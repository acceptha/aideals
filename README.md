# aideals — 패션 비교 플랫폼

사용자가 의류 카테고리를 선택하면 셀럽/인플루언서 착용 사진을 탐색하고, 유사 상품을 브랜드·가격별로 비교한 뒤, 최저가 구매처까지 확인할 수 있는 모바일 우선(Mobile-First) 웹 애플리케이션.

```
카테고리 선택 → 셀럽 스타일 탐색 → 유사 상품 비교 → 구매처 확인
```

---

## 기술 스택

| 영역 | 기술 |
|------|------|
| 프레임워크 | Next.js 15 (App Router) |
| 언어 | TypeScript 5 |
| 스타일링 | TailwindCSS 3 |
| 상태관리 | Zustand |
| ORM | Prisma 5 |
| DB | PostgreSQL (Supabase) |
| 캐시 | Redis (Upstash) |
| 인증 | NextAuth.js |
| 이미지 CDN | Cloudinary |
| 배포 | Vercel |

---

## 시작하기

### 1. 설치

```bash
npm install
```

### 2. 환경 변수

`.env.example`을 `.env`로 복사하고 값을 채운다.

```bash
cp .env.example .env
```

### 3. DB 설정

```bash
npx prisma migrate dev --name init
npx prisma db seed
```

### 4. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

---

## 자주 쓰는 명령어

```bash
# 개발
npm run dev                              # 개발 서버
npm run build                            # 프로덕션 빌드
npm start                                # 프로덕션 실행

# 커밋
npm run commit                           # 스마트 커밋 (commit + push)
npm run commit:only                      # 스마트 커밋 (commit만)

# Prisma
npx prisma migrate dev --name <설명>      # 마이그레이션
npx prisma generate                       # 클라이언트 재생성
npx prisma studio                         # DB GUI
npx prisma db seed                        # 시드 데이터

# 테스트
npx vitest run                            # 전체 테스트 실행

# 품질
npm run lint                              # ESLint
npx tsc --noEmit                          # 타입 체크
```

---

## 디렉토리 구조

```
aideals/
├── prisma/
│   └── schema.prisma              # 데이터 모델 정의
├── scripts/
│   └── commit.sh                  # 인터랙티브 스마트 커밋 스크립트
├── src/
│   ├── app/
│   │   ├── layout.tsx             # 루트 레이아웃
│   │   ├── page.tsx               # 홈 — 카테고리 선택
│   │   ├── styles/                # 셀럽 스타일 목록/상세
│   │   ├── products/              # 상품 상세/구매처
│   │   └── api/                   # API Routes
│   ├── components/                # UI 컴포넌트
│   ├── lib/                       # Prisma, Redis, 데이터 계층, 크롤러 등
│   ├── stores/                    # Zustand 스토어
│   └── types/                     # 공유 타입 정의
├── .env.example                   # 환경 변수 템플릿
├── claude.md                      # Claude Code 가이드
├── COMMIT_CONVENTION.md           # 커밋 컨벤션 상세
└── package.json
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
| 카테고리 (CATEGORY) | Redis | 24시간 (86400s) | 관리자 수정 시 무효화 |
| 스타일/상품 목록 (LIST) | Redis | 5분 (300s) | 신규 등록 시 무효화 |
| 스타일 상세 (STYLE_DETAIL) | Redis | 10분 (600s) | 데이터 변경 시 무효화 |
| 상품 상세 (PRODUCT_DETAIL) | Redis | 10분 (600s) | 데이터 변경 시 무효화 |
| 가격 정보 (PRICE) | Redis | 3분 (180s) | 크롤러 재수집 시 갱신 |

---

## 개발 로드맵

### Phase 1 — MVP (2주)
- [x] Next.js 프로젝트 초기 설정
- [x] Prisma 스키마 정의 및 Supabase 연동
- [x] 목(mock) 데이터 시드 작성
- [x] CategoryGrid + 홈 페이지
- [x] StyleCard + 스타일 목록 페이지
- [x] 반응형 레이아웃 완성

### Phase 2 — 핵심 기능 (2주)
- [x] API Routes 구현
- [x] ProductCompareCard + 스타일 상세 페이지
- [x] PurchaseLinkList + 상품 상세 페이지
- [x] FilterBar + Zustand + URL 동기화
- [x] 통합 검색

### Phase 3 — 데이터 확장 (2주)
- [ ] 가격 크롤러 (Cheerio + Puppeteer)
- [x] Upstash Redis 캐싱
- [ ] Cloudinary 이미지 파이프라인
- [ ] 관리자 페이지

### Phase 4 — 고도화 (2주)
- [ ] PWA 적용
- [ ] 소셜 로그인 (카카오, 구글)
- [ ] 북마크/찜
- [ ] 가격 변동 알림
- [ ] GitHub Actions CI/CD
