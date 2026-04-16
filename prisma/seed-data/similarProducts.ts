// prisma/seed-data/similarProducts.ts
// 주요 스타일에 유사 상품 2~4개씩

export const SEED_SIMILAR_PRODUCTS = [
  // ── style-001 (제니 아우터) → 4개 ──
  {
    id: "seed-prod-001",
    styleId: "seed-style-001",
    brandName: "ZARA",
    productName: "오버사이즈 울 코트",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147126/aideals/products/kom9qbemajdw73poaytr.svg",
    representativePrice: 189000,
    similarityScore: 0.92,
  },
  {
    id: "seed-prod-002",
    styleId: "seed-style-001",
    brandName: "H&M",
    productName: "클래식 울 블렌드 코트",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147128/aideals/products/yciiqqkitvnrr0mlhtm9.svg",
    representativePrice: 129000,
    similarityScore: 0.85,
  },
  {
    id: "seed-prod-003",
    styleId: "seed-style-001",
    brandName: "무신사 스탠다드",
    productName: "싱글 브레스티드 코트",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147130/aideals/products/msyrlutitjwb4zajmx02.svg",
    representativePrice: 89000,
    similarityScore: 0.78,
  },
  {
    id: "seed-prod-004",
    styleId: "seed-style-001",
    brandName: "COS",
    productName: "벨티드 울 코트",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147132/aideals/products/u1twe4ezbyk2nlu4ge3b.svg",
    representativePrice: 350000,
    similarityScore: 0.95,
  },

  // ── style-005 (아이유 상의) → 3개 ──
  {
    id: "seed-prod-005",
    styleId: "seed-style-005",
    brandName: "UNIQLO",
    productName: "수피마 코튼 크루넥 티",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147136/aideals/products/t84xxqaqjjek2jd4azkd.svg",
    representativePrice: 19900,
    similarityScore: 0.88,
  },
  {
    id: "seed-prod-006",
    styleId: "seed-style-005",
    brandName: "8SECONDS",
    productName: "레이스 트림 블라우스",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147138/aideals/products/xz1sxy06qp88vcb8kkoj.svg",
    representativePrice: 39900,
    similarityScore: 0.82,
  },
  {
    id: "seed-prod-007",
    styleId: "seed-style-005",
    brandName: "MANGO",
    productName: "플라워 프린트 셔츠",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147141/aideals/products/c4xauys94ifq7uim86jc.svg",
    representativePrice: 59900,
    similarityScore: 0.76,
  },

  // ── style-009 (수지 하의) → 2개 ──
  {
    id: "seed-prod-008",
    styleId: "seed-style-009",
    brandName: "리바이스",
    productName: "501 오리지널 스트레이트 진",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147142/aideals/products/hu5ydxpcuwmvgc6xetyh.svg",
    representativePrice: 109000,
    similarityScore: 0.91,
  },
  {
    id: "seed-prod-009",
    styleId: "seed-style-009",
    brandName: "무신사 스탠다드",
    productName: "와이드 데님 팬츠",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147144/aideals/products/k04mhf3hzlhki3ya2mbb.svg",
    representativePrice: 49900,
    similarityScore: 0.84,
  },

  // ── style-012 (윈터 원피스) → 2개 ──
  {
    id: "seed-prod-010",
    styleId: "seed-style-012",
    brandName: "ZARA",
    productName: "플로럴 미디 원피스",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147147/aideals/products/pm3i5s7iudrarhbrknym.svg",
    representativePrice: 79900,
    similarityScore: 0.87,
  },
  {
    id: "seed-prod-011",
    styleId: "seed-style-012",
    brandName: "H&M",
    productName: "A라인 코튼 원피스",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147149/aideals/products/d1rgrwxxvklbqaxcw2xj.svg",
    representativePrice: 49900,
    similarityScore: 0.79,
  },

  // ── style-018 (지수 가방) → 2개 ──
  {
    id: "seed-prod-012",
    styleId: "seed-style-018",
    brandName: "마르니",
    productName: "트렁크 미디엄 숄더백",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147151/aideals/products/wyicfsanxvf6z2rlm8c8.svg",
    representativePrice: 890000,
    similarityScore: 0.93,
  },
  {
    id: "seed-prod-013",
    styleId: "seed-style-018",
    brandName: "마뗑킴",
    productName: "에코백 라지",
    productImageUrl: "https://res.cloudinary.com/dpemndoq8/image/upload/v1776147153/aideals/products/yu1cyvoji9syzvpfwaie.svg",
    representativePrice: 68000,
    similarityScore: 0.72,
  },
];
