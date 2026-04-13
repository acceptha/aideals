import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  parseWconceptProductList,
  parseWconceptProductDetail,
  wconceptScraper,
} from "./wconcept";

const readFixture = (filename: string): string =>
  readFileSync(resolve(__dirname, "__fixtures__", filename), "utf-8");

// ─── parseWconceptProductList ───

describe("parseWconceptProductList", () => {
  const html = readFixture("wconcept-product-list.html");

  it("fixture에서 상품 3개를 파싱한다", () => {
    const products = parseWconceptProductList(html);
    expect(products).toHaveLength(3);
  });

  it("첫 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseWconceptProductList(html);
    const first = products[0];

    expect(first.productName).toBe("클래식 트위드 재킷 - 네이비");
    expect(first.brandName).toBe("시에");
    expect(first.price).toBe(198000);
    expect(first.imageUrl).toBe("https://img.wconcept.co.kr/product/WC5001.jpg");
    expect(first.productUrl).toBe(
      "https://www.wconcept.co.kr/Product/Detail?productNo=WC5001",
    );
    expect(first.inStock).toBe(true);
  });

  it("두 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseWconceptProductList(html);
    const second = products[1];

    expect(second.productName).toBe("롱 플리츠 스커트");
    expect(second.brandName).toBe("르메르");
    expect(second.price).toBe(245000);
    expect(second.inStock).toBe(true);
  });

  it("품절 상품의 inStock을 false로 반환한다", () => {
    const products = parseWconceptProductList(html);
    const soldOut = products[2];

    expect(soldOut.productName).toBe("더블 캐시미어 코트");
    expect(soldOut.inStock).toBe(false);
  });

  it("상대 경로를 절대 URL로 변환한다", () => {
    const products = parseWconceptProductList(html);
    products.forEach((p) => {
      if (p.productUrl) {
        expect(p.productUrl).toMatch(/^https:\/\//);
      }
    });
  });

  it("빈 HTML이면 빈 배열을 반환한다", () => {
    expect(parseWconceptProductList("")).toEqual([]);
  });

  it("필수 필드가 누락된 아이템은 건너뛴다", () => {
    const incomplete = `
      <li class="product-list__item">
        <div class="product-list__detail">
          <span class="product-list__brand">브랜드만</span>
        </div>
      </li>
    `;
    expect(parseWconceptProductList(incomplete)).toEqual([]);
  });
});

// ─── parseWconceptProductDetail ───

describe("parseWconceptProductDetail", () => {
  const html = readFixture("wconcept-product-detail.html");

  it("상세 페이지에서 상품 정보를 추출한다", () => {
    const product = parseWconceptProductDetail(html);

    expect(product).not.toBeNull();
    expect(product!.productName).toBe("클래식 트위드 재킷 - 네이비");
    expect(product!.brandName).toBe("시에");
    expect(product!.price).toBe(198000);
    expect(product!.imageUrl).toBe(
      "https://img.wconcept.co.kr/product/WC5001_detail.jpg",
    );
    expect(product!.inStock).toBe(true);
  });

  it("productUrl은 빈 문자열로 반환한다", () => {
    const product = parseWconceptProductDetail(html);
    expect(product!.productUrl).toBe("");
  });

  it("품절 표시가 있으면 inStock을 false로 반환한다", () => {
    const soldOutHtml = `
      <div>
        <h1 class="prd-detail__name">품절 상품</h1>
        <a class="prd-detail__brand">브랜드</a>
        <em class="prd-detail__price">320,000원</em>
        <span class="prd-detail__soldout">Sold Out</span>
      </div>
    `;
    const product = parseWconceptProductDetail(soldOutHtml);
    expect(product!.inStock).toBe(false);
  });

  it("필수 필드가 누락되면 null을 반환한다", () => {
    expect(parseWconceptProductDetail("<div>empty</div>")).toBeNull();
  });

  it("빈 HTML이면 null을 반환한다", () => {
    expect(parseWconceptProductDetail("")).toBeNull();
  });
});

// ─── wconceptScraper 객체 ───

describe("wconceptScraper", () => {
  it("platform이 'wconcept'이다", () => {
    expect(wconceptScraper.platform).toBe("wconcept");
  });

  it("displayName이 'W컨셉'이다", () => {
    expect(wconceptScraper.displayName).toBe("W컨셉");
  });
});
