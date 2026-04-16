// scripts/migrate-seed-images.ts
// placehold.co 이미지를 Cloudinary로 일괄 업로드하고 seed 파일의 URL을 교체한다.
//
// 실행: npx tsx scripts/migrate-seed-images.ts
// 환경변수 필요:
//   NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME
//   CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET

import "dotenv/config";
import { v2 as cloudinary } from "cloudinary";
import * as fs from "fs";
import * as path from "path";

// ── Cloudinary 설정 ──

const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
const apiKey = process.env.CLOUDINARY_API_KEY;
const apiSecret = process.env.CLOUDINARY_API_SECRET;

if (!cloudName || !apiKey || !apiSecret) {
  console.error("❌ Cloudinary 환경변수가 설정되지 않았습니다.");
  process.exit(1);
}

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
  secure: true,
});

// ── 업로드 대상 정의 ──

interface UploadTarget {
  seedFile: string;
  urlField: string;
  folder: string;
}

const TARGETS: UploadTarget[] = [
  {
    seedFile: "prisma/seed-data/celebStyles.ts",
    urlField: "imageUrl",
    folder: "styles",
  },
  {
    seedFile: "prisma/seed-data/similarProducts.ts",
    urlField: "productImageUrl",
    folder: "products",
  },
];

// ── 헬퍼 ──

function extractUrls(content: string, urlField: string): string[] {
  // "imageUrl: "https://placehold.co/..." 패턴 매칭
  const regex = new RegExp(`${urlField}:\\s*"(https://placehold\\.co/[^"]+)"`, "g");
  const urls: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = regex.exec(content)) !== null) {
    urls.push(match[1]);
  }
  return urls;
}

async function uploadToCloudinary(
  imageUrl: string,
  folder: string,
): Promise<string> {
  const result = await cloudinary.uploader.upload(imageUrl, {
    folder: `aideals/${folder}`,
    resource_type: "image",
    overwrite: false,
    unique_filename: true,
  });
  return result.secure_url;
}

async function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ── 메인 ──

async function main(): Promise<void> {
  const rootDir = path.resolve(__dirname, "..");

  for (const target of TARGETS) {
    const filePath = path.join(rootDir, target.seedFile);
    let content = fs.readFileSync(filePath, "utf-8");
    const urls = extractUrls(content, target.urlField);

    if (urls.length === 0) {
      console.log(`⏭️  ${target.seedFile}: placehold.co URL 없음 (이미 전환 완료?)`);
      continue;
    }

    console.log(`\n📁 ${target.seedFile} — ${urls.length}개 이미지 업로드 시작`);

    let replaced = 0;
    for (const oldUrl of urls) {
      try {
        const newUrl = await uploadToCloudinary(oldUrl, target.folder);
        content = content.replace(oldUrl, newUrl);
        replaced++;
        console.log(`  ✅ [${replaced}/${urls.length}] ${oldUrl.slice(0, 50)}... → 완료`);
        // Cloudinary rate limit 방지
        await delay(200);
      } catch (err) {
        console.error(
          `  ❌ 업로드 실패: ${oldUrl}`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    fs.writeFileSync(filePath, content, "utf-8");
    console.log(`✅ ${target.seedFile} — ${replaced}/${urls.length}개 URL 교체 완료`);
  }

  console.log("\n🎉 마이그레이션 완료");
}

main().catch((err) => {
  console.error("❌ 마이그레이션 실패:", err);
  process.exit(1);
});
