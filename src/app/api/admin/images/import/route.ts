// src/app/api/admin/images/import/route.ts
// 외부 라이선스 이미지를 Cloudinary로 복사하고 출처 메타데이터를 함께 반환한다.
// 외부 URL이 만료되거나 hotlinking이 차단되어도 우리 CDN에서 안정적으로 서빙되도록 한다.
//
// POST /api/admin/images/import
// Body: ImageImportRequest
// 응답: { data: ImageImportResult }

import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { AppError, ValidationError } from "@/lib/api/errors";
import { auth } from "@/lib/auth";
import { cloudinary } from "@/lib/cloudinary";
import { triggerUnsplashDownload } from "@/lib/unsplash";
import { logger } from "@/lib/logger";
import type { ImageImportRequest } from "@/types/api";

const ALLOWED_FOLDERS = new Set([
  "styles",
  "products",
  "platforms",
  "categories",
]);

const DEFAULT_FOLDER = "styles";

export const POST = withErrorHandler(async (req: NextRequest) => {
  const session = await auth();
  if (!session) {
    throw AppError.fromCode("AUTH_REQUIRED", "로그인이 필요합니다");
  }
  if (session.user.role !== "admin") {
    throw AppError.fromCode("AUTH_FORBIDDEN", "관리자 권한이 필요합니다");
  }

  if (!cloudinary) {
    throw AppError.fromCode(
      "CLOUDINARY_NOT_CONFIGURED",
      "Cloudinary가 설정되지 않았습니다. 환경변수를 확인하세요.",
    );
  }

  const body = (await req.json().catch(() => null)) as ImageImportRequest | null;
  if (!body) {
    throw new ValidationError(
      "요청 본문이 비어있거나 JSON 형식이 아닙니다",
      "MISSING_REQUIRED_FIELD",
    );
  }

  const { imageUrl, sourceUrl, photographer, sourceName } = body;

  if (!imageUrl?.trim()) {
    throw new ValidationError("imageUrl이 필요합니다", "MISSING_REQUIRED_FIELD", {
      field: "imageUrl",
    });
  }
  if (!sourceUrl?.trim()) {
    throw new ValidationError("sourceUrl이 필요합니다", "MISSING_REQUIRED_FIELD", {
      field: "sourceUrl",
    });
  }
  if (!photographer?.trim()) {
    throw new ValidationError("photographer가 필요합니다", "MISSING_REQUIRED_FIELD", {
      field: "photographer",
    });
  }
  if (!sourceName?.trim()) {
    throw new ValidationError("sourceName이 필요합니다", "MISSING_REQUIRED_FIELD", {
      field: "sourceName",
    });
  }

  // imageUrl 형식 검증 — http(s) 만 허용 (file://, javascript: 등 차단)
  if (!/^https?:\/\//i.test(imageUrl)) {
    throw new ValidationError(
      "imageUrl은 http(s) URL이어야 합니다",
      "INVALID_FILTER_VALUE",
      { field: "imageUrl" },
    );
  }

  const folder = body.folder ?? DEFAULT_FOLDER;
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new ValidationError(
      `허용되지 않는 폴더입니다: ${folder}`,
      "UPLOAD_INVALID_FOLDER",
      { allowed: [...ALLOWED_FOLDERS] },
    );
  }

  // Cloudinary가 외부 URL을 직접 fetch하여 저장 — 우리 서버는 메타데이터만 처리.
  let result;
  try {
    result = await cloudinary.uploader.upload(imageUrl, {
      folder: `aideals/${folder}`,
      resource_type: "image",
      overwrite: false,
      unique_filename: true,
      tags: ["imported", sourceName.toLowerCase()],
      context: {
        photographer,
        source_url: sourceUrl,
        source_name: sourceName,
      },
    });
  } catch (err) {
    logger.error("외부 이미지 Cloudinary 복사 실패", {
      context: "images/import",
      data: {
        imageUrl,
        sourceName,
        error: err instanceof Error ? err.message : String(err),
      },
    });
    throw AppError.fromCode(
      "UPLOAD_FAILED",
      "이미지를 Cloudinary로 복사하지 못했습니다",
    );
  }

  // Unsplash 가이드라인: 사용 시 download_location에 통계 트리거. 실패해도 본 작업 막지 않음.
  if (body.downloadTracker) {
    await triggerUnsplashDownload(body.downloadTracker);
  }

  logger.info("외부 이미지 import 완료", {
    context: "images/import",
    data: {
      publicId: result.public_id,
      sourceName,
      folder,
    },
  });

  return NextResponse.json({
    data: {
      cloudinaryUrl: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      photographer,
      sourceUrl,
      sourceName,
      licenseType: body.licenseType ?? null,
    },
  });
});
