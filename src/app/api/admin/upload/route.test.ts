import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import type { RouteContext } from "@/lib/api/withErrorHandler";

// ── env mock ──
const mockEnv: Record<string, string | undefined> = {
  CRON_SECRET: "test-secret-1234567890",
};
vi.mock("@/lib/env", () => ({
  env: new Proxy({} as Record<string, string | undefined>, {
    get: (_, key: string) => mockEnv[key],
  }),
}));

// ── cloudinary mock ──
const mockUpload = vi.fn();
let mockCloudinary: unknown = { uploader: { upload: mockUpload } };
vi.mock("@/lib/cloudinary", () => ({
  get cloudinary() {
    return mockCloudinary;
  },
}));

// ── logger mock ──
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn() },
}));

import { POST } from "./route";

const TOKEN = "test-secret-1234567890";
const dummyCtx: RouteContext = { params: Promise.resolve({}) };

function createFile(
  options?: Partial<{ name: string; type: string; sizeBytes: number }>,
): File {
  const {
    name = "test.jpg",
    type = "image/jpeg",
    sizeBytes = 100,
  } = options ?? {};
  return new File([new Uint8Array(sizeBytes)], name, { type });
}

function createReq(options?: {
  token?: string;
  file?: File | null;
  folder?: string;
  tags?: string;
}): NextRequest {
  const { token, file, folder, tags } = options ?? {};
  const formData = new FormData();

  // file === undefined → 기본 파일 첨부, file === null → 파일 미첨부
  if (file !== null) {
    formData.append("file", file ?? createFile());
  }
  if (folder) formData.append("folder", folder);
  if (tags) formData.append("tags", tags);

  const headers: Record<string, string> = {};
  if (token) headers["authorization"] = `Bearer ${token}`;

  return new NextRequest("http://localhost:3000/api/admin/upload", {
    method: "POST",
    headers,
    body: formData,
  });
}

describe("POST /api/admin/upload", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockEnv.CRON_SECRET = TOKEN;
    mockCloudinary = { uploader: { upload: mockUpload } };
  });

  // ── 인증 ──

  it("토큰이 없으면 401을 반환한다", async () => {
    const res = await POST(createReq(), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  it("잘못된 토큰이면 401을 반환한다", async () => {
    const res = await POST(createReq({ token: "wrong" }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(401);
    expect(body.code).toBe("AUTH_REQUIRED");
  });

  // ── Cloudinary 설정 ──

  it("Cloudinary가 미설정이면 503을 반환한다", async () => {
    mockCloudinary = null;

    const res = await POST(createReq({ token: TOKEN }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(503);
    expect(body.code).toBe("CLOUDINARY_NOT_CONFIGURED");
  });

  // ── 파일 검증 ──

  it("파일이 없으면 400을 반환한다", async () => {
    const res = await POST(createReq({ token: TOKEN, file: null }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("UPLOAD_NO_FILE");
  });

  it("허용되지 않는 파일 형식이면 400을 반환한다", async () => {
    const file = createFile({ name: "test.gif", type: "image/gif" });

    const res = await POST(createReq({ token: TOKEN, file }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("UPLOAD_INVALID_TYPE");
    expect(body.details.allowed).toContain("image/jpeg");
  });

  it("파일 크기가 10MB를 초과하면 413을 반환한다", async () => {
    const file = createFile({ sizeBytes: 10 * 1024 * 1024 + 1 });

    const res = await POST(createReq({ token: TOKEN, file }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(413);
    expect(body.code).toBe("UPLOAD_FILE_TOO_LARGE");
    expect(body.details.maxBytes).toBe(10 * 1024 * 1024);
  });

  it("허용되지 않는 폴더면 400을 반환한다", async () => {
    const res = await POST(
      createReq({ token: TOKEN, folder: "hack" }),
      dummyCtx,
    );
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.code).toBe("UPLOAD_INVALID_FOLDER");
    expect(body.details.allowed).toContain("styles");
  });

  // ── 성공 ──

  it("유효한 요청이면 업로드 결과를 반환한다", async () => {
    mockUpload.mockResolvedValue({
      secure_url:
        "https://res.cloudinary.com/xxx/image/upload/v1/aideals/products/test.jpg",
      public_id: "aideals/products/test",
      width: 400,
      height: 500,
      format: "jpg",
      bytes: 12345,
    });

    const res = await POST(
      createReq({ token: TOKEN, folder: "products", tags: "outer,winter" }),
      dummyCtx,
    );
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body.data).toEqual({
      url: "https://res.cloudinary.com/xxx/image/upload/v1/aideals/products/test.jpg",
      publicId: "aideals/products/test",
      width: 400,
      height: 500,
      format: "jpg",
      bytes: 12345,
    });
    expect(mockUpload).toHaveBeenCalledWith(
      expect.stringContaining("data:image/jpeg;base64,"),
      expect.objectContaining({
        folder: "aideals/products",
        tags: ["outer", "winter"],
        resource_type: "image",
      }),
    );
  });

  // ── 실패 ──

  it("Cloudinary 업로드 실패 시 502를 반환한다", async () => {
    mockUpload.mockRejectedValue(new Error("Cloudinary timeout"));

    const res = await POST(createReq({ token: TOKEN }), dummyCtx);
    const body = await res.json();

    expect(res.status).toBe(502);
    expect(body.code).toBe("UPLOAD_FAILED");
  });
});
