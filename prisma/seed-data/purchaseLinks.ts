// prisma/seed-data/purchaseLinks.ts
// 상품당 2~3개 플랫폼
//
// 시드 상품은 실제 판매 상품이 아니므로 productUrl은 각 플랫폼의
// "브랜드 + 상품명" 검색 결과 페이지로 연결한다 (클릭 시 404 방지).
// 실제 상품 URL은 관리자 > 구매처 관리에서 교체한다.

import { SEED_SIMILAR_PRODUCTS } from "./similarProducts";

/** platformName → 검색 URL 빌더. 공식몰은 브랜드 없이 상품명으로만 검색한다. */
const PLATFORM_SEARCH: Record<string, { url: (q: string) => string; brandStore?: boolean }> = {
  무신사: { url: (q) => `https://www.musinsa.com/search/goods?keyword=${q}` },
  "29cm": { url: (q) => `https://www.29cm.co.kr/store/search?keyword=${q}` },
  w컨셉: { url: (q) => `https://display.wconcept.co.kr/search?kwd=${q}` },
  쿠팡: { url: (q) => `https://www.coupang.com/np/search?q=${q}` },
  "cos 공식몰": {
    url: (q) => `https://www.cos.com/ko-kr/dpo/searchResult.html?searchQuery=${q}`,
    brandStore: true,
  },
  "유니클로 공식몰": {
    url: (q) => `https://www.uniqlo.com/kr/ko/search?q=${q}`,
    brandStore: true,
  },
  "리바이스 공식몰": { url: (q) => `https://www.levi.co.kr/search?q=${q}`, brandStore: true },
};

const buildSearchUrl = (platformName: string, productId: string): string => {
  const platform = PLATFORM_SEARCH[platformName];
  const product = SEED_SIMILAR_PRODUCTS.find((p) => p.id === productId);
  if (!platform || !product) {
    throw new Error(`시드 구매 링크 URL 생성 실패: ${platformName} / ${productId}`);
  }
  const keyword = platform.brandStore
    ? product.productName
    : `${product.brandName} ${product.productName}`;
  return platform.url(encodeURIComponent(keyword));
};

const RAW_PURCHASE_LINKS = [
  // ── prod-001 (ZARA 코트) ──
  {
    id: "seed-link-001",
    productId: "seed-prod-001",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 189000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-002",
    productId: "seed-prod-001",
    platformName: "29cm",
    platformLogoUrl: null,
    price: 179000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-003",
    productId: "seed-prod-001",
    platformName: "w컨셉",
    platformLogoUrl: null,
    price: 195000,
    currency: "KRW",
    inStock: false,
  },

  // ── prod-002 (H&M 코트) ──
  {
    id: "seed-link-004",
    productId: "seed-prod-002",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 129000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-005",
    productId: "seed-prod-002",
    platformName: "쿠팡",
    platformLogoUrl: null,
    price: 119000,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-003 (무신사 스탠다드 코트) ──
  {
    id: "seed-link-006",
    productId: "seed-prod-003",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 89000,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-004 (COS 코트) ──
  {
    id: "seed-link-007",
    productId: "seed-prod-004",
    platformName: "cos 공식몰",
    platformLogoUrl: null,
    price: 350000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-008",
    productId: "seed-prod-004",
    platformName: "29cm",
    platformLogoUrl: null,
    price: 339000,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-005 (UNIQLO 티) ──
  {
    id: "seed-link-009",
    productId: "seed-prod-005",
    platformName: "유니클로 공식몰",
    platformLogoUrl: null,
    price: 19900,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-010",
    productId: "seed-prod-005",
    platformName: "쿠팡",
    platformLogoUrl: null,
    price: 21900,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-006 (8SECONDS 블라우스) ──
  {
    id: "seed-link-011",
    productId: "seed-prod-006",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 39900,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-012",
    productId: "seed-prod-006",
    platformName: "29cm",
    platformLogoUrl: null,
    price: 35900,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-008 (리바이스 진) ──
  {
    id: "seed-link-013",
    productId: "seed-prod-008",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 109000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-014",
    productId: "seed-prod-008",
    platformName: "리바이스 공식몰",
    platformLogoUrl: null,
    price: 119000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-015",
    productId: "seed-prod-008",
    platformName: "쿠팡",
    platformLogoUrl: null,
    price: 99000,
    currency: "KRW",
    inStock: false,
  },

  // ── prod-010 (ZARA 원피스) ──
  {
    id: "seed-link-016",
    productId: "seed-prod-010",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 79900,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-017",
    productId: "seed-prod-010",
    platformName: "w컨셉",
    platformLogoUrl: null,
    price: 74900,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-012 (마르니 가방) ──
  {
    id: "seed-link-018",
    productId: "seed-prod-012",
    platformName: "29cm",
    platformLogoUrl: null,
    price: 890000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-019",
    productId: "seed-prod-012",
    platformName: "w컨셉",
    platformLogoUrl: null,
    price: 870000,
    currency: "KRW",
    inStock: true,
  },

  // ── prod-013 (마뗑킴 에코백) ──
  {
    id: "seed-link-020",
    productId: "seed-prod-013",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 68000,
    currency: "KRW",
    inStock: true,
  },
  {
    id: "seed-link-021",
    productId: "seed-prod-013",
    platformName: "쿠팡",
    platformLogoUrl: null,
    price: 62000,
    currency: "KRW",
    inStock: true,
  },
];

export const SEED_PURCHASE_LINKS = RAW_PURCHASE_LINKS.map((link) => ({
  ...link,
  productUrl: buildSearchUrl(link.platformName, link.productId),
}));
