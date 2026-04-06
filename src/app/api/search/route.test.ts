// src/app/api/search/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    celebStyle: { findMany: vi.fn() },
    similarProduct: { findMany: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockCtx = { params: Promise.resolve({}) };

const mockCelebStyles = [
  { id: "style-1", celebName: "아이유", imageUrl: "https://placehold.co/400", categoryId: "seed-cat-outer" },
];

const mockProducts = [
  { id: "prod-1", brandName: "ZARA", productName: "오버사이즈 코트", productImageUrl: "https://placehold.co/400", representativePrice: 89000 },
];

describe("GET /api/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("검색어로 셀럽과 상품을 모두 검색한다", async () => {
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue(mockCelebStyles as never);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue(mockProducts as never);

    const req = new NextRequest("http://localhost:3000/api/search?q=아이유");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.celebStyles).toHaveLength(1);
    expect(body.products).toHaveLength(1);
  });

  it("q 파라미터가 없으면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:3000/api/search");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
  });

  it("type=celeb이면 셀럽만 검색한다", async () => {
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue(mockCelebStyles as never);

    const req = new NextRequest("http://localhost:3000/api/search?q=아이유&type=celeb");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.celebStyles).toHaveLength(1);
    expect(body.products).toEqual([]);
    expect(prisma.similarProduct.findMany).not.toHaveBeenCalled();
  });

  it("type=brand이면 상품만 검색한다", async () => {
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue(mockProducts as never);

    const req = new NextRequest("http://localhost:3000/api/search?q=ZARA&type=brand");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.celebStyles).toEqual([]);
    expect(body.products).toHaveLength(1);
    expect(prisma.celebStyle.findMany).not.toHaveBeenCalled();
  });

  it("type=product이면 상품명으로 검색한다", async () => {
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue(mockProducts as never);

    const req = new NextRequest("http://localhost:3000/api/search?q=코트&type=product");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.products).toHaveLength(1);
    expect(prisma.celebStyle.findMany).not.toHaveBeenCalled();
  });

  it("잘못된 type 값이면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:3000/api/search?q=test&type=invalid");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_FILTER_VALUE");
  });

  it("검색 결과가 없으면 빈 배열을 반환한다", async () => {
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue([]);
    vi.mocked(prisma.similarProduct.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/search?q=없는검색어");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.celebStyles).toEqual([]);
    expect(body.products).toEqual([]);
  });
});
