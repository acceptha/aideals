import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RouteContext } from "@/lib/api/withErrorHandler";

// ── env mock ──
const mockEnv = { CRON_SECRET: "test-cron-secret-1234567890" };
vi.mock("@/lib/env", () => ({
  env: new Proxy({} as Record<string, string | undefined>, {
    get: (_, key: string) => mockEnv[key as keyof typeof mockEnv],
  }),
}));

// ── crawlAll mock ──
const mockCrawlAll = vi.fn();
vi.mock("@/lib/scraper/crawl", () => ({
  crawlAll: (...args: unknown[]) => mockCrawlAll(...args),
}));

// ── logger mock ──
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { GET } from "./route";

const createReq = (token?: string) => {
  const headers: Record<string, string> = {};
  if (token) headers["authorization"] = `Bearer ${token}`;
  return new NextRequest("http://localhost:3000/api/cron/crawl", { headers });
};

const dummyCtx: RouteContext = { params: Promise.resolve({}) };

describe("GET /api/cron/crawl", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.CRON_SECRET = "test-cron-secret-1234567890";
  });

  it("유효한 토큰이면 크롤링을 실행하고 요약을 반환한다", async () => {
    mockCrawlAll.mockResolvedValue({
      total: 5,
      success: 4,
      failed: 1,
      skipped: 0,
      duration: 3200,
      results: [],
    });

    const res = await GET(createReq("test-cron-secret-1234567890"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.total).toBe(5);
    expect(body.success).toBe(4);
    expect(body.failed).toBe(1);
    expect(mockCrawlAll).toHaveBeenCalledOnce();
  });

  it("토큰이 없으면 401을 반환한다", async () => {
    const res = await GET(createReq(), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
    expect(mockCrawlAll).not.toHaveBeenCalled();
  });

  it("잘못된 토큰이면 401을 반환한다", async () => {
    const res = await GET(createReq("wrong-token"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
    expect(mockCrawlAll).not.toHaveBeenCalled();
  });

  it("CRON_SECRET이 설정되지 않으면 401을 반환한다", async () => {
    mockEnv.CRON_SECRET = undefined as unknown as string;

    const res = await GET(createReq("any-token"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  it("크롤링 중 에러가 발생하면 500을 반환한다", async () => {
    mockCrawlAll.mockRejectedValue(new Error("DB 연결 실패"));

    const res = await GET(createReq("test-cron-secret-1234567890"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body.code).toBe("INTERNAL_SERVER_ERROR");
    expect(body.message).toBe("서버 내부 오류가 발생했습니다");
  });
});
