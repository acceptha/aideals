// src/lib/api/withErrorHandler.test.ts
import { describe, it, expect, vi } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "./withErrorHandler";
import { AppError, NotFoundError, ValidationError } from "./errors";

const createMockRequest = (url = "http://localhost:3000/api/test") =>
  new NextRequest(url);

const createMockContext = () => ({
  params: Promise.resolve({}),
});

describe("withErrorHandler", () => {
  it("핸들러가 정상 응답을 반환하면 그대로 전달한다", async () => {
    const handler = withErrorHandler(async () =>
      NextResponse.json({ data: "ok" }),
    );

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(res.status).toBe(200);
    expect(body).toEqual({ data: "ok" });
  });

  it("AppError가 throw되면 구조화된 에러 응답을 반환한다", async () => {
    const handler = withErrorHandler(async () => {
      throw AppError.fromCode("STYLE_NOT_FOUND", "스타일을 찾을 수 없습니다");
    });

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body).toEqual({
      status: 404,
      code: "STYLE_NOT_FOUND",
      message: "스타일을 찾을 수 없습니다",
    });
  });

  it("AppError에 details가 있으면 응답에 포함된다", async () => {
    const handler = withErrorHandler(async () => {
      throw new ValidationError("필수 파라미터 누락", "MISSING_REQUIRED_FIELD", {
        field: "categoryId",
      });
    });

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(res.status).toBe(400);
    expect(body.details).toEqual({ field: "categoryId" });
  });

  it("NotFoundError가 throw되면 404 응답을 반환한다", async () => {
    const handler = withErrorHandler(async () => {
      throw new NotFoundError("카테고리", "CATEGORY_NOT_FOUND");
    });

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(res.status).toBe(404);
    expect(body.code).toBe("CATEGORY_NOT_FOUND");
  });

  it("일반 Error가 throw되면 500 응답을 반환한다", async () => {
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const handler = withErrorHandler(async () => {
      throw new Error("예상치 못한 오류");
    });

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(res.status).toBe(500);
    expect(body).toEqual({
      status: 500,
      code: "INTERNAL_SERVER_ERROR",
      message: "서버 내부 오류가 발생했습니다",
    });

    consoleSpy.mockRestore();
  });

  it("details가 없는 AppError는 응답에 details 필드가 없다", async () => {
    const handler = withErrorHandler(async () => {
      throw AppError.fromCode("INVALID_PAGINATION", "잘못된 페이지");
    });

    const res = await handler(createMockRequest(), createMockContext());
    const body = await res.json();

    expect(body).not.toHaveProperty("details");
  });
});
