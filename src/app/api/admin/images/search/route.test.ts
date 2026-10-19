import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RouteContext } from "@/lib/api/withErrorHandler";

// ── auth mock ──
let mockSession: unknown = { user: { id: "u1", role: "admin" } };
vi.mock("@/lib/auth", () => ({
  auth: () => Promise.resolve(mockSession),
}));

// ── unsplash mock ──
const mockSearch = vi.fn();
vi.mock("@/lib/unsplash", () => ({
  searchUnsplashPhotos: (input: unknown) => mockSearch(input),
}));

import { GET } from "./route";

const dummyCtx: RouteContext = { params: Promise.resolve({}) };

const createReq = (query: string) =>
  new NextRequest(`http://localhost:3000/api/admin/images/search${query}`);

describe("GET /api/admin/images/search", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { user: { id: "u1", role: "admin" } };
  });

  it("로그인하지 않으면 401을 반환한다", async () => {
    mockSession = null;

    const res = await GET(createReq("?q=coat"), dummyCtx);

    expect(res.status).toBe(401);
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockSession = { user: { id: "u1", role: "user" } };

    const res = await GET(createReq("?q=coat"), dummyCtx);

    expect(res.status).toBe(403);
  });

  it("q가 없으면 400을 반환한다", async () => {
    const res = await GET(createReq(""), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("MISSING_REQUIRED_FIELD");
  });

  it("perPage가 30을 넘으면 400을 반환한다", async () => {
    const res = await GET(createReq("?q=coat&perPage=31"), dummyCtx);

    expect(res.status).toBe(400);
    expect(mockSearch).not.toHaveBeenCalled();
  });

  it("검색 결과를 data + pagination 형태로 반환한다", async () => {
    mockSearch.mockResolvedValue({ photos: [{ id: "p1" }], total: 41, totalPages: 3 });

    const res = await GET(createReq("?q=coat&page=2&perPage=20"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(mockSearch).toHaveBeenCalledWith({ query: "coat", page: 2, perPage: 20 });
    expect(body).toEqual({
      data: [{ id: "p1" }],
      pagination: { page: 2, limit: 20, total: 41, totalPages: 3 },
    });
  });
});
