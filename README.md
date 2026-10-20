# aideals — 패션 비교 플랫폼

사용자가 의류 카테고리를 선택하면 셀럽/인플루언서 착용 사진을 탐색하고, 유사 상품을 브랜드·가격별로 비교한 뒤, 최저가 구매처까지 확인할 수 있는 모바일 우선(Mobile-First) 웹 애플리케이션.

**운영:** https://aideals-ten.vercel.app

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
| 캐시 | Redis (Upstash, 선택 — 없으면 DB 직접 조회) |
| 인증 | NextAuth.js v5 (카카오, 구글) |
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

로컬 개발 DB는 Docker로 띄운다. `.env`의 `DATABASE_URL`/`DIRECT_URL`을 이 DB로 지정한다.

```bash
docker run -d --name aideals-postgres --restart unless-stopped \
  -e POSTGRES_PASSWORD=<비밀번호> -e POSTGRES_DB=aideals \
  -v aideals-pgdata:/var/lib/postgresql/data -p 5433:5432 postgres:16-alpine
# DATABASE_URL="postgresql://postgres:<비밀번호>@localhost:5433/aideals"

npx prisma migrate deploy   # 기존 마이그레이션 적용 (새 DB 포함)
npx prisma db seed
```

> 스키마를 바꿨다면 운영 Supabase에도 `prisma migrate deploy`를 적용해야 한다 (아래 "배포" 참고).

### 3-1. 관리자 지정

`/login`에서 한 번 로그인한 뒤, 해당 계정에 관리자 권한을 부여한다.
카카오는 이메일 동의 항목이 없으면 email이 비어 있으므로 `--list`로 id를 확인해 지정한다.

```bash
npm run set-admin -- --list              # 가입자 목록 (id, email, role)
npm run set-admin -- <email|userId>      # 관리자 권한 부여
npm run set-admin -- <email|userId> --revoke
```

### 4. 개발 서버

```bash
npm run dev
```

[http://localhost:3000](http://localhost:3000)에서 확인.

---

## 배포

- **Vercel** 프로젝트 `aideals` — GitHub `main`에 push하면 자동 배포된다. 함수 리전은 DB와 같은 `hnd1`(도쿄) (`vercel.json`)
- **DB**: Supabase `aideals` (ap-northeast-1). 무료 플랜은 장기 미사용 시 정지되므로, 운영에서 500이 나면 먼저 프로젝트 상태를 확인한다
- **환경변수**: Vercel 프로젝트 설정에서 관리한다. `NEXTAUTH_SECRET`·`CRON_SECRET`은 로컬 값과 별도로 생성한 값을 쓴다
- **스키마 반영**: Vercel 빌드는 마이그레이션을 실행하지 않는다. 운영 DB URL을 지정해 직접 적용한다

```bash
DATABASE_URL="<Supabase pooler 6543>" DIRECT_URL="<Supabase 5432>" npx prisma migrate deploy
```

- **보안**: public 테이블은 모두 RLS가 켜져 있다 (정책 없음 → Supabase REST API 직접 접근 차단). 앱은 Prisma로 테이블 소유자 계정을 사용하므로 영향이 없다. 새 테이블을 추가하는 마이그레이션에는 `ENABLE ROW LEVEL SECURITY`를 함께 넣는다

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

# 운영
npm run crawl                            # 가격 크롤러 수동 실행
npm run validate-env                     # 환경변수 + DB 연결 검증

# Prisma
npx prisma migrate dev --name <설명>      # 마이그레이션
npx prisma generate                       # 클라이언트 재생성
npx prisma studio                         # DB GUI
npx prisma db seed                        # 시드 데이터
npm run set-admin -- <email|userId>       # 관리자 권한 부여 (--list, --revoke)

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
│   ├── schema.prisma              # 데이터 모델 정의
│   ├── migrations/                # 마이그레이션 (RLS 포함)
│   └── seed.ts                    # 시드 (upsert 멱등)
├── scripts/
│   ├── commit.sh                  # 인터랙티브 스마트 커밋 스크립트
│   ├── set-admin.ts               # 관리자 권한 부여/회수
│   ├── crawl-prices.ts            # 가격 크롤러 CLI
│   └── validate-env.ts            # 환경변수 검증
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
├── CLAUDE.md                      # Claude Code 가이드
├── PROJECT_RULES.md               # 테스트·환경변수·커밋·에러 코드 규칙
├── HANDOFF.md                     # 진행 상태 / 운영 환경 / 남은 작업
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

- Upstash 환경변수가 없으면 캐시를 건너뛰고 DB를 직접 조회한다.
- Redis 호출이 실패하면 30초 동안 캐시를 건너뛴다 (서킷 브레이커). Redis 장애가 응답 지연으로 번지지 않게 하기 위함이다.

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
- [x] 가격 크롤러 (Cheerio, 무신사/29CM/W컨셉 + Vercel Cron)
- [x] Upstash Redis 캐싱
- [x] Cloudinary 이미지 파이프라인
- [x] 관리자 페이지 (CRUD + Unsplash 이미지 검색)

### Phase 4 — 고도화 (2주)
- [x] PWA 적용
- [x] 소셜 로그인 (카카오, 구글)
- [ ] 북마크/찜
- [ ] 가격 변동 알림
- [ ] GitHub Actions CI/CD
