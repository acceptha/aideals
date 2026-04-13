import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  parseCm29ProductList,
  parseCm29ProductDetail,
  cm29Scraper,
} from "./cm29";

const readFixture = (filename: string): string =>
  readFileSync(resolve(__dirname, "__fixtures__", filename), "utf-8");

// ─── parseCm29ProductList ───

describe("parseCm29ProductList", () => {
  const html = readFixture("cm29-product-list.html");

  it("fixture에서 상품 3개를 파싱한다", () => {
    const products = parseCm29ProductList(html);
    expect(products).toHaveLength(3);
  });

  it("첫 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseCm29ProductList(html);
    const first = products[0];

    expect(first.productName).toBe("오버사이즈 린넨 셔츠 - 아이보리");
    expect(first.brandName).toBe("마뗑킴");
    expect(first.price).toBe(78000);
    expect(first.imageUrl).toBe("https://img.29cm.co.kr/item/30001_main.jpg");
    expect(first.productUrl).toBe("https://www.29cm.co.kr/product/30001");
    expect(first.inStock).toBe(true);
  });

  it("두 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseCm29ProductList(html);
    const second = products[1];

    expect(second.productName).toBe("스트레이트 데님 팬츠");
    expect(second.brandName).toBe("아더에러");
    expect(second.price).toBe(128000);
    expect(second.inStock).toBe(true);
  });

  it("품절 상품의 inStock을 false로 반환한다", () => {
    const products = parseCm29ProductList(html);
    const soldOut = products[2];

    expect(soldOut.productName).toBe("캐시미어 블렌드 니트");
    expect(soldOut.inStock).toBe(false);
  });

  it("상대 경로를 절대 URL로 변환한다", () => {
    const products = parseCm29ProductList(html);
    products.forEach((p) => {
      if (p.productUrl) {
        expect(p.productUrl).toMatch(/^https:\/\//);
      }
    });
  });

  it("빈 HTML이면 빈 배열을 반환한다", () => {
    expect(parseCm29ProductList("")).toEqual([]);
  });

  it("필수 필드가 누락된 아이템은 건너뛴다", () => {
    const incomplete = `
      <div class="product-item">
        <div class="product-item__info">
          <p class="product-item__brand">브랜드만</p>
        </div>
      </div>
    `;
    expect(parseCm29ProductList(incomplete)).toEqual([]);
  });
});

// ─── parseCm29ProductDetail ───

describe("parseCm29ProductDetail", () => {
  const html = readFixture("cm29-product-detail.html");

  it("상세 페이지에서 상품 정보를 추출한다", () => {
    const product = parseCm29ProductDetail(html);

    expect(product).not.toBeNull();
    expect(product!.productName).toBe("오버사이즈 린넨 셔츠 - 아이보리");
    expect(product!.brandName).toBe("마뗑킴");
    expect(product!.price).toBe(78000);
    expect(product!.imageUrl).toBe("https://img.29cm.co.kr/item/30001_detail.jpg");
    expect(product!.inStock).toBe(true);
  });

  it("productUrl은 빈 문자열로 반환한다", () => {
    const product = parseCm29ProductDetail(html);
    expect(product!.productUrl).toBe("");
  });

  it("품절 표시가 있으면 inStock을 false로 반환한다", () => {
    const soldOutHtml = `
      <div>
        <h2 class="product-detail__name">품절 상품</h2>
        <a class="product-detail__brand">브랜드</a>
        <span class="product-detail__price">55,000원</span>
        <span class="product-detail__soldout">일시 품절</span>
      </div>
    `;
    const product = parseCm29ProductDetail(soldOutHtml);
    expect(product!.inStock).toBe(false);
  });

  it("필수 필드가 누락되면 null을 반환한다", () => {
    expect(parseCm29ProductDetail("<div>empty</div>")).toBeNull();
  });

  it("빈 HTML이면 null을 반환한다", () => {
    expect(parseCm29ProductDetail("")).toBeNull();
  });
});

// ─── cm29Scraper 객체 ───

describe("cm29Scraper", () => {
  it("platform이 'cm29'이다", () => {
    expect(cm29Scraper.platform).toBe("cm29");
  });

  it("displayName이 '29CM'이다", () => {
    expect(cm29Scraper.displayName).toBe("29CM");
  });
});
