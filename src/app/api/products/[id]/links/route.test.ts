// src/app/api/products/[id]/links/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    similarProduct: { findUnique: vi.fn() },
    purchaseLink: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

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
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue({ id: "prod-1" } as never);
    vi.mocked(prisma.purchaseLink.findMany).mockResolvedValue(mockLinks as never);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].platformName).toBe("무신사");
  });

  it("존재하지 않는 상품이면 404를 반환한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/products/invalid/links");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("sort=price면 가격 오름차순으로 정렬한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue({ id: "prod-1" } as never);
    vi.mocked(prisma.purchaseLink.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links?sort=price");
    await GET(req, createCtx("prod-1"));

    expect(prisma.purchaseLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { price: "asc" },
      }),
    );
  });

  it("sort 미지정이면 lastCheckedAt 내림차순으로 정렬한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue({ id: "prod-1" } as never);
    vi.mocked(prisma.purchaseLink.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links");
    await GET(req, createCtx("prod-1"));

    expect(prisma.purchaseLink.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { lastCheckedAt: "desc" },
      }),
    );
  });

  it("잘못된 sort 값이면 400을 반환한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue({ id: "prod-1" } as never);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1/links?sort=invalid");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_SORT_VALUE");
  });
});
