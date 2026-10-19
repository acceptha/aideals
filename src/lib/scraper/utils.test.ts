import { describe, it, expect } from "vitest";
import { isSearchPageUrl, parsePrice } from "./utils";

describe("parsePrice", () => {
  it("가격 문자열에서 숫자만 추출한다", () => {
    expect(parsePrice("29,900원")).toBe(29900);
    expect(parsePrice("₩1,234")).toBe(1234);
    expect(parsePrice("가격 없음")).toBe(0);
  });
});

describe("isSearchPageUrl", () => {
  it("플랫폼 검색 결과 URL을 판별한다", () => {
    expect(isSearchPageUrl("https://www.musinsa.com/search/goods?keyword=a")).toBe(true);
    expect(isSearchPageUrl("https://www.29cm.co.kr/store/search?keyword=a")).toBe(true);
    expect(isSearchPageUrl("https://display.wconcept.co.kr/search?kwd=a")).toBe(true);
    expect(isSearchPageUrl("https://www.coupang.com/np/search?q=a")).toBe(true);
    expect(isSearchPageUrl("https://www.cos.com/ko-kr/dpo/searchResult.html?searchQuery=a")).toBe(true);
  });

  it("상품 상세 URL은 검색 페이지로 보지 않는다", () => {
    expect(isSearchPageUrl("https://www.musinsa.com/app/goods/12345")).toBe(false);
    expect(isSearchPageUrl("https://www.29cm.co.kr/products/12345")).toBe(false);
    expect(isSearchPageUrl("https://www.wconcept.co.kr/Product/12345?keyword=a")).toBe(false);
    expect(isSearchPageUrl("not a url")).toBe(false);
  });
});
