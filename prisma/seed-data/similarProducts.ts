// prisma/seed-data/similarProducts.ts
// 주요 스타일에 유사 상품 2~4개씩

export const SEED_SIMILAR_PRODUCTS = [
  // ── style-001 (제니 아우터) → 4개 ──
  {
    id: "seed-prod-001",
    styleId: "seed-style-001",
    brandName: "ZARA",
    productName: "오버사이즈 울 코트",
    productImageUrl: "https://placehold.co/300x400/e8e0d4/333?text=ZARA+Coat",
    representativePrice: 189000,
    similarityScore: 0.92,
  },
  {
    id: "seed-prod-002",
    styleId: "seed-style-001",
    brandName: "H&M",
    productName: "클래식 울 블렌드 코트",
    productImageUrl: "https://placehold.co/300x400/d4d4e8/333?text=HM+Coat",
    representativePrice: 129000,
    similarityScore: 0.85,
  },
  {
    id: "seed-prod-003",
    styleId: "seed-style-001",
    brandName: "무신사 스탠다드",
    productName: "싱글 브레스티드 코트",
    productImageUrl: "https://placehold.co/300x400/d4e8d4/333?text=Musinsa+Coat",
    representativePrice: 89000,
    similarityScore: 0.78,
  },
  {
    id: "seed-prod-004",
    styleId: "seed-style-001",
    brandName: "COS",
    productName: "벨티드 울 코트",
    productImageUrl: "https://placehold.co/300x400/e8d4d4/333?text=COS+Coat",
    representativePrice: 350000,
    similarityScore: 0.95,
  },

  // ── style-005 (아이유 상의) → 3개 ──
  {
    id: "seed-prod-005",
    styleId: "seed-style-005",
    brandName: "UNIQLO",
    productName: "수피마 코튼 크루넥 티",
    productImageUrl: "https://placehold.co/300x400/f0e0f0/333?text=UNIQLO+Tee",
    representativePrice: 19900,
    similarityScore: 0.88,
  },
  {
    id: "seed-prod-006",
    styleId: "seed-style-005",
    brandName: "8SECONDS",
    productName: "레이스 트림 블라우스",
    productImageUrl: "https://placehold.co/300x400/e0f0e0/333?text=8SEC+Blouse",
    representativePrice: 39900,
    similarityScore: 0.82,
  },
  {
    id: "seed-prod-007",
    styleId: "seed-style-005",
    brandName: "MANGO",
    productName: "플라워 프린트 셔츠",
    productImageUrl: "https://placehold.co/300x400/f0f0e0/333?text=MANGO+Shirt",
    representativePrice: 59900,
    similarityScore: 0.76,
  },

  // ── style-009 (수지 하의) → 2개 ──
  {
    id: "seed-prod-008",
    styleId: "seed-style-009",
    brandName: "리바이스",
    productName: "501 오리지널 스트레이트 진",
    productImageUrl: "https://placehold.co/300x400/d4d4f0/333?text=Levis+501",
    representativePrice: 109000,
    similarityScore: 0.91,
  },
  {
    id: "seed-prod-009",
    styleId: "seed-style-009",
    brandName: "무신사 스탠다드",
    productName: "와이드 데님 팬츠",
    productImageUrl: "https://placehold.co/300x400/e0e0d4/333?text=Musinsa+Denim",
    representativePrice: 49900,
    similarityScore: 0.84,
  },

  // ── style-012 (윈터 원피스) → 2개 ──
  {
    id: "seed-prod-010",
    styleId: "seed-style-012",
    brandName: "ZARA",
    productName: "플로럴 미디 원피스",
    productImageUrl: "https://placehold.co/300x400/f0d4d4/333?text=ZARA+Dress",
    representativePrice: 79900,
    similarityScore: 0.87,
  },
  {
    id: "seed-prod-011",
    styleId: "seed-style-012",
    brandName: "H&M",
    productName: "A라인 코튼 원피스",
    productImageUrl: "https://placehold.co/300x400/d4f0e0/333?text=HM+Dress",
    representativePrice: 49900,
    similarityScore: 0.79,
  },

  // ── style-018 (지수 가방) → 2개 ──
  {
    id: "seed-prod-012",
    styleId: "seed-style-018",
    brandName: "마르니",
    productName: "트렁크 미디엄 숄더백",
    productImageUrl: "https://placehold.co/300x400/e8e0e8/333?text=Marni+Bag",
    representativePrice: 890000,
    similarityScore: 0.93,
  },
  {
    id: "seed-prod-013",
    styleId: "seed-style-018",
    brandName: "마뗑킴",
    productName: "에코백 라지",
    productImageUrl: "https://placehold.co/300x400/d4e0e8/333?text=Matin+Bag",
    representativePrice: 68000,
    similarityScore: 0.72,
  },
];
