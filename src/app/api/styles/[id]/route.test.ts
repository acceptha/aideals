// src/app/api/styles/[id]/route.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const mockGetStyleById = vi.fn();

vi.mock("@/lib/data/styles", () => ({
  getStyleById: (...args: unknown[]) => mockGetStyleById(...args),
}));

vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

const createCtx = (id: string) => ({ params: Promise.resolve({ id }) });

const mockStyle = {
  id: "style-1",
  celebName: "아이유",
  imageUrl: "https://placehold.co/400",
  categoryId: "seed-cat-outer",
  colors: ["black", "white"],
  gender: "female",
  season: "spring",
  createdAt: new Date("2026-01-01"),
};

describe("GET /api/styles/:id", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("스타일 상세 정보를 반환한다", async () => {
    mockGetStyleById.mockResolvedValue(mockStyle);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.id).toBe("style-1");
    expect(body.celebName).toBe("아이유");
  });

  it("존재하지 않는 스타일이면 404를 반환한다", async () => {
    mockGetStyleById.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/styles/invalid");
    const res = await GET(req, createCtx("invalid"));
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("STYLE_NOT_FOUND");
  });

  it("해당 id로 getStyleById를 호출한다", async () => {
    mockGetStyleById.mockResolvedValue(mockStyle);

    const req = new NextRequest("http://localhost:3000/api/styles/style-1");
    await GET(req, createCtx("style-1"));

    expect(mockGetStyleById).toHaveBeenCalledWith("style-1");
  });

  it("데이터 조회 에러 시 500을 반환한다", async () => {
    mockGetStyleById.mockRejectedValue(new Error("DB error"));

    const req = new NextRequest("http://localhost:3000/api/styles/style-1");
    const res = await GET(req, createCtx("style-1"));
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
  });
});
