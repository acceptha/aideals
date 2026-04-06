// src/app/api/categories/[id]/styles/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/prisma", () => ({
  prisma: {
    category: { findUnique: vi.fn() },
    celebStyle: { findMany: vi.fn(), count: vi.fn() },
  },
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";
import { prisma } from "@/lib/prisma";

const createCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const mockStyles = [
  {
    id: "style-1",
    celebName: "아이유",
    imageUrl: "https://placehold.co/400",
    categoryId: "seed-cat-outer",
    colors: ["black"],
    gender: "female",
    season: "spring",
    createdAt: new Date("2026-01-01"),
  },
];

describe("GET /api/categories/:id/styles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("카테고리의 스타일 목록을 페이지네이션과 함께 반환한다", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "seed-cat-outer" } as never);
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue(mockStyles as never);
    vi.mocked(prisma.celebStyle.count).mockResolvedValue(1);

    const req = new NextRequest("http://localhost:3000/api/categories/seed-cat-outer/styles");
    const res = await GET(req, createCtx("seed-cat-outer"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(1);
    expect(body.pagination).toEqual({
      page: 1,
      limit: 20,
      total: 1,
      totalPages: 1,
    });
  });

  it("존재하지 않는 카테고리면 404를 반환한다", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/categories/invalid/styles");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("CATEGORY_NOT_FOUND");
  });

  it("gender 필터를 적용할 수 있다", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "seed-cat-outer" } as never);
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue([]);
    vi.mocked(prisma.celebStyle.count).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/categories/seed-cat-outer/styles?gender=male");
    await GET(req, createCtx("seed-cat-outer"));

    expect(prisma.celebStyle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({ gender: "male" }),
      }),
    );
  });

  it("color 필터를 적용할 수 있다", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "seed-cat-outer" } as never);
    vi.mocked(prisma.celebStyle.findMany).mockResolvedValue([]);
    vi.mocked(prisma.celebStyle.count).mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/categories/seed-cat-outer/styles?color=black,white");
    await GET(req, createCtx("seed-cat-outer"));

    expect(prisma.celebStyle.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          colors: { hasSome: ["black", "white"] },
        }),
      }),
    );
  });

  it("잘못된 gender 값이면 400을 반환한다", async () => {
    vi.mocked(prisma.category.findUnique).mockResolvedValue({ id: "seed-cat-outer" } as never);

    const req = new NextRequest("http://localhost:3000/api/categories/seed-cat-outer/styles?gender=invalid");
    const res = await GET(req, createCtx("seed-cat-outer"));
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_FILTER_VALUE");
  });
});
