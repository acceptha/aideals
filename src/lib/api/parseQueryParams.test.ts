// src/lib/api/parseQueryParams.test.ts
import { describe, it, expect } from "vitest";
import { NextRequest } from "next/server";
import { parseQueryParams } from "./parseQueryParams";
import { ValidationError } from "./errors";
import type { ParamRules } from "./parseQueryParams";

const createRequest = (params: Record<string, string> = {}) => {
  const url = new URL("http://localhost:3000/api/test");
  for (const [key, value] of Object.entries(params)) {
    url.searchParams.set(key, value);
  }
  return new NextRequest(url);
};

describe("parseQueryParams", () => {
  describe("필수 파라미터", () => {
    it("required 파라미터가 누락되면 ValidationError를 throw한다", () => {
      const rules: ParamRules = {
        categoryId: { type: "string", required: true },
      };

      expect(() => parseQueryParams(createRequest(), rules)).toThrow(
        ValidationError,
      );
    });

    it("required 파라미터가 존재하면 정상 파싱한다", () => {
      const rules: ParamRules = {
        categoryId: { type: "string", required: true },
      };

      const result = parseQueryParams<{ categoryId: string }>(
        createRequest({ categoryId: "seed-cat-outer" }),
        rules,
      );
      expect(result.categoryId).toBe("seed-cat-outer");
    });
  });

  describe("기본값", () => {
    it("파라미터가 없으면 default 값을 사용한다", () => {
      const rules: ParamRules = {
        page: { type: "number", default: 1 },
        limit: { type: "number", default: 20 },
      };

      const result = parseQueryParams<{ page: number; limit: number }>(
        createRequest(),
        rules,
      );
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
    });

    it("파라미터가 있으면 default 대신 전달된 값을 사용한다", () => {
      const rules: ParamRules = {
        page: { type: "number", default: 1 },
      };

      const result = parseQueryParams<{ page: number }>(
        createRequest({ page: "3" }),
        rules,
      );
      expect(result.page).toBe(3);
    });
  });

  describe("number 타입", () => {
    it("숫자가 아닌 값이면 ValidationError를 throw한다", () => {
      const rules: ParamRules = { page: { type: "number" } };

      expect(() =>
        parseQueryParams(createRequest({ page: "abc" }), rules),
      ).toThrow(ValidationError);
    });

    it("min보다 작으면 ValidationError를 throw한다", () => {
      const rules: ParamRules = { page: { type: "number", min: 1 } };

      try {
        parseQueryParams(createRequest({ page: "0" }), rules);
        expect.fail("ValidationError가 throw되어야 한다");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe("INVALID_PAGINATION");
      }
    });

    it("max보다 크면 ValidationError를 throw한다", () => {
      const rules: ParamRules = { limit: { type: "number", max: 100 } };

      try {
        parseQueryParams(createRequest({ limit: "200" }), rules);
        expect.fail("ValidationError가 throw되어야 한다");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe("INVALID_PAGINATION");
      }
    });

    it("pagination이 아닌 number 필드는 INVALID_FILTER_VALUE 코드를 사용한다", () => {
      const rules: ParamRules = { price: { type: "number", min: 0 } };

      try {
        parseQueryParams(createRequest({ price: "-1" }), rules);
        expect.fail("ValidationError가 throw되어야 한다");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe("INVALID_FILTER_VALUE");
      }
    });

    it("min과 max 범위 내의 값은 정상 파싱한다", () => {
      const rules: ParamRules = {
        page: { type: "number", min: 1, max: 100 },
      };

      const result = parseQueryParams<{ page: number }>(
        createRequest({ page: "50" }),
        rules,
      );
      expect(result.page).toBe(50);
    });
  });

  describe("string enum", () => {
    it("허용되지 않는 값이면 ValidationError를 throw한다", () => {
      const rules: ParamRules = {
        gender: { type: "string", enum: ["male", "female"] },
      };

      try {
        parseQueryParams(createRequest({ gender: "unknown" }), rules);
        expect.fail("ValidationError가 throw되어야 한다");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe("INVALID_FILTER_VALUE");
      }
    });

    it("sort 필드의 enum 위반은 INVALID_SORT_VALUE 코드를 사용한다", () => {
      const rules: ParamRules = {
        sort: { type: "string", enum: ["price", "brand", "similarity"] },
      };

      try {
        parseQueryParams(createRequest({ sort: "invalid" }), rules);
        expect.fail("ValidationError가 throw되어야 한다");
      } catch (err) {
        expect(err).toBeInstanceOf(ValidationError);
        expect((err as ValidationError).code).toBe("INVALID_SORT_VALUE");
      }
    });

    it("허용된 enum 값은 정상 파싱한다", () => {
      const rules: ParamRules = {
        gender: { type: "string", enum: ["male", "female"] },
      };

      const result = parseQueryParams<{ gender: string }>(
        createRequest({ gender: "male" }),
        rules,
      );
      expect(result.gender).toBe("male");
    });
  });

  describe("boolean 타입", () => {
    it("'true'는 true로 변환한다", () => {
      const rules: ParamRules = { active: { type: "boolean" } };

      const result = parseQueryParams<{ active: boolean }>(
        createRequest({ active: "true" }),
        rules,
      );
      expect(result.active).toBe(true);
    });

    it("'1'은 true로 변환한다", () => {
      const rules: ParamRules = { active: { type: "boolean" } };

      const result = parseQueryParams<{ active: boolean }>(
        createRequest({ active: "1" }),
        rules,
      );
      expect(result.active).toBe(true);
    });

    it("그 외 값은 false로 변환한다", () => {
      const rules: ParamRules = { active: { type: "boolean" } };

      const result = parseQueryParams<{ active: boolean }>(
        createRequest({ active: "false" }),
        rules,
      );
      expect(result.active).toBe(false);
    });
  });

  describe("선택적 파라미터", () => {
    it("required가 아니고 default도 없으면 결과에 포함되지 않는다", () => {
      const rules: ParamRules = {
        color: { type: "string" },
      };

      const result = parseQueryParams<{ color?: string }>(
        createRequest(),
        rules,
      );
      expect(result.color).toBeUndefined();
    });
  });
});
