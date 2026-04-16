// src/lib/image.ts
// Cloudinary URL 변환 헬퍼 + next/image loader.
//
// DB에 저장된 base URL의 /upload/ 뒤에 변환 파라미터를 동적으로 삽입한다.
// Cloudinary URL이 아닌 경우(placehold.co 등) 원본을 그대로 반환한다.
//
// 사용법:
//   import { cloudinaryLoader, buildImageUrl } from "@/lib/image";
//   <Image loader={cloudinaryLoader} src={style.imageUrl} ... />
//   const thumbUrl = buildImageUrl(style.imageUrl, "thumbnail");

import type { ImageLoaderProps } from "next/image";

// ── 변환 Preset ──────────────────────────────────

interface TransformOptions {
  width: number;
  height: number;
  crop: string;
  quality?: string;
  gravity?: string;
}

const PRESETS: Record<string, TransformOptions> = {
  thumbnail: { width: 200, height: 250, crop: "thumb", gravity: "face" },
  card: { width: 400, height: 500, crop: "fill" },
  product: { width: 300, height: 400, crop: "fill" },
  detail: { width: 800, height: 1000, crop: "fill" },
  logo: { width: 48, height: 48, crop: "pad" },
};

// ── 내부 헬퍼 ────────────────────────────────────

const CLOUDINARY_UPLOAD_SEGMENT = "/image/upload/";

function isCloudinaryUrl(url: string): boolean {
  return url.includes("res.cloudinary.com") && url.includes(CLOUDINARY_UPLOAD_SEGMENT);
}

function buildTransformString(opts: TransformOptions): string {
  const parts = [
    `w_${opts.width}`,
    `h_${opts.height}`,
    `c_${opts.crop}`,
    "f_auto",
    opts.quality ? `q_${opts.quality}` : "q_auto",
  ];
  if (opts.gravity) parts.push(`g_${opts.gravity}`);
  return parts.join(",");
}

function insertTransform(baseUrl: string, transform: string): string {
  const idx = baseUrl.indexOf(CLOUDINARY_UPLOAD_SEGMENT);
  if (idx === -1) return baseUrl;
  const insertPos = idx + CLOUDINARY_UPLOAD_SEGMENT.length;
  return baseUrl.slice(0, insertPos) + transform + "/" + baseUrl.slice(insertPos);
}

// ── Public API ───────────────────────────────────

/**
 * preset 이름으로 Cloudinary 변환 URL을 생성한다.
 * Cloudinary URL이 아니면 원본을 그대로 반환한다.
 */
export function buildImageUrl(
  baseUrl: string,
  preset: keyof typeof PRESETS,
): string {
  if (!isCloudinaryUrl(baseUrl)) return baseUrl;
  const opts = PRESETS[preset];
  return insertTransform(baseUrl, buildTransformString(opts));
}

/**
 * next/image의 loader prop으로 사용한다.
 * Cloudinary URL이면 width 기반 리사이즈 변환을 삽입하고,
 * 아닌 경우 Next.js 기본 최적화에 맡긴다.
 */
export function cloudinaryLoader({ src, width, quality }: ImageLoaderProps): string {
  if (!isCloudinaryUrl(src)) return `${src}?w=${width}`;

  const transform = [
    `w_${width}`,
    "c_limit",
    "f_auto",
    `q_${quality ?? "auto"}`,
  ].join(",");

  return insertTransform(src, transform);
}

/**
 * blur placeholder용 저품질 URL을 생성한다.
 * Cloudinary URL이 아니면 undefined를 반환한다.
 */
export function buildBlurUrl(baseUrl: string): string | undefined {
  if (!isCloudinaryUrl(baseUrl)) return undefined;
  const transform = "w_20,h_20,c_fill,f_auto,q_10,e_blur:1000";
  return insertTransform(baseUrl, transform);
}

export { PRESETS };
