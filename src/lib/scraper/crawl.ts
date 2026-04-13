/**
 * 가격 크롤러 엔진
 *
 * PurchaseLink 레코드를 순회하며 각 플랫폼에서 최신 가격/재고를 수집하고
 * DB를 업데이트한다. API Route가 아닌 별도 스크립트(scripts/crawl-prices.ts)에서 호출한다.
 *
 * 흐름:
 *   PurchaseLink 전체 조회 → platformName으로 파서 선택 → productUrl로 HTML fetch
 *   → 파서로 가격/재고 추출 → PurchaseLink update → representativePrice 갱신
 *   → 관련 캐시 무효화
 */

import { prisma } from "@/lib/prisma";
import { invalidateCache } from "@/lib/cache";
import { logger } from "@/lib/logger";
import { AppError } from "@/lib/api/errors";
import type { ErrorCode } from "@/lib/api/errorCodes";
import { getScraperByPlatform } from "./registry";

/** 크롤링 결과 단건 */
export interface CrawlLinkResult {
  linkId: string;
  productId: string;
  platform: string;
  success: boolean;
  oldPrice: number;
  newPrice: number | null;
  error?: string;
  errorCode?: ErrorCode;
}

/** 전체 크롤링 결과 요약 */
export interface CrawlSummary {
  total: number;
  success: number;
  failed: number;
  skipped: number;
  duration: number;
  results: CrawlLinkResult[];
}

/** 연속 실패 카운터 타입 */
type FailureCounter = Map<string, number>;

const CONSECUTIVE_FAILURE_THRESHOLD = 3;

/** 플랫폼 연속 실패 추적 + 로깅 */
const trackFailure = (
  counter: FailureCounter,
  platformName: string,
  linkId: string,
  errorMessage: string,
): void => {
  const count = (counter.get(platformName) ?? 0) + 1;
  counter.set(platformName, count);

  if (count >= CONSECUTIVE_FAILURE_THRESHOLD) {
    logger.error(`${platformName} ${count}회 연속 크롤링 실패 — 플랫폼 장애 가능성`, {
      context: "scraper:crawl",
      data: { platform: platformName, count, linkId },
    });
  } else {
    logger.warn("크롤링 단건 실패", {
      context: "scraper:crawl",
      data: { linkId, platform: platformName, error: errorMessage },
    });
  }
};

/**
 * URL에서 HTML을 가져온다.
 * 테스트에서 교체할 수 있도록 별도 함수로 분리.
 */
export const fetchHtml = async (url: string): Promise<string> => {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10_000);

  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "ko-KR,ko;q=0.9",
      },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status} ${res.statusText}`);
    }

    return await res.text();
  } finally {
    clearTimeout(timeoutId);
  }
};

/**
 * PurchaseLink 단건 크롤링.
 * 플랫폼 파서가 없거나 fetch/파싱 실패 시 에러를 기록하고 건너뛴다.
 *
 * @param failureCounter - 플랫폼별 연속 실패 카운터. 미전달 시 매번 새 Map을 생성하여
 *   단독 호출 시 이전 실행의 잔존 상태가 남지 않도록 한다.
 */
export const crawlLink = async (
  link: { id: string; productId: string; platformName: string; productUrl: string; price: number },
  fetchFn: (url: string) => Promise<string> = fetchHtml,
  failureCounter: FailureCounter = new Map(),
): Promise<CrawlLinkResult> => {
  const scraper = getScraperByPlatform(link.platformName);

  if (!scraper) {
    return {
      linkId: link.id,
      productId: link.productId,
      platform: link.platformName,
      success: false,
      oldPrice: link.price,
      newPrice: null,
      error: `지원하지 않는 플랫폼: ${link.platformName}`,
    };
  }

  let html: string;

  // 1단계: HTML fetch
  try {
    html = await fetchFn(link.productUrl);
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    const appError = AppError.fromCode(
      "SCRAPER_TARGET_UNREACHABLE",
      `${link.platformName} 접근 실패: ${errorMessage}`,
      { target: link.productUrl, timeout: 10_000 },
    );

    trackFailure(failureCounter, link.platformName, link.id, appError.message);

    return {
      linkId: link.id,
      productId: link.productId,
      platform: link.platformName,
      success: false,
      oldPrice: link.price,
      newPrice: null,
      error: appError.message,
      errorCode: appError.code,
    };
  }

  // 2단계: HTML 파싱
  const parsed = scraper.parseProductDetail(html);

  if (!parsed) {
    const appError = AppError.fromCode(
      "SCRAPER_PARSE_FAILED",
      `${link.platformName} HTML 파싱 실패`,
      { target: link.productUrl, parser: scraper.platform },
    );

    trackFailure(failureCounter, link.platformName, link.id, appError.message);

    return {
      linkId: link.id,
      productId: link.productId,
      platform: link.platformName,
      success: false,
      oldPrice: link.price,
      newPrice: null,
      error: appError.message,
      errorCode: appError.code,
    };
  }

  // 3단계: DB 업데이트
  try {
    await prisma.purchaseLink.update({
      where: { id: link.id },
      data: {
        price: parsed.price,
        inStock: parsed.inStock,
        lastCheckedAt: new Date(),
      },
    });
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : String(err);
    logger.error("크롤링 DB 업데이트 실패", {
      context: "scraper:crawl",
      data: { linkId: link.id, error: errorMessage },
    });

    return {
      linkId: link.id,
      productId: link.productId,
      platform: link.platformName,
      success: false,
      oldPrice: link.price,
      newPrice: parsed.price,
      error: `DB 업데이트 실패: ${errorMessage}`,
      errorCode: "INTERNAL_SERVER_ERROR",
    };
  }

  // 성공 — 연속 실패 카운터 리셋
  failureCounter.set(link.platformName, 0);

  return {
    linkId: link.id,
    productId: link.productId,
    platform: link.platformName,
    success: true,
    oldPrice: link.price,
    newPrice: parsed.price,
  };
};

/**
 * SimilarProduct의 representativePrice를 해당 상품의 PurchaseLink 최저가로 갱신한다.
 */
export const updateRepresentativePrice = async (productId: string): Promise<void> => {
  const links = await prisma.purchaseLink.findMany({
    where: { productId, inStock: true },
    select: { price: true },
    orderBy: { price: "asc" },
    take: 1,
  });

  await prisma.similarProduct.update({
    where: { id: productId },
    data: { representativePrice: links.length > 0 ? links[0].price : 0 },
  });
};

/** 같은 플랫폼 요청 사이 딜레이 (ms) */
const PLATFORM_DELAY_MS = 1500;

/** ms만큼 대기 */
const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

type LinkRow = {
  id: string;
  productId: string;
  platformName: string;
  productUrl: string;
  price: number;
};

/**
 * 단일 플랫폼 그룹을 순차 크롤링 (요청 간 딜레이 포함).
 * 미지원 플랫폼은 호출 전에 걸러지므로 여기서는 crawlLink만 실행한다.
 */
const crawlPlatformGroup = async (
  links: LinkRow[],
  fetchFn: (url: string) => Promise<string>,
  failureCounter: FailureCounter,
): Promise<CrawlLinkResult[]> => {
  const results: CrawlLinkResult[] = [];

  for (let i = 0; i < links.length; i++) {
    if (i > 0) await delay(PLATFORM_DELAY_MS);
    results.push(await crawlLink(links[i], fetchFn, failureCounter));
  }

  return results;
};

/**
 * 전체 PurchaseLink 크롤링 실행.
 * 플랫폼별로 그룹핑하여 서로 다른 플랫폼은 동시에, 같은 플랫폼 내에서는 딜레이를 두고 순차 실행한다.
 */
export const crawlAll = async (
  fetchFn: (url: string) => Promise<string> = fetchHtml,
): Promise<CrawlSummary> => {
  const start = Date.now();

  logger.info("크롤러 작업 시작", { context: "scraper:crawl" });

  // 크롤링 대상 조회
  const links = await prisma.purchaseLink.findMany({
    select: {
      id: true,
      productId: true,
      platformName: true,
      productUrl: true,
      price: true,
    },
  });

  // 실행 단위별 독립 카운터 생성
  const failureCounter: FailureCounter = new Map();

  // 미지원 플랫폼 분리 + 지원 플랫폼 그룹핑
  const skippedResults: CrawlLinkResult[] = [];
  const platformGroups = new Map<string, LinkRow[]>();

  for (const link of links) {
    const scraper = getScraperByPlatform(link.platformName);
    if (!scraper) {
      skippedResults.push({
        linkId: link.id,
        productId: link.productId,
        platform: link.platformName,
        success: false,
        oldPrice: link.price,
        newPrice: null,
        error: `지원하지 않는 플랫폼: ${link.platformName}`,
      });
      continue;
    }

    const normalizedName = link.platformName.toLowerCase();
    const group = platformGroups.get(normalizedName) ?? [];
    group.push(link);
    platformGroups.set(normalizedName, group);
  }

  // 플랫폼별 병렬 실행, 같은 플랫폼 내에서는 딜레이 포함 순차 실행
  const groupResults = await Promise.all(
    Array.from(platformGroups.values()).map((group) =>
      crawlPlatformGroup(group, fetchFn, failureCounter),
    ),
  );

  // 결과 집계
  const crawledResults = groupResults.flat();
  const allResults = [...skippedResults, ...crawledResults];

  let success = 0;
  let failed = 0;
  const priceChangedProductIds = new Set<string>();

  for (const result of crawledResults) {
    if (result.success) {
      success++;
      if (result.newPrice !== null && result.newPrice !== result.oldPrice) {
        priceChangedProductIds.add(result.productId);
      }
    } else {
      failed++;
    }
  }

  // 가격 변경된 상품의 representativePrice 갱신 + 캐시 무효화
  for (const productId of priceChangedProductIds) {
    await updateRepresentativePrice(productId);
    await invalidateCache(`product:${productId}*`);
  }

  if (priceChangedProductIds.size > 0) {
    await invalidateCache("styles:*");
    await invalidateCache("style:*");
  }

  const duration = Date.now() - start;

  logger.info("크롤러 작업 완료", {
    context: "scraper:crawl",
    duration,
    data: {
      total: links.length,
      success,
      failed,
      skipped: skippedResults.length,
      platforms: Array.from(platformGroups.keys()),
    },
  });

  return {
    total: links.length,
    success,
    failed,
    skipped: skippedResults.length,
    duration,
    results: allResults,
  };
};
