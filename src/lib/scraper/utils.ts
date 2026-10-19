/**
 * 스크래퍼 공용 유틸리티
 */

/** 가격 문자열 ("29,900원", "₩29,900" 등)에서 숫자만 추출 */
export const parsePrice = (priceStr: string): number => {
  const digits = priceStr.replace(/[^0-9]/g, "");
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
};

/**
 * 상품 상세가 아닌 검색 결과 페이지 URL인지 판별한다.
 * 시드/임시 데이터의 검색 링크를 상세 파서에 넣으면 다른 상품 가격으로 덮어쓸 수 있어 크롤링에서 제외한다.
 */
export const isSearchPageUrl = (url: string): boolean => {
  try {
    const { pathname } = new URL(url);
    return /\/search|searchresult/i.test(pathname);
  } catch {
    return false;
  }
};
