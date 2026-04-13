/**
 * 무신사 HTML 파서 (Cheerio 기반)
 *
 * 무신사 상품 목록/상세 페이지의 HTML을 파싱하여
 * ScrapedProduct 형태로 변환한다.
 *
 * ⚠️ 외부 사이트의 HTML 구조가 변경되면 이 파서도 수정해야 한다.
 *    파서 변경 시 반드시 fixture 기반 테스트를 업데이트한다.
 */

import * as cheerio from "cheerio";
import type { PlatformScraper, ScrapedProduct } from "@/types/scraper";
import { parsePrice } from "./utils";

/** 상대 경로를 절대 URL로 변환 */
const toAbsoluteUrl = (url: string): string =>
  url.startsWith("http") ? url : `https://www.musinsa.com${url}`;

/** 무신사 상품 목록 HTML에서 개별 상품 카드를 추출 */
export const parseMusinsaProductList = (html: string): ScrapedProduct[] => {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $("li.product-card").each((_, el) => {
    const $card = $(el);

    const productName = $card.find(".product-card__name").text().trim();
    const brandName = $card.find(".product-card__brand").text().trim();
    const priceStr = $card.find(".product-card__price").text().trim();
    const imageUrl = $card.find(".product-card__img").attr("src") ?? "";
    const productUrl = $card.find(".product-card__link").attr("href") ?? "";

    const isSoldOut =
      $card.hasClass("sold-out") ||
      $card.find(".badge-soldout").length > 0;

    if (productName && brandName && priceStr) {
      products.push({
        productName,
        brandName,
        price: parsePrice(priceStr),
        imageUrl,
        productUrl: productUrl ? toAbsoluteUrl(productUrl) : "",
        inStock: !isSoldOut,
      });
    }
  });

  return products;
};

/** 무신사 상품 상세 페이지 HTML에서 상품 정보 추출 */
export const parseMusinsaProductDetail = (
  html: string,
): ScrapedProduct | null => {
  const $ = cheerio.load(html);

  const productName =
    $(".product-title").text().trim() ||
    $(".product_title").text().trim();

  const brandName =
    $(".product-brand").text().trim() ||
    $(".brand_name").text().trim();

  const priceStr =
    $(".price_cur").text().trim() ||
    $(".sale_price").text().trim();

  const imageUrl =
    $("#product-img").attr("src") ??
    $("#product_img").attr("src") ??
    $(".product-img").attr("src") ??
    "";

  const isSoldOut =
    $(".sold-out-text").length > 0 ||
    $(".btn-soldout").length > 0 ||
    $(".product-detail").hasClass("sold-out");

  if (!productName || !brandName || !priceStr) {
    return null;
  }

  return {
    productName,
    brandName,
    price: parsePrice(priceStr),
    imageUrl,
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
