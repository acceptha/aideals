/**
 * 스크래퍼 공용 유틸리티
 */

/** 가격 문자열 ("29,900원", "₩29,900" 등)에서 숫자만 추출 */
export const parsePrice = (priceStr: string): number => {
  const digits = priceStr.replace(/[^0-9]/g, "");
  const parsed = parseInt(digits, 10);
  return isNaN(parsed) ? 0 : parsed;
};
