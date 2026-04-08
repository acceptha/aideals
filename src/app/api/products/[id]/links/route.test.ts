// src/app/api/products/[id]/links/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetProductById = vi.fn();
const mockGetProductLinks = vi.fn();

vi.mock("@/lib/data/products", () => ({
  getProductById: (...args: unknown[]) => mockGetProductById(...args),
  getProductLinks: (...args: unknown[]) => mockGetProductLinks(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

const createCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const mockLinks = [
  {
    id: "link-1",
    productId: "prod-1",
    platformName: "무신사",
    platformLogoUrl: null,
    price: 89000,
    currency: "KRW",
    productUrl: "https://www.musinsa.com/product/1",
    inStock: true,
    lastCheckedAt: new Date("2026-01-15"),
  },
  {
    id: "link-2",
    productId: "prod-1",
    platformName: "29CM",
    platformLogoUrl: null,
    price: 92000,
    currency: "KRW",
    productUrl: "https://www.29cm.co.kr/product/1",
    inStock: true,
    lastCheckedAt: new Date("2026-01-14"),
  },
];

describe("GET /api/products/:id/links", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("상품의 구매처 목록을 반환한다", async () => {
    mockGetProductById.mockResolvedValue({ id: "prod-1" });
    mockGetProductLinks.mockResolvedValue(mockLinks);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].platformName).toBe("무신사");
  });

  it("존재하지 않는 상품이면 404를 반환한다", async () => {
    mockGetProductById.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/products/invalid/links");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("sort=price면 'price' 문자열로 호출한다", async () => {
    mockGetProductById.mockResolvedValue({ id: "prod-1" });
    mockGetProductLinks.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links?sort=price");
    await GET(req, createCtx("prod-1"));

    expect(mockGetProductLinks).toHaveBeenCalledWith("prod-1", "price");
  });

  it("sort 미지정이면 'recent' 문자열로 호출한다", async () => {
    mockGetProductById.mockResolvedValue({ id: "prod-1" });
    mockGetProductLinks.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links");
    await GET(req, createCtx("prod-1"));

    expect(mockGetProductLinks).toHaveBeenCalledWith("prod-1", "recent");
  });

  it("잘못된 sort 값이면 400을 반환한다", async () => {
    mockGetProductById.mockResolvedValue({ id: "prod-1" });

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links?sort=invalid");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_SORT_VALUE");
  });
});
