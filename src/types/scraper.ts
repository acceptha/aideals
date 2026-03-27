/** 크롤러가 파싱하여 반환하는 상품 데이터 */
export interface ScrapedProduct {
  /** 상품명 */
  productName: string;
  /** 브랜드명 */
  brandName: string;
  /** 가격 (원 단위 정수) */
  price: number;
  /** 상품 이미지 URL */
  imageUrl: string;
  /** 상품 상세 페이지 URL */
  productUrl: string;
  /** 재고 여부 */
  inStock: boolean;
}

/** 크롤러가 지원하는 플랫폼 */
export type ScraperPlatform = "musinsa" | "cm29" | "wconcept";

/** 플랫폼별 크롤러 인터페이스 */
export interface PlatformScraper {
  /** 플랫폼 식별자 */
  platform: ScraperPlatform;
  /** 플랫폼 표시 이름 */
  displayName: string;
  /** HTML 문자열로부터 상품 정보를 파싱 */
  parseProductList(html: string): ScrapedProduct[];
  /** 단일 상품 상세 페이지 HTML에서 상품 정보 파싱 */
  parseProductDetail(html: string): ScrapedProduct | null;
}
