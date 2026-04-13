import { describe, it, expect, vi, beforeEach } from "vitest";

// ── Prisma mock ──
const mockFindMany = vi.fn();
const mockUpdate = vi.fn();
vi.mock("@/lib/prisma", () => ({
  prisma: {
    purchaseLink: {
      findMany: (...args: unknown[]) => mockFindMany(...args),
      update: (...args: unknown[]) => mockUpdate(...args),
    },
    similarProduct: {
      update: (...args: unknown[]) => mockUpdate(...args),
    },
  },
}));

// ── Cache mock ──
const mockInvalidateCache = vi.fn();
vi.mock("@/lib/cache", () => ({
  invalidateCache: (...args: unknown[]) => mockInvalidateCache(...args),
  CACHE_TTL: { CATEGORY: 86400, STYLE_DETAIL: 600, PRODUCT_DETAIL: 600, LIST: 300, PRICE: 180 },
  withCache: vi.fn(),
  buildCacheKey: vi.fn(),
}));

// ── Logger mock ──
vi.mock("@/lib/logger", () => ({
  logger: { info: vi.fn(), error: vi.fn(), warn: vi.fn(), debug: vi.fn() },
}));

import { crawlLink, crawlAll, updateRepresentativePrice } from "./crawl";

// ── 테스트용 fixture HTML ──
const DETAIL_HTML = `
<div>
  <span class="product-title">테스트 상품</span>
  <a class="product-brand">테스트 브랜드</a>
  <span class="price_cur">45,000원</span>
  <img id="product-img" src="https://img.test/1.jpg" />
</div>
`;

const SOLD_OUT_HTML = `
<div>
  <span class="product-title">품절 상품</span>
  <a class="product-brand">브랜드</a>
  <span class="price_cur">30,000원</span>
  <span class="sold-out-text">품절</span>
</div>
`;

const CM29_DETAIL_HTML = `
<div>
  <h2 class="product-detail__name">테스트 상품</h2>
  <a class="product-detail__brand">테스트 브랜드</a>
  <span class="product-detail__price">45,000원</span>
  <img class="product-detail__img" src="https://img.test/1.jpg" />
</div>
`;

const WCONCEPT_DETAIL_HTML = `
<div>
  <h1 class="prd-detail__name">테스트 상품</h1>
  <a class="prd-detail__brand">테스트 브랜드</a>
  <em class="prd-detail__price">45,000원</em>
  <img class="prd-detail__img" src="https://img.test/1.jpg" />
</div>
`;

/** URL 도메인에 따라 플랫폼별 HTML 반환 */
const platformAwareFetchFn = vi.fn().mockImplementation((url: string) => {
  if (url.includes("29cm")) return Promise.resolve(CM29_DETAIL_HTML);
  if (url.includes("wconcept")) return Promise.resolve(WCONCEPT_DETAIL_HTML);
  return Promise.resolve(DETAIL_HTML);
});

const UNPARSEABLE_HTML = `<div>아무 내용 없음</div>`;

const makeLink = (overrides: Partial<{
  id: string;
  productId: string;
  platformName: string;
  productUrl: string;
  price: number;
}> = {}) => ({
  id: "link-1",
  productId: "prod-1",
  platformName: "무신사",
  productUrl: "https://www.musinsa.com/app/goods/12345",
  price: 50000,
  ...overrides,
});

beforeEach(() => {
  vi.clearAllMocks();
  mockUpdate.mockResolvedValue({});
});

// ─── crawlLink ───

describe("crawlLink", () => {
  it("HTML 파싱 성공 시 DB를 업데이트하고 성공 결과를 반환한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(DETAIL_HTML);
    const link = makeLink();

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(true);
    expect(result.newPrice).toBe(45000);
    expect(result.oldPrice).toBe(50000);
    expect(fetchFn).toHaveBeenCalledWith(link.productUrl);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: expect.objectContaining({
        price: 45000,
        inStock: true,
      }),
    });
  });

  it("품절 상품이면 inStock을 false로 업데이트한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(SOLD_OUT_HTML);
    const link = makeLink();

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(true);
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "link-1" },
      data: expect.objectContaining({ inStock: false }),
    });
  });

  it("지원하지 않는 플랫폼이면 실패 결과를 반환한다", async () => {
    const fetchFn = vi.fn();
    const link = makeLink({ platformName: "알리익스프레스" });

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(false);
    expect(result.error).toContain("지원하지 않는 플랫폼");
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("fetch 실패 시 SCRAPER_TARGET_UNREACHABLE 에러 코드를 반환한다", async () => {
    const fetchFn = vi.fn().mockRejectedValue(new Error("네트워크 오류"));
    const link = makeLink();

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(false);
    expect(result.error).toContain("네트워크 오류");
    expect(result.errorCode).toBe("SCRAPER_TARGET_UNREACHABLE");
    expect(mockUpdate).not.toHaveBeenCalled();
  });

  it("파싱 결과가 null이면 SCRAPER_PARSE_FAILED 에러 코드를 반환한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(UNPARSEABLE_HTML);
    const link = makeLink();

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(false);
    expect(result.error).toContain("파싱 실패");
    expect(result.errorCode).toBe("SCRAPER_PARSE_FAILED");
  });

  it("DB 업데이트 실패 시 INTERNAL_SERVER_ERROR 에러 코드를 반환한다", async () => {
    const fetchFn = vi.fn().mockResolvedValue(DETAIL_HTML);
    mockUpdate.mockRejectedValueOnce(new Error("DB 연결 오류"));
    const link = makeLink();

    const result = await crawlLink(link, fetchFn);

    expect(result.success).toBe(false);
    expect(result.errorCode).toBe("INTERNAL_SERVER_ERROR");
    expect(result.newPrice).toBe(45000);
  });
});

// ─── updateRepresentativePrice ───

describe("updateRepresentativePrice", () => {
  it("최저가로 representativePrice를 갱신한다", async () => {
    mockFindMany.mockResolvedValue([{ price: 35000 }]);

    await updateRepresentativePrice("prod-1");

    expect(mockFindMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { productId: "prod-1", inStock: true },
        orderBy: { price: "asc" },
        take: 1,
      }),
    );
    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { representativePrice: 35000 },
    });
  });

  it("재고 있는 링크가 없으면 representativePrice를 0으로 설정한다", async () => {
    mockFindMany.mockResolvedValue([]);

    await updateRepresentativePrice("prod-1");

    expect(mockUpdate).toHaveBeenCalledWith({
      where: { id: "prod-1" },
      data: { representativePrice: 0 },
    });
  });
});

// ─── crawlAll ───

describe("crawlAll", () => {
  it("전체 링크를 크롤링하고 요약 결과를 반환한다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", productId: "prod-1", price: 50000 }),
      makeLink({ id: "link-2", productId: "prod-1", price: 60000 }),
    ]);
    // updateRepresentativePrice 내부 호출용
    mockFindMany.mockResolvedValue([{ price: 45000 }]);

    const fetchFn = vi.fn().mockResolvedValue(DETAIL_HTML);

    const summary = await crawlAll(fetchFn);

    expect(summary.total).toBe(2);
    expect(summary.success).toBe(2);
    expect(summary.failed).toBe(0);
    expect(summary.skipped).toBe(0);
    expect(summary.duration).toBeGreaterThanOrEqual(0);
  });

  it("가격 변경 시 캐시를 무효화한다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", productId: "prod-1", price: 50000 }),
    ]);
    mockFindMany.mockResolvedValue([{ price: 45000 }]);

    const fetchFn = vi.fn().mockResolvedValue(DETAIL_HTML);

    await crawlAll(fetchFn);

    // 상품 캐시 + 스타일 캐시 무효화
    expect(mockInvalidateCache).toHaveBeenCalledWith("product:prod-1*");
    expect(mockInvalidateCache).toHaveBeenCalledWith("styles:*");
    expect(mockInvalidateCache).toHaveBeenCalledWith("style:*");
  });

  it("가격 변경이 없으면 캐시를 무효화하지 않는다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", productId: "prod-1", price: 45000 }),
    ]);

    const fetchFn = vi.fn().mockResolvedValue(DETAIL_HTML);

    await crawlAll(fetchFn);

    expect(mockInvalidateCache).not.toHaveBeenCalled();
  });

  it("미지원 플랫폼은 skipped로 카운트한다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", platformName: "쿠팡" }),
    ]);

    const fetchFn = vi.fn();

    const summary = await crawlAll(fetchFn);

    expect(summary.skipped).toBe(1);
    expect(summary.success).toBe(0);
    expect(fetchFn).not.toHaveBeenCalled();
  });

  it("링크가 없으면 빈 요약을 반환한다", async () => {
    mockFindMany.mockResolvedValueOnce([]);

    const summary = await crawlAll(vi.fn());

    expect(summary.total).toBe(0);
    expect(summary.success).toBe(0);
    expect(summary.failed).toBe(0);
  });

  it("서로 다른 플랫폼은 병렬로 실행한다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", productId: "prod-1", platformName: "무신사", productUrl: "https://www.musinsa.com/goods/1", price: 50000 }),
      makeLink({ id: "link-2", productId: "prod-2", platformName: "29cm", productUrl: "https://www.29cm.co.kr/product/2", price: 60000 }),
      makeLink({ id: "link-3", productId: "prod-3", platformName: "w컨셉", productUrl: "https://www.wconcept.co.kr/Product/3", price: 70000 }),
    ]);
    mockFindMany.mockResolvedValue([{ price: 45000 }]);

    platformAwareFetchFn.mockClear();
    const summary = await crawlAll(platformAwareFetchFn);

    expect(summary.total).toBe(3);
    expect(summary.success).toBe(3);
    expect(summary.skipped).toBe(0);
    expect(platformAwareFetchFn).toHaveBeenCalledTimes(3);
  });

  it("지원/미지원 플랫폼이 섞여 있으면 각각 올바르게 집계한다", async () => {
    mockFindMany.mockResolvedValueOnce([
      makeLink({ id: "link-1", platformName: "무신사", productUrl: "https://www.musinsa.com/goods/1", price: 50000 }),
      makeLink({ id: "link-2", platformName: "쿠팡", price: 30000 }),
      makeLink({ id: "link-3", platformName: "29cm", productUrl: "https://www.29cm.co.kr/product/3", price: 60000 }),
      makeLink({ id: "link-4", platformName: "cos 공식몰", price: 90000 }),
    ]);
    mockFindMany.mockResolvedValue([{ price: 45000 }]);

    platformAwareFetchFn.mockClear();
    const summary = await crawlAll(platformAwareFetchFn);

    expect(summary.total).toBe(4);
    expect(summary.success).toBe(2);   // 무신사, 29CM
    expect(summary.skipped).toBe(2);   // 쿠팡, COS 공식몰
    expect(platformAwareFetchFn).toHaveBeenCalledTimes(2);
  });
});
