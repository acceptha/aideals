// src/app/api/categories/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetCategories = vi.fn();
vi.mock("@/lib/data/categories", () => ({
  getCategories: (...args: unknown[]) => mockGetCategories(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

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
    mockGetCategories.mockResolvedValue(mockCategories);

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual(mockCategories);
  });

  it("카테고리가 없으면 빈 배열을 반환한다", async () => {
    mockGetCategories.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual([]);
  });

  it("getCategories가 호출된다", async () => {
    mockGetCategories.mockResolvedValue([]);

    const req = new NextRequest("http://localhost:3000/api/categories");
    await GET(req, mockCtx);

    expect(mockGetCategories).toHaveBeenCalledTimes(1);
  });

  it("데이터 조회 에러 시 500을 반환한다", async () => {
    mockGetCategories.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/categories");
    const res = await GET(req, mockCtx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
