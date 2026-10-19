import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RouteContext } from "@/lib/api/withErrorHandler";

// ── auth mock ──
let mockSession: unknown = { user: { id: "u1", role: "admin" } };
vi.mock("@/lib/auth", () => ({
  auth: () => Promise.resolve(mockSession),
}));

// ── cloudinary mock ──
const mockUpload = vi.fn();
let mockCloudinary: unknown = { uploader: { upload: mockUpload } };
vi.mock("@/lib/cloudinary", () => ({
  get cloudinary() {
    return mockCloudinary;
  },
}));

// ── unsplash mock ──
const mockTrigger = vi.fn();
vi.mock("@/lib/unsplash", () => ({
  triggerUnsplashDownload: (url: string) => mockTrigger(url),
}));

// ── logger mock ──
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { POST } from "./route";

const dummyCtx: RouteContext = { params: Promise.resolve({}) };

const VALID_BODY = {
  imageUrl: "https://images.unsplash.com/photo-1?ixid=abc",
  sourceUrl: "https://unsplash.com/photos/p1",
  photographer: "Jane",
  sourceName: "Unsplash",
  licenseType: "unsplash",
  downloadTracker: "https://api.unsplash.com/photos/p1/download",
};

function createReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost:3000/api/admin/images/import", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

describe("POST /api/admin/images/import", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSession = { user: { id: "u1", role: "admin" } };
    mockCloudinary = { uploader: { upload: mockUpload } };
  });

  // ── 인증 ──

  it("로그인하지 않으면 401을 반환한다", async () => {
    mockSession = null;

    const res = await POST(createReq(VALID_BODY), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  it("관리자가 아니면 403을 반환한다", async () => {
    mockSession = { user: { id: "u1", role: "user" } };

    const res = await POST(createReq(VALID_BODY), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(403);
    expect(body.code).toBe("AUTH_FORBIDDEN");
  });

  // ── 설정/검증 ──

  it("Cloudinary가 미설정이면 503을 반환한다", async () => {
    mockCloudinary = null;

    const res = await POST(createReq(VALID_BODY), dummyCtx);

    expect(res.status).toBe(503);
  });

  it("JSON이 아니면 400을 반환한다", async () => {
    const res = await POST(createReq("not-json"), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("MISSING_REQUIRED_FIELD");
  });

  it("필수 필드가 없으면 400과 필드명을 반환한다", async () => {
    const res = await POST(createReq({ ...VALID_BODY, photographer: " " }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details.field).toBe("photographer");
  });

  it("http(s)가 아닌 imageUrl은 400을 반환한다", async () => {
    const res = await POST(createReq({ ...VALID_BODY, imageUrl: "file:///etc/passwd" }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details.field).toBe("imageUrl");
    expect(mockUpload).not.toHaveBeenCalled();
  });

  it("허용되지 않는 폴더면 400을 반환한다", async () => {
    const res = await POST(createReq({ ...VALID_BODY, folder: "hack" }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("UPLOAD_INVALID_FOLDER");
  });

  // ── 성공/실패 ──

  it("Cloudinary로 복사하고 출처 메타데이터를 함께 반환한다", async () => {
    mockUpload.mockResolvedValue({
      secure_url: "https://res.cloudinary.com/demo/image/upload/v1/aideals/styles/x.jpg",
      public_id: "aideals/styles/x",
      width: 1000,
      height: 1500,
    });

    const res = await POST(createReq(VALID_BODY), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      cloudinaryUrl: "https://res.cloudinary.com/demo/image/upload/v1/aideals/styles/x.jpg",
      publicId: "aideals/styles/x",
      width: 1000,
      height: 1500,
      photographer: "Jane",
      sourceUrl: "https://unsplash.com/photos/p1",
      sourceName: "Unsplash",
      licenseType: "unsplash",
    });
    expect(mockUpload).toHaveBeenCalledWith(
      VALID_BODY.imageUrl,
      expect.objectContaining({ folder: "aideals/styles", tags: ["imported", "unsplash"] }),
    );
    expect(mockTrigger).toHaveBeenCalledWith(VALID_BODY.downloadTracker);
  });

  it("Cloudinary 복사 실패 시 502를 반환한다", async () => {
    mockUpload.mockRejectedValue(new Error("fetch failed"));

    const res = await POST(createReq(VALID_BODY), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.code).toBe("UPLOAD_FAILED");
    expect(mockTrigger).not.toHaveBeenCalled();
  });
});
