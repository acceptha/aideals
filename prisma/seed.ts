// prisma/seed.ts
// upsert 사용 (멱등 실행)
// 실행: npx prisma db seed

import { PrismaClient } from "@prisma/client";
import { SEED_CATEGORIES } from "./seed-data/categories";
import { SEED_CELEB_STYLES } from "./seed-data/celebStyles";
import { SEED_SIMILAR_PRODUCTS } from "./seed-data/similarProducts";
import { SEED_PURCHASE_LINKS } from "./seed-data/purchaseLinks";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 시드 데이터 삽입 시작...\n");

  // 1. 카테고리
  for (const cat of SEED_CATEGORIES) {
    await prisma.category.upsert({
      where: { id: cat.id },
      update: { name: cat.name, iconUrl: cat.iconUrl, sortOrder: cat.sortOrder },
      create: cat,
    });
  }
  console.log(`✅ 카테고리: ${SEED_CATEGORIES.length}개`);

  // 2. 셀럽 스타일
  for (const style of SEED_CELEB_STYLES) {
    await prisma.celebStyle.upsert({
      where: { id: style.id },
      update: {
        celebName: style.celebName,
        imageUrl: style.imageUrl,
        categoryId: style.categoryId,
        colors: style.colors,
        gender: style.gender,
        season: style.season,
      },
      create: style,
    });
  }
  console.log(`✅ 셀럽 스타일: ${SEED_CELEB_STYLES.length}개`);

  // 3. 유사 상품
  for (const prod of SEED_SIMILAR_PRODUCTS) {
    await prisma.similarProduct.upsert({
      where: { id: prod.id },
      update: {
        styleId: prod.styleId,
        brandName: prod.brandName,
        productName: prod.productName,
        productImageUrl: prod.productImageUrl,
        representativePrice: prod.representativePrice,
        similarityScore: prod.similarityScore,
      },
      create: prod,
    });
  }
  console.log(`✅ 유사 상품: ${SEED_SIMILAR_PRODUCTS.length}개`);

  // 4. 구매 링크
  for (const link of SEED_PURCHASE_LINKS) {
    await prisma.purchaseLink.upsert({
      where: { id: link.id },
      update: {
        productId: link.productId,
        platformName: link.platformName,
        platformLogoUrl: link.platformLogoUrl,
        price: link.price,
        currency: link.currency,
        productUrl: link.productUrl,
        inStock: link.inStock,
      },
      create: link,
    });
  }
  console.log(`✅ 구매 링크: ${SEED_PURCHASE_LINKS.length}개`);

  console.log("\n🎉 시드 데이터 삽입 완료!");
}

main()
  .catch((e) => {
    console.error("❌ 시드 실패:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
