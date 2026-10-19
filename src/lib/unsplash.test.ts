import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// ── env mock ──
const mockEnv: Record<string, string | undefined> = {
  UNSPLASH_ACCESS_KEY: "test-unsplash-access-key-123456",
};
vi.mock("@/lib/env", () => ({
  env: new Proxy({} as Record<string, string | undefined>, {
    get: (_, key: string) => mockEnv[key],
  }),
}));

// ── logger mock ──
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import {
  isUnsplashApiUrl,
  searchUnsplashPhotos,
  triggerUnsplashDownload,
} from "./unsplash";

const mockFetch = vi.fn();

describe("unsplash", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.UNSPLASH_ACCESS_KEY = "test-unsplash-access-key-123456";
    vi.stubGlobal("fetch", mockFetch);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // ── isUnsplashApiUrl ──

  it("api.unsplash.com https URL만 허용한다", () => {
    expect(isUnsplashApiUrl("https://api.unsplash.com/photos/abc/download?ixid=1")).toBe(true);
    expect(isUnsplashApiUrl("http://api.unsplash.com/photos/abc/download")).toBe(false);
    expect(isUnsplashApiUrl("https://evil.example.com/?api.unsplash.com")).toBe(false);
    expect(isUnsplashApiUrl("https://api.unsplash.com.evil.com/x")).toBe(false);
    expect(isUnsplashApiUrl("http://169.254.169.254/latest/meta-data")).toBe(false);
    expect(isUnsplashApiUrl("not a url")).toBe(false);
  });

  // ── triggerUnsplashDownload ──

  it("Unsplash API URL이면 Access Key와 함께 호출한다", async () => {
    mockFetch.mockResolvedValue(new Response("{}"));

    await triggerUnsplashDownload("https://api.unsplash.com/photos/abc/download");

    expect(mockFetch).toHaveBeenCalledWith(
      "https://api.unsplash.com/photos/abc/download",
      { headers: { Authorization: "Client-ID test-unsplash-access-key-123456" } },
    );
  });

  it("외부 호스트 URL이면 호출하지 않는다", async () => {
    await triggerUnsplashDownload("https://attacker.example.com/collect");

    expect(mockFetch).not.toHaveBeenCalled();
  });

  it("호출이 실패해도 예외를 던지지 않는다", async () => {
    mockFetch.mockRejectedValue(new Error("network down"));

    await expect(
      triggerUnsplashDownload("https://api.unsplash.com/photos/abc/download"),
    ).resolves.toBeUndefined();
  });

  // ── searchUnsplashPhotos ──

  it("Access Key가 없으면 UNSPLASH_NOT_CONFIGURED를 던진다", async () => {
    mockEnv.UNSPLASH_ACCESS_KEY = undefined;

    await expect(
      searchUnsplashPhotos({ query: "coat", page: 1, perPage: 20 }),
    ).rejects.toMatchObject({ code: "UNSPLASH_NOT_CONFIGURED", statusCode: 503 });
  });

  it("API 실패 시 UNSPLASH_API_FAILED를 던진다", async () => {
    mockFetch.mockResolvedValue(new Response("rate limited", { status: 403 }));

    await expect(
      searchUnsplashPhotos({ query: "coat", page: 1, perPage: 20 }),
    ).rejects.toMatchObject({ code: "UNSPLASH_API_FAILED", statusCode: 502 });
  });

  it("검색 결과를 ImageSearchResult로 정규화한다", async () => {
    mockFetch.mockResolvedValue(
      Response.json({
        total: 1,
        total_pages: 1,
        results: [
          {
            id: "p1",
            urls: { raw: "r", full: "f", regular: "g", small: "s", thumb: "t" },
            width: 1000,
            height: 1500,
            description: null,
            alt_description: "black coat",
            user: { name: "Jane", username: "jane", links: { html: "https://unsplash.com/@jane" } },
            links: {
              html: "https://unsplash.com/photos/p1",
              download_location: "https://api.unsplash.com/photos/p1/download",
            },
          },
        ],
      }),
    );

    const result = await searchUnsplashPhotos({ query: "coat", page: 2, perPage: 10 });

    const calledUrl = new URL(mockFetch.mock.calls[0][0] as string);
    expect(calledUrl.searchParams.get("query")).toBe("coat");
    expect(calledUrl.searchParams.get("page")).toBe("2");
    expect(calledUrl.searchParams.get("per_page")).toBe("10");
    expect(result).toEqual({
      total: 1,
      totalPages: 1,
      photos: [
        {
          id: "p1",
          thumbUrl: "t",
          regularUrl: "g",
          fullUrl: "f",
          width: 1000,
          height: 1500,
          description: "black coat",
          photographer: "Jane",
          photographerUrl: "https://unsplash.com/@jane",
          sourceUrl: "https://unsplash.com/photos/p1",
          sourceName: "Unsplash",
          downloadTracker: "https://api.unsplash.com/photos/p1/download",
        },
      ],
    });
  });
});
