// src/app/api/styles/[id]/products/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    celebStyle: { findUnique: vi.fn() },
    similarProduct: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

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
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue({ id: "style-1" } as never);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue(mockProducts as never);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toHaveLength(2);
    expect(body[0].brandName).toBe("ZARA");
  });

  it("존재하지 않는 스타일이면 404를 반환한다", async () => {
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/styles/invalid/products");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("STYLE_NOT_FOUND");
  });

  it("sort=price면 가격 오름차순으로 정렬한다", async () => {
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue({ id: "style-1" } as never);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=price");
    await GET(req, createCtx("style-1"));

    expect(prisma.similarProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { representativePrice: "asc" },
      }),
    );
  });

  it("sort=brand면 브랜드명 오름차순으로 정렬한다", async () => {
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue({ id: "style-1" } as never);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=brand");
    await GET(req, createCtx("style-1"));

    expect(prisma.similarProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { brandName: "asc" },
      }),
    );
  });

  it("sort 미지정이면 유사도 내림차순으로 정렬한다", async () => {
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue({ id: "style-1" } as never);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products");
    await GET(req, createCtx("style-1"));

    expect(prisma.similarProduct.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { similarityScore: "desc" },
      }),
    );
  });

  it("잘못된 sort 값이면 400을 반환한다", async () => {
    vi.mocked(prisma.celebStyle.findUnique).mockResolvedValue({ id: "style-1" } as never);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1/products?sort=invalid");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_SORT_VALUE");
  });
});
