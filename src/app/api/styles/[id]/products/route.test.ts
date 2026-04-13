// src/app/api/styles/[id]/products/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetStyleById = vi.fn();
const mockGetStyleProducts = vi.fn();

vi.mock("@/lib/data/styles", () => ({
  getStyleById: (...args: unknown[]) => mockGetStyleById(...args),
  getStyleProducts: (...args: unknown[]) => mockGetStyleProducts(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

const createCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const mockProducts = [
  {
    id: "prod-1",
    styleId: "style-1",
    brandName: "ZARA",
    productName: "오버사이즈 코트",
    productImageUrl: "https://placehold.co/400",
    representativePrice: 89000,
    similarityScore: 0.92,
    createdAt: new Date("2026-01-01"),
  },
  {
    id: "prod-2",
    styleId: "style-1",
    brandName: "H&M",
    productName: "울 블렌드 코트",
    productImageUrl: "https://placehold.co/400",
    representativePrice: 59000,
    similarityScore: 0.85,
    createdAt: new Date("2026-01-02"),
  },
];

describe("GET /api/styles/:id/products", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("스타일의 유사 상품 목록을 반환한다", async () => {
    mockGetStyleById.mockResolvedValue({ id: "style-1" });
    mockGetStyleProducts.mockResolvedValue(mockProducts);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(2);
    expect(body.data[0].brandName).toBe("ZARA");
  });

  it("존재하지 않는 스타일이면 404를 반환한다", async () => {
    mockGetStyleById.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/styles/invalid/products");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("STYLE_NOT_FOUND");
  });

  it("sort=price면 price_asc 필터로 호출한다", async () => {
    mockGetStyleById.mockResolvedValue({ id: "style-1" });
    mockGetStyleProducts.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=price");
    await GET(req, createCtx("style-1"));

    expect(mockGetStyleProducts).toHaveBeenCalledWith(
      "style-1", { sort: "price_asc" },
    );
  });

  it("sort=brand면 brand 필터로 호출한다", async () => {
    mockGetStyleById.mockResolvedValue({ id: "style-1" });
    mockGetStyleProducts.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=brand");
    await GET(req, createCtx("style-1"));

    expect(mockGetStyleProducts).toHaveBeenCalledWith(
      "style-1", { sort: "brand" },
    );
  });

  it("sort 미지정이면 similarity 필터로 호출한다", async () => {
    mockGetStyleById.mockResolvedValue({ id: "style-1" });
    mockGetStyleProducts.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products");
    await GET(req, createCtx("style-1"));

    expect(mockGetStyleProducts).toHaveBeenCalledWith(
      "style-1", { sort: "similarity" },
    );
  });

  it("잘못된 sort 값이면 400을 반환한다", async () => {
    mockGetStyleById.mockResolvedValue({ id: "style-1" });

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=invalid");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_SORT_VALUE");
  });
});
