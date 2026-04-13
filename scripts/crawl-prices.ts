/**
 * 가격 크롤러 실행 스크립트
 *
 * 사용법:
 *   npm run crawl
 *   npx tsx scripts/crawl-prices.ts
 *
 * 환경 변수 필요: DATABASE_URL (Prisma)
 * 선택: UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN (캐시 무효화)
 */

import { crawlAll } from "../src/lib/scraper/crawl";

const main = async () => {
  console.log("=== 가격 크롤러 시작 ===\n");

  const summary = await crawlAll();

  console.log("\n=== 크롤링 결과 ===");
  console.log(`총 대상: ${summary.total}건`);
  console.log(`성공: ${summary.success}건`);
  console.log(`실패: ${summary.failed}건`);
  console.log(`스킵: ${summary.skipped}건 (미지원 플랫폼)`);
  console.log(`소요 시간: ${summary.duration}ms`);

  // 가격 변경 내역 출력
  const changed = summary.results.filter(
    (r) => r.success && r.newPrice !== null && r.newPrice !== r.oldPrice,
  );

  if (changed.length > 0) {
    console.log(`\n가격 변경: ${changed.length}건`);
    for (const r of changed) {
      console.log(
        `  [${r.platform}] ${r.linkId}: ${r.oldPrice.toLocaleString()}원 → ${r.newPrice!.toLocaleString()}원`,
      );
    }
  }

  // 실패 내역 출력
  const failures = summary.results.filter((r) => !r.success);
  if (failures.length > 0) {
    console.log(`\n실패 내역: ${failures.length}건`);
    for (const r of failures) {
      console.log(`  [${r.platform}] ${r.linkId}: ${r.error}`);
    }
  }

  console.log("\n=== 크롤러 종료 ===");
  process.exit(summary.failed === summary.total && summary.total > 0 ? 1 : 0);
};

main().catch((err) => {
  console.error("크롤러 실행 실패:", err);
  process.exit(1);
});
