// src/lib/mockData.ts
// Phase 1 목 데이터 — DB 없이 UI 개발용

import type { Category, CelebStyle, SimilarProduct, PurchaseLink } from "@/types";

export const MOCK_CATEGORIES: Category[] = [
  { id: "cat-outer", name: "아우터", iconUrl: null, sortOrder: 1 },
  { id: "cat-top", name: "상의", iconUrl: null, sortOrder: 2 },
  { id: "cat-bottom", name: "하의", iconUrl: null, sortOrder: 3 },
  { id: "cat-dress", name: "원피스/스커트", iconUrl: null, sortOrder: 4 },
  { id: "cat-shoes", name: "신발", iconUrl: null, sortOrder: 5 },
  { id: "cat-bag", name: "가방", iconUrl: null, sortOrder: 6 },
];

export const MOCK_STYLES: CelebStyle[] = [
  {
    id: "style-001",
    celebName: "제니",
    imageUrl: "https://placehold.co/400x500/f0e6d3/333?text=Style+001",
    categoryId: "cat-outer",
    colors: ["블랙", "화이트"],
    gender: "female",
    season: "spring",
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "style-002",
    celebName: "로제",
    imageUrl: "https://placehold.co/400x500/d3e6f0/333?text=Style+002",
    categoryId: "cat-outer",
    colors: ["베이지", "브라운"],
    gender: "female",
    season: "fall",
    createdAt: new Date("2026-01-02"),
  },
  {
    id: "style-003",
    celebName: "뷔",
    imageUrl: "https://placehold.co/400x500/d3f0e6/333?text=Style+003",
    categoryId: "cat-outer",
    colors: ["네이비", "블랙"],
    gender: "male",
    season: "winter",
    createdAt: new Date("2026-01-03"),
  },
  {
    id: "style-004",
    celebName: "아이유",
    imageUrl: "https://placehold.co/400x500/f0d3e6/333?text=Style+004",
    categoryId: "cat-top",
    colors: ["화이트", "핑크"],
    gender: "female",
    season: "winter",
    createdAt: new Date("2026-01-04"),
  },
  {
    id: "style-005",
    celebName: "지민",
    imageUrl: "https://placehold.co/400x500/e6f0d3/333?text=Style+005",
    categoryId: "cat-top",
    colors: ["블랙", "그레이"],
    gender: "male",
    season: "spring",
    createdAt: new Date("2026-01-05"),
  },
  {
    id: "style-006",
    celebName: "수지",
    imageUrl: "https://placehold.co/400x500/f0f0d3/333?text=Style+006",
    categoryId: "cat-dress",
    colors: ["레드", "화이트"],
    gender: "female",
    season: "summer",
    createdAt: new Date("2026-01-06"),
  },
  {
    id: "style-007",
    celebName: "차은우",
    imageUrl: "https://placehold.co/400x500/d3d3f0/333?text=Style+007",
    categoryId: "cat-bottom",
    colors: ["블루", "네이비"],
    gender: "male",
    season: "fall",
    createdAt: new Date("2026-01-07"),
  },
  {
    id: "style-008",
    celebName: "블랙핑크 리사",
    imageUrl: "https://placehold.co/400x500/f0d3d3/333?text=Style+008",
    categoryId: "cat-shoes",
    colors: ["화이트", "그린"],
    gender: "female",
    season: "summer",
    createdAt: new Date("2026-01-08"),
  },
];

export const MOCK_SIMILAR_PRODUCTS: SimilarProduct[] = [
  {
    id: "prod-001",
    styleId: "style-001",
    brandName: "ZARA",
    productName: "오버사이즈 울 코트",
    productImageUrl: "https://placehold.co/300x400/e8e0d4/333?text=ZARA+Coat",
    representativePrice: 189000,
    similarityScore: 0.92,
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "prod-002",
    styleId: "style-001",
    brandName: "H&M",
    productName: "클래식 울 블렌드 코트",
    productImageUrl: "https://placehold.co/300x400/d4d4e8/333?text=HM+Coat",
    representativePrice: 129000,
    similarityScore: 0.85,
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "prod-003",
    styleId: "style-001",
    brandName: "무신사 스탠다드",
    productName: "싱글 브레스티드 코트",
    productImageUrl: "https://placehold.co/300x400/d4e8d4/333?text=Musinsa+Coat",
    representativePrice: 89000,
    similarityScore: 0.78,
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "prod-004",
    styleId: "style-001",
    brandName: "COS",
    productName: "벨티드 울 코트",
    productImageUrl: "https://placehold.co/300x400/e8d4d4/333?text=COS+Coat",
    representativePrice: 350000,
    similarityScore: 0.95,
    createdAt: new Date("2026-01-10"),
  },
  {
    id: "prod-005",
    styleId: "style-004",
    brandName: "UNIQLO",
    productName: "수피마 코튼 크루넥 티",
    productImageUrl: "https://placehold.co/300x400/f0e0f0/333?text=UNIQLO+Tee",
    representativePrice: 19900,
    similarityScore: 0.88,
    createdAt: new Date("2026-01-11"),
  },
  {
    id: "prod-006",
    styleId: "style-004",
    brandName: "8SECONDS",
    productName: "레이스 트림 블라우스",
    productImageUrl: "https://placehold.co/300x400/e0f0e0/333?text=8SEC+Blouse",
    representativePrice: 39900,
    similarityScore: 0.82,
    createdAt: new Date("2026-01-11"),
  },
];

export const MOCK_PURCHASE_LINKS: PurchaseLink[] = [
  {
    id: "link-001",
    productId: "prod-001",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 189000,
    currency: "KRW",
    productUrl: "https://www.musinsa.com/example/001",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-002",
    productId: "prod-001",
    platformName: "29CM",
    platformLogoUrl: null,
    price: 179000,
    currency: "KRW",
    productUrl: "https://www.29cm.co.kr/example/001",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-003",
    productId: "prod-001",
    platformName: "W컨셉",
    platformLogoUrl: null,
    price: 195000,
    currency: "KRW",
    productUrl: "https://www.wconcept.co.kr/example/001",
    inStock: false,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-004",
    productId: "prod-002",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 129000,
    currency: "KRW",
    productUrl: "https://www.musinsa.com/example/002",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-005",
    productId: "prod-002",
    platformName: "쿠팡",
    platformLogoUrl: null,
    price: 119000,
    currency: "KRW",
    productUrl: "https://www.coupang.com/example/002",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-006",
    productId: "prod-003",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 89000,
    currency: "KRW",
    productUrl: "https://www.musinsa.com/example/003",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-007",
    productId: "prod-004",
    platformName: "COS 공식몰",
    platformLogoUrl: null,
    price: 350000,
    currency: "KRW",
    productUrl: "https://www.cos.com/example/004",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
  {
    id: "link-008",
    productId: "prod-004",
    platformName: "29CM",
    platformLogoUrl: null,
    price: 339000,
    currency: "KRW",
    productUrl: "https://www.29cm.co.kr/example/004",
    inStock: true,
    lastCheckedAt: new Date("2026-03-26"),
  },
];

export function getMockStylesByCategoryId(categoryId: string): CelebStyle[] {
  return MOCK_STYLES.filter((s) => s.categoryId === categoryId);
}

export function getMockStyleById(id: string): CelebStyle | undefined {
  return MOCK_STYLES.find((s) => s.id === id);
}

export function getMockProductsByStyleId(styleId: string): SimilarProduct[] {
  return MOCK_SIMILAR_PRODUCTS.filter((p) => p.styleId === styleId);
}

export function getMockProductById(id: string): SimilarProduct | undefined {
  return MOCK_SIMILAR_PRODUCTS.find((p) => p.id === id);
}

export function getMockLinksByProductId(productId: string): PurchaseLink[] {
  return MOCK_PURCHASE_LINKS.filter((l) => l.productId === productId);
}
