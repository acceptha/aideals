// src/lib/api/errors.test.ts
import { describe, it, expect } from "vitest";
import { AppError, NotFoundError, ValidationError } from "./errors";

describe("AppError", () => {
  it("기본값으로 생성하면 500 상태 코드와 INTERNAL_SERVER_ERROR 코드를 가진다", () => {
    const err = new AppError("서버 오류");
    expect(err.message).toBe("서버 오류");
    expect(err.statusCode).toBe(500);
    expect(err.code).toBe("INTERNAL_SERVER_ERROR");
    expect(err.details).toBeUndefined();
    expect(err.name).toBe("AppError");
    expect(err).toBeInstanceOf(Error);
  });

  it("커스텀 값으로 생성할 수 있다", () => {
    const err = new AppError("잘못된 요청", 400, "MISSING_REQUIRED_FIELD", {
      field: "name",
    });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("MISSING_REQUIRED_FIELD");
    expect(err.details).toEqual({ field: "name" });
  });

  it("fromCode()는 ERROR_STATUS_MAP에서 상태 코드를 자동 결정한다", () => {
    const err = AppError.fromCode("STYLE_NOT_FOUND", "스타일 없음");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("STYLE_NOT_FOUND");
    expect(err.message).toBe("스타일 없음");
  });

  it("fromCode()에 details를 전달할 수 있다", () => {
    const err = AppError.fromCode("INVALID_PAGINATION", "페이지 오류", {
      page: -1,
    });
    expect(err.statusCode).toBe(400);
    expect(err.details).toEqual({ page: -1 });
  });
});

describe("NotFoundError", () => {
  it("리소스명과 에러 코드로 생성하면 404 상태 코드를 가진다", () => {
    const err = new NotFoundError("카테고리", "CATEGORY_NOT_FOUND");
    expect(err.message).toBe("카테고리을(를) 찾을 수 없습니다");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("CATEGORY_NOT_FOUND");
    expect(err.name).toBe("NotFoundError");
    expect(err).toBeInstanceOf(AppError);
  });

  it("PRODUCT_NOT_FOUND 코드도 404를 반환한다", () => {
    const err = new NotFoundError("상품", "PRODUCT_NOT_FOUND");
    expect(err.statusCode).toBe(404);
    expect(err.code).toBe("PRODUCT_NOT_FOUND");
  });
});

describe("ValidationError", () => {
  it("기본 에러 코드는 MISSING_REQUIRED_FIELD이다", () => {
    const err = new ValidationError("필수 값 누락");
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("MISSING_REQUIRED_FIELD");
    expect(err.name).toBe("ValidationError");
    expect(err).toBeInstanceOf(AppError);
  });

  it("커스텀 코드와 details를 전달할 수 있다", () => {
    const err = new ValidationError("정렬 값 오류", "INVALID_SORT_VALUE", {
      allowed: ["price", "brand"],
    });
    expect(err.statusCode).toBe(400);
    expect(err.code).toBe("INVALID_SORT_VALUE");
    expect(err.details).toEqual({ allowed: ["price", "brand"] });
  });
});
