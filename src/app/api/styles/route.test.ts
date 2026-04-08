// src/app/api/styles/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetStylesWithCount = vi.fn();

vi.mock("@/lib/data/styles", () => ({
  getStylesWithCount: (...args: unknown[]) => mockGetStylesWithCount(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

const mockCtx = { params: Promise.resolve({}) };

const createStyles = (count: number) =>
  Array.from({ length: count }, (_, i) => ({
    id: `style-${i + 1}`,
    celebName: `셀럽${i + 1}`,
    imageUrl: `https://placehold.co/400`,
    categoryId: "seed-cat-outer",
    colors: ["black"],
    gender: "female",
    season: "spring",
    createdAt: new Date(`2026-01-${String(i + 1).padStart(2, "0")}`),
  }));

describe("GET /api/styles", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("필터 없이 요청하면 스타일 목록을 페이지네이션과 함께 반환한다", async () => {
    const styles = createStyles(3);
    mockGetStylesWithCount.mockResolvedValue([styles, 3]);

    const req = new NextRequest("http://localhost:3000/api/styles");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toHaveLength(3);
    expect(body.pagination.total).toBe(3);
  });

  it("categoryId로 필터할 수 있다", async () => {
    mockGetStylesWithCount.mockResolvedValue([[], 0]);

    const req = new NextRequest("http://localhost:3000/api/styles?categoryId=seed-cat-top");
    await GET(req, mockCtx);

    expect(mockGetStylesWithCount).toHaveBeenCalledWith(
      expect.objectContaining({ categoryId: "seed-cat-top" }),
    );
  });

  it("gender=male로 필터하면 getStylesWithCount에 gender가 전달된다", async () => {
    mockGetStylesWithCount.mockResolvedValue([[], 0]);

    const req = new NextRequest("http://localhost:3000/api/styles?gender=male");
    await GET(req, mockCtx);

    expect(mockGetStylesWithCount).toHaveBeenCalledWith(
      expect.objectContaining({ gender: "male" }),
    );
  });

  it("sort=celebName_asc면 celebName 오름차순으로 정렬한다", async () => {
    const styles = [
      { ...createStyles(1)[0], celebName: "홍길동" },
      { ...createStyles(1)[0], id: "style-2", celebName: "가나다" },
    ];
    mockGetStylesWithCount.mockResolvedValue([styles, 2]);

    const req = new NextRequest("http://localhost:3000/api/styles?sort=celebName_asc");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(body.data[0].celebName).toBe("가나다");
  });

  it("page와 limit 파라미터로 페이지네이션을 적용할 수 있다", async () => {
    const styles = createStyles(25);
    mockGetStylesWithCount.mockResolvedValue([styles, 25]);

    const req = new NextRequest("http://localhost:3000/api/styles?page=2&limit=5");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(body.pagination).toEqual({
      page: 2,
      limit: 5,
      total: 25,
      totalPages: 5,
    });
  });

  it("잘못된 gender 값이면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:3000/api/styles?gender=other");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("INVALID_FILTER_VALUE");
  });

  it("page가 음수면 400을 반환한다", async () => {
    const req = new NextRequest("http://localhost:3000/api/styles?page=-1");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
  });
});
