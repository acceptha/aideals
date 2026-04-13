/**
 * 플랫폼 스크래퍼 레지스트리
 *
 * platformName(DB 저장값) → PlatformScraper 인스턴스 매핑.
 * 새 플랫폼 추가 시 이 파일에 등록하면 크롤러 엔진이 자동으로 인식한다.
 */

import type { PlatformScraper } from "@/types/scraper";
import { musinsaScraper } from "./musinsa";
import { cm29Scraper } from "./cm29";
import { wconceptScraper } from "./wconcept";

/** platformName → PlatformScraper 매핑 (키는 모두 소문자) */
const scraperMap = new Map<string, PlatformScraper>([
  ["무신사", musinsaScraper],
  ["musinsa", musinsaScraper],
  ["29cm", cm29Scraper],
  ["w컨셉", wconceptScraper],
  ["wconcept", wconceptScraper],
]);

/** platformName으로 해당 플랫폼의 스크래퍼를 조회한다. 입력값은 소문자로 정규화된다. 없으면 null. */
export const getScraperByPlatform = (platformName: string): PlatformScraper | null =>
  scraperMap.get(platformName.toLowerCase()) ?? null;

/** 크롤링 가능한 플랫폼 목록 */
export const getSupportedPlatforms = (): string[] =>
  Array.from(scraperMap.keys());
