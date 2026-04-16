// src/app/api/admin/upload/route.ts
// 이미지 업로드 API — 파일을 Cloudinary에 업로드하고 base URL을 반환한다.
//
// POST /api/admin/upload
// Headers: { Authorization: Bearer <CRON_SECRET> }
// Body: multipart/form-data { file: File, folder?: string, tags?: string }
//
// 응답: { data: { url, publicId, width, height, format, bytes } }
//
// 메모리 최적화: file.stream() → Readable.fromWeb() → upload_stream 파이프라인으로
// ArrayBuffer/Buffer/base64 복사 없이 스트리밍 업로드한다.

import { Readable } from "node:stream";
import { NextRequest, NextResponse } from "next/server";
import { withErrorHandler } from "@/lib/api/withErrorHandler";
import { AppError, ValidationError } from "@/lib/api/errors";
import { cloudinary } from "@/lib/cloudinary";
import { env } from "@/lib/env";
import { logger } from "@/lib/logger";
import type { UploadApiResponse, UploadApiErrorResponse } from "cloudinary";

const ALLOWED_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/avif",
]);

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

const ALLOWED_FOLDERS = new Set([
  "styles",
  "products",
  "platforms",
  "categories",
]);

function validateAuth(req: NextRequest): void {
  const authHeader = req.headers.get("authorization");
  const token = authHeader?.replace("Bearer ", "");

  if (!token || token !== env.CRON_SECRET) {
    throw AppError.fromCode("AUTH_REQUIRED", "인증이 필요합니다");
  }
}

export const POST = withErrorHandler(async (req: NextRequest) => {
  validateAuth(req);

  if (!cloudinary) {
    throw AppError.fromCode(
      "CLOUDINARY_NOT_CONFIGURED",
      "Cloudinary가 설정되지 않았습니다. 환경변수를 확인하세요.",
    );
  }

  const formData = await req.formData();
  const file = formData.get("file");

  if (!file || !(file instanceof File)) {
    throw new ValidationError(
      "파일이 첨부되지 않았습니다",
      "UPLOAD_NO_FILE",
    );
  }

  if (!ALLOWED_TYPES.has(file.type)) {
    throw new ValidationError(
      `허용되지 않는 파일 형식입니다: ${file.type}`,
      "UPLOAD_INVALID_TYPE",
      { allowed: [...ALLOWED_TYPES] },
    );
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new ValidationError(
      `파일 크기가 ${MAX_FILE_SIZE / 1024 / 1024}MB를 초과합니다`,
      "UPLOAD_FILE_TOO_LARGE",
      { maxBytes: MAX_FILE_SIZE, actualBytes: file.size },
    );
  }

  const folder = formData.get("folder")?.toString() ?? "styles";
  if (!ALLOWED_FOLDERS.has(folder)) {
    throw new ValidationError(
      `허용되지 않는 폴더입니다: ${folder}`,
      "UPLOAD_INVALID_FOLDER",
      { allowed: [...ALLOWED_FOLDERS] },
    );
  }

  const tagsRaw = formData.get("tags")?.toString();
  const tags = tagsRaw ? tagsRaw.split(",").map((t) => t.trim()).filter(Boolean) : [];

  // --- 스트리밍 업로드: ArrayBuffer/Buffer/base64 추가 복사 없이 전송 ---
  // file.stream() → Web ReadableStream
  // Readable.fromWeb() → Node.js Readable
  // pipe(upload_stream) → Cloudinary Writable
  const result = await new Promise<UploadApiResponse>((resolve, reject) => {
    let settled = false;
    const fail = (err: Error) => {
      if (settled) return;
      settled = true;
      reject(err);
    };

    // Web ReadableStream → Node.js Readable 변환
    const nodeReadable = Readable.fromWeb(
      file.stream() as import("node:stream/web").ReadableStream,
    );

    const uploadStream = cloudinary!.uploader.upload_stream(
      {
        folder: `aideals/${folder}`,
        tags,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
      },
      (error: UploadApiErrorResponse | undefined, res: UploadApiResponse | undefined) => {
        if (error || !res) {
          nodeReadable.destroy();
          logger.error("Cloudinary 업로드 실패", {
            context: "upload",
            data: { error: error?.message ?? "Unknown error" },
          });
          return fail(
            AppError.fromCode("UPLOAD_FAILED", "이미지 업로드에 실패했습니다"),
          );
        }
        settled = true;
        resolve(res);
      },
    );

    nodeReadable.on("error", (err) => {
      uploadStream.destroy();
      logger.error("스트림 읽기 실패", {
        context: "upload",
        data: { error: err.message },
      });
      fail(AppError.fromCode("UPLOAD_FAILED", "파일 스트림 읽기에 실패했습니다"));
    });
    nodeReadable.pipe(uploadStream);
  });

  logger.info("이미지 업로드 완료", {
    context: "upload",
    data: {
      publicId: result.public_id,
      folder,
      bytes: result.bytes,
      format: result.format,
    },
  });

  return NextResponse.json({
    data: {
      url: result.secure_url,
      publicId: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes,
    },
  });
});
