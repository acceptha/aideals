// src/app/api/categories/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: {
      findMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const mockCtx = { params: Promise.resolve({}) };

const mockCategories = [
  { id: "seed-cat-outer", name: "아우터", iconUrl: null, sortOrder: 1 },
  { id: "seed-cat-top", name: "상의", iconUrl: null, sortOrder: 2 },
];

describe("GET /api/categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("카테고리 목록을 반환한다", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue(mockCategories as never);

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual(mockCategories);
  });

  it("카테고리가 없으면 빈 배열을 반환한다", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual([]);
  });

  it("sortOrder 기준 오름차순으로 조회한다", async () => {
    vi.mocked(prisma.category.findMany).mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/categories");
    await GET(req, mockCtx);

    expect(prisma.category.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: { sortOrder: "asc" },
      }),
    );
  });

  it("Prisma 에러 시 500을 반환한다", async () => {
    vi.mocked(prisma.category.findMany).mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
