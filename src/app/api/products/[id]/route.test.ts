// src/app/api/products/[id]/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    similarProduct: { findUnique: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const createCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const mockProduct = {
  id: "prod-1",
  styleId: "style-1",
  brandName: "ZARA",
  productName: "오버사이즈 코트",
  productImageUrl: "https://placehold.co/400",
  representativePrice: 89000,
  similarityScore: 0.92,
  createdAt: new Date("2026-01-01"),
  style: {
    id: "style-1",
    celebName: "아이유",
    imageUrl: "https://placehold.co/400",
    categoryId: "seed-cat-outer",
  },
};

describe("GET /api/products/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("상품 상세 정보를 스타일 정보와 함께 반환한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue(mockProduct as never);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("prod-1");
    expect(body.brandName).toBe("ZARA");
    expect(body.style.celebName).toBe("아이유");
  });

  it("존재하지 않는 상품이면 404를 반환한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/products/invalid");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("PRODUCT_NOT_FOUND");
  });

  it("해당 id로 Prisma를 조회하며 style을 include한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockResolvedValue(mockProduct as never);

    const req = new NextRequest("http://localhost:3000/api/products/prod-1");
    await GET(req, createCtx("prod-1"));

    expect(prisma.similarProduct.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "prod-1" },
        select: expect.objectContaining({
          style: expect.any(Object),
        }),
      }),
    );
  });

  it("Prisma 에러 시 500을 반환한다", async () => {
    vi.mocked(prisma.similarProduct.findUnique).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/products/prod-1");
    const res = await GET(req, createCtx("prod-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
