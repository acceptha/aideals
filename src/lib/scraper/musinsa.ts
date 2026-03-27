/**
 * 무신사 HTML 파서
 *
 * 무신사 상품 목록/상세 페이지의 HTML을 파싱하여
 * ScrapedProduct 형태로 변환한다.
 *
 * ⚠️ 외부 사이트의 HTML 구조가 변경되면 이 파서도 수정해야 한다.
 *    파서 변경 시 반드시 fixture 기반 테스트를 업데이트한다.
 */

import type { PlatformScraper, ScrapedProduct } from "@/types/scraper";

/** HTML에서 텍스트를 추출하고 앞뒤 공백을 제거하는 헬퍼 */
const extractText = (html: string, regex: RegExp): string | null => {
  const match = html.match(regex);
  return match?.[1]?.trim() ?? null;
};

/** 가격 문자열 ("29,900원", "₩29,900" 등)에서 숫자만 추출 */
export const parsePrice = (priceStr: string): number => {
  const digits = priceStr.replace(/[^0-9]/g, "");
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/** 무신사 상품 목록 HTML에서 개별 상품 카드를 추출 */
export const parseMusinsaProductList = (html: string): ScrapedProduct[] => {
  const products: ScrapedProduct[] = [];

  // 상품 카드 블록 추출 (data-product-id 또는 class="product-card" 등)
  const cardRegex =
    /<li[^>]*class="[^"]*product-card[^"]*"[^>]*>([\s\S]*?)<\/li>/gi;
  let cardMatch;

  while ((cardMatch = cardRegex.exec(html)) !== null) {
    const cardHtml = cardMatch[1];

    const productName = extractText(
      cardHtml,
      /<a[^>]*class="[^"]*product-card__name[^"]*"[^>]*>([^<]+)<\/a>/i
    );
    const brandName = extractText(
      cardHtml,
      /<span[^>]*class="[^"]*product-card__brand[^"]*"[^>]*>([^<]+)<\/span>/i
    );
    const priceStr = extractText(
      cardHtml,
      /<span[^>]*class="[^"]*product-card__price[^"]*"[^>]*>([^<]+)<\/span>/i
    );
    const imageUrl = extractText(
      cardHtml,
      /<img[^>]*src="([^"]+)"[^>]*class="[^"]*product-card__img[^"]*"/i
    ) ?? extractText(
      cardHtml,
      /<img[^>]*class="[^"]*product-card__img[^"]*"[^>]*src="([^"]+)"/i
    );
    const productUrl = extractText(
      cardHtml,
      /<a[^>]*href="([^"]+)"[^>]*class="[^"]*product-card__link[^"]*"/i
    ) ?? extractText(
      cardHtml,
      /<a[^>]*class="[^"]*product-card__link[^"]*"[^>]*href="([^"]+)"/i
    );

    // 품절 여부 확인
    const isSoldOut = /sold[\s-]*out|품절/i.test(cardHtml);

    if (productName && brandName && priceStr) {
      products.push({
        productName,
        brandName,
        price: parsePrice(priceStr),
        imageUrl: imageUrl ?? "",
        productUrl: productUrl
          ? productUrl.startsWith("http")
            ? productUrl
            : `https://www.musinsa.com${productUrl}`
          : "",
        inStock: !isSoldOut,
      });
    }
  }

  return products;
};

/** 무신사 상품 상세 페이지 HTML에서 상품 정보 추출 */
export const parseMusinsaProductDetail = (
  html: string
): ScrapedProduct | null => {
  const productName = extractText(
    html,
    /<span[^>]*class="[^"]*product-title[^"]*"[^>]*>([^<]+)<\/span>/i
  ) ?? extractText(
    html,
    /<h2[^>]*class="[^"]*product_title[^"]*"[^>]*>([^<]+)<\/h2>/i
  );

  const brandName = extractText(
    html,
    /<a[^>]*class="[^"]*product-brand[^"]*"[^>]*>([^<]+)<\/a>/i
  ) ?? extractText(
    html,
    /<span[^>]*class="[^"]*brand_name[^"]*"[^>]*>([^<]+)<\/span>/i
  );

  const priceStr = extractText(
    html,
    /<span[^>]*class="[^"]*price_cur[^"]*"[^>]*>[^0-9]*([0-9,]+)[^<]*<\/span>/i
  ) ?? extractText(
    html,
    /<em[^>]*class="[^"]*sale_price[^"]*"[^>]*>([^<]+)<\/em>/i
  );

  const imageUrl = extractText(
    html,
    /<img[^>]*id="[^"]*product[_-]?img[^"]*"[^>]*src="([^"]+)"/i
  ) ?? extractText(
    html,
    /<img[^>]*class="[^"]*product-img[^"]*"[^>]*src="([^"]+)"/i
  );

  const isSoldOut = /sold[\s-]*out|품절|일시\s*품절/i.test(html);

  if (!productName || !brandName || !priceStr) {
    return null;
  }

  return {
    productName,
    brandName,
    price: parsePrice(priceStr),
    imageUrl: imageUrl ?? "",
    productUrl: "", // 상세 페이지에서는 이미 URL을 알고 있으므로 호출측에서 설정
    inStock: !isSoldOut,
  };
};

/** 무신사 크롤러 객체 */
export const musinsaScraper: PlatformScraper = {
  platform: "musinsa",
  displayName: "무신사",
  parseProductList: parseMusinsaProductList,
  parseProductDetail: parseMusinsaProductDetail,
};
