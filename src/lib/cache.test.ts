import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── redis mock ──
const mockGet = vi.fn();
const mockSet = vi.fn();
vi.mock("./redis", () => ({
  redis: {
    get: (...args: unknown[]) => mockGet(...args),
    set: (...args: unknown[]) => mockSet(...args),
  },
}));

// ── logger mock ──
const mockWarn = vi.fn();
vi.mock("./logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: (...args: unknown[]) => mockWarn(...args) },
}));

import { buildCacheKey, resetCacheCircuit, withCache } from "./cache";

describe("withCache", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
    resetCacheCircuit();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("캐시 히트면 fetcher를 호출하지 않는다", async () => {
    mockGet.mockResolvedValue({ v: 1 });
    const fetcher = vi.fn();

    await expect(withCache("k", 60, fetcher)).resolves.toEqual({ v: 1 });
    expect(fetcher).not.toHaveBeenCalled();
  });

  it("캐시 미스면 fetcher 결과를 TTL과 함께 저장한다", async () => {
    mockGet.mockResolvedValue(null);
    const fetcher = vi.fn().mockResolvedValue({ v: 2 });

    await expect(withCache("k", 60, fetcher)).resolves.toEqual({ v: 2 });
    expect(mockSet).toHaveBeenCalledWith("k", { v: 2 }, { ex: 60 });
  });

  it("Redis 조회 실패 시 DB로 폴백하고 이후 30초간 Redis를 건너뛴다", async () => {
    mockGet.mockRejectedValue(new Error("fetch failed"));
    const fetcher = vi.fn().mockResolvedValue("db");

    await expect(withCache("k", 60, fetcher)).resolves.toBe("db");
    expect(mockSet).not.toHaveBeenCalled();

    await expect(withCache("k2", 60, fetcher)).resolves.toBe("db");
    expect(mockGet).toHaveBeenCalledTimes(1);
    expect(mockWarn).toHaveBeenCalledTimes(1);

    vi.advanceTimersByTime(30_001);
    mockGet.mockResolvedValue("cached");

    await expect(withCache("k3", 60, fetcher)).resolves.toBe("cached");
    expect(mockGet).toHaveBeenCalledTimes(2);
  });

  it("Redis 저장 실패도 서킷을 연다", async () => {
    mockGet.mockResolvedValue(null);
    mockSet.mockRejectedValue(new Error("fetch failed"));
    const fetcher = vi.fn().mockResolvedValue("db");

    await expect(withCache("k", 60, fetcher)).resolves.toBe("db");
    await withCache("k2", 60, fetcher);

    expect(mockGet).toHaveBeenCalledTimes(1);
  });
});

describe("buildCacheKey", () => {
  it("파라미터를 정렬하고 빈 값은 제외한다", () => {
    expect(buildCacheKey("styles", { page: 1, gender: "female", color: undefined })).toBe(
      "styles:gender=female&page=1",
    );
    expect(buildCacheKey("styles", {})).toBe("styles");
  });
});
