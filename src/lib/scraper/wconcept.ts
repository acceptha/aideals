/**
 * W컨셉 HTML 파서 (Cheerio 기반)
 *
 * W컨셉 상품 목록/상세 페이지의 HTML을 파싱하여
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
  url.startsWith("http") ? url : `https://www.wconcept.co.kr${url}`;

/** W컨셉 상품 목록 HTML에서 개별 상품을 추출 */
export const parseWconceptProductList = (html: string): ScrapedProduct[] => {
  const $ = cheerio.load(html);
  const products: ScrapedProduct[] = [];

  $(".product-list__item").each((_, el) => {
    const $item = $(el);

    const productName = $item.find(".product-list__name").text().trim();
    const brandName = $item.find(".product-list__brand").text().trim();
    const priceStr = $item.find(".product-list__price").text().trim();
    const imageUrl = $item.find(".product-list__img").attr("src") ?? "";
    const productUrl = $item.find(".product-list__link").attr("href") ?? "";

    const isSoldOut =
      $item.hasClass("product-list__item--soldout") ||
      $item.find(".product-list__badge-soldout").length > 0;

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

/** W컨셉 상품 상세 페이지 HTML에서 상품 정보 추출 */
export const parseWconceptProductDetail = (
  html: string,
): ScrapedProduct | null => {
  const $ = cheerio.load(html);

  const productName =
    $(".prd-detail__name").text().trim();

  const brandName =
    $(".prd-detail__brand").text().trim();

  const priceStr =
    $(".prd-detail__price").text().trim();

  const imageUrl =
    $(".prd-detail__img").attr("src") ?? "";

  const isSoldOut =
    $(".prd-detail__soldout").length > 0 ||
    $(".prd-detail__btn--disabled").length > 0 ||
    $(".prd-detail").hasClass("prd-detail--soldout");

  if (!productName || !brandName || !priceStr) {
    return null;
  }

  return {
    productName,
    brandName,
    price: parsePrice(priceStr),
    imageUrl,
    productUrl: "",
    inStock: !isSoldOut,
  };
};

/** W컨셉 크롤러 객체 */
export const wconceptScraper: PlatformScraper = {
  platform: "wconcept",
  displayName: "W컨셉",
  parseProductList: parseWconceptProductList,
  parseProductDetail: parseWconceptProductDetail,
};
