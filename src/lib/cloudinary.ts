// src/lib/cloudinary.ts
// Cloudinary 클라이언트 싱글턴.
// 환경변수가 없으면 null을 export하며, 이미지 업로드 기능이 비활성화된다.
//
// 사용법:
//   import { cloudinary } from "@/lib/cloudinary";
//   if (cloudinary) {
//     const result = await cloudinary.uploader.upload(filePath, { folder: "styles" });
//   }

import { v2 as cloudinarySDK } from "cloudinary";
import { env, isProduction } from "./env";

type CloudinaryV2 = typeof cloudinarySDK;

const globalForCloudinary = globalThis as unknown as {
  cloudinary: CloudinaryV2 | null | undefined;
};

function createCloudinaryClient(): CloudinaryV2 | null {
  const cloudName = env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = env.CLOUDINARY_API_KEY;
  const apiSecret = env.CLOUDINARY_API_SECRET;

  if (!cloudName || !apiKey || !apiSecret) {
    return null;
  }

  cloudinarySDK.config({
    cloud_name: cloudName,
    api_key: apiKey,
    api_secret: apiSecret,
    secure: true,
  });

  return cloudinarySDK;
}

export const cloudinary: CloudinaryV2 | null =
  globalForCloudinary.cloudinary !== undefined
    ? globalForCloudinary.cloudinary
    : createCloudinaryClient();

if (!isProduction) {
  globalForCloudinary.cloudinary = cloudinary;
}
