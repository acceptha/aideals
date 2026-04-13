import { describe, it, expect } from "vitest";
import { readFileSync } from "fs";
import { resolve } from "path";
import {
  parseMusinsaProductList,
  parseMusinsaProductDetail,
  musinsaScraper,
} from "./musinsa";
import { parsePrice } from "./utils";

const readFixture = (filename: string): string =>
  readFileSync(resolve(__dirname, "__fixtures__", filename), "utf-8");

// ─── parsePrice ───

describe("parsePrice", () => {
  it("쉼표가 포함된 가격 문자열에서 숫자를 추출한다", () => {
    expect(parsePrice("89,900원")).toBe(89900);
  });

  it("원화 기호가 포함된 가격을 처리한다", () => {
    expect(parsePrice("₩49,000")).toBe(49000);
  });

  it("숫자만 있는 문자열을 처리한다", () => {
    expect(parsePrice("65000")).toBe(65000);
  });

  it("숫자가 없는 문자열이면 0을 반환한다", () => {
    expect(parsePrice("가격 미정")).toBe(0);
  });

  it("빈 문자열이면 0을 반환한다", () => {
    expect(parsePrice("")).toBe(0);
  });
});

// ─── parseMusinsaProductList ───

describe("parseMusinsaProductList", () => {
  const html = readFixture("musinsa-product-list.html");

  it("fixture에서 상품 3개를 파싱한다", () => {
    const products = parseMusinsaProductList(html);
    expect(products).toHaveLength(3);
  });

  it("첫 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseMusinsaProductList(html);
    const first = products[0];

    expect(first.productName).toBe("오버핏 블레이저 - 블랙");
    expect(first.brandName).toBe("무신사 스탠다드");
    expect(first.price).toBe(89900);
    expect(first.imageUrl).toBe(
      "https://image.musinsa.com/images/goods_img/12345.jpg",
    );
    expect(first.productUrl).toBe("https://www.musinsa.com/app/goods/12345");
    expect(first.inStock).toBe(true);
  });

  it("두 번째 상품의 필드를 올바르게 추출한다", () => {
    const products = parseMusinsaProductList(html);
    const second = products[1];

    expect(second.productName).toBe("와이드 핏 슬랙스");
    expect(second.brandName).toBe("커버낫");
    expect(second.price).toBe(49000);
    expect(second.inStock).toBe(true);
  });

  it("품절 상품의 inStock을 false로 반환한다", () => {
    const products = parseMusinsaProductList(html);
    const soldOut = products[2];

    expect(soldOut.productName).toBe("크롭 니트 가디건");
    expect(soldOut.brandName).toBe("디스이즈네버댓");
    expect(soldOut.price).toBe(65000);
    expect(soldOut.inStock).toBe(false);
  });

  it("상대 경로를 절대 URL로 변환한다", () => {
    const products = parseMusinsaProductList(html);
    products.forEach((p) => {
      if (p.productUrl) {
        expect(p.productUrl).toMatch(/^https:\/\//);
      }
    });
  });

  it("빈 HTML이면 빈 배열을 반환한다", () => {
    expect(parseMusinsaProductList("")).toEqual([]);
  });

  it("product-card가 없는 HTML이면 빈 배열을 반환한다", () => {
    expect(parseMusinsaProductList("<div>no cards</div>")).toEqual([]);
  });

  it("필수 필드(상품명/브랜드/가격)가 누락된 카드는 건너뛴다", () => {
    const incomplete = `
      <ul>
        <li class="product-card">
          <span class="product-card__brand">브랜드만</span>
        </li>
      </ul>
    `;
    expect(parseMusinsaProductList(incomplete)).toEqual([]);
  });
});

// ─── parseMusinsaProductDetail ───

describe("parseMusinsaProductDetail", () => {
  const html = readFixture("musinsa-product-detail.html");

  it("상세 페이지에서 상품 정보를 추출한다", () => {
    const product = parseMusinsaProductDetail(html);

    expect(product).not.toBeNull();
    expect(product!.productName).toBe("오버핏 블레이저 - 블랙");
    expect(product!.brandName).toBe("무신사 스탠다드");
    expect(product!.price).toBe(89900);
    expect(product!.imageUrl).toBe(
      "https://image.musinsa.com/images/goods_img/12345_detail.jpg",
    );
    expect(product!.inStock).toBe(true);
  });

  it("productUrl은 빈 문자열로 반환한다 (호출측에서 설정)", () => {
    const product = parseMusinsaProductDetail(html);
    expect(product!.productUrl).toBe("");
  });

  it("품절 표시가 있으면 inStock을 false로 반환한다", () => {
    const soldOutHtml = `
      <div>
        <span class="product-title">품절 상품</span>
        <span class="product-brand">브랜드</span>
        <span class="price_cur">39,900원</span>
        <span class="sold-out-text">품절</span>
      </div>
    `;
    const product = parseMusinsaProductDetail(soldOutHtml);
    expect(product).not.toBeNull();
    expect(product!.inStock).toBe(false);
  });

  it("필수 필드가 누락되면 null을 반환한다", () => {
    expect(parseMusinsaProductDetail("<div>empty</div>")).toBeNull();
  });

  it("상품명만 있고 나머지가 없으면 null을 반환한다", () => {
    const partial = `<span class="product-title">상품명만</span>`;
    expect(parseMusinsaProductDetail(partial)).toBeNull();
  });

  it("빈 HTML이면 null을 반환한다", () => {
    expect(parseMusinsaProductDetail("")).toBeNull();
  });
});

// ─── musinsaScraper 객체 ───

describe("musinsaScraper", () => {
  it("platform이 'musinsa'이다", () => {
    expect(musinsaScraper.platform).toBe("musinsa");
  });

  it("displayName이 '무신사'이다", () => {
    expect(musinsaScraper.displayName).toBe("무신사");
  });

  it("parseProductList가 함수이다", () => {
    expect(typeof musinsaScraper.parseProductList).toBe("function");
  });

  it("parseProductDetail이 함수이다", () => {
    expect(typeof musinsaScraper.parseProductDetail).toBe("function");
  });
});
