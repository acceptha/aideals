"use client";

// src/components/CloudinaryImage.tsx
// Cloudinary loader가 적용된 next/image 래퍼.
// Cloudinary URL이면 변환 파라미터를 동적 삽입하고,
// 아닌 경우(placehold.co 등) 기본 동작으로 폴백한다.

import Image, { type ImageProps } from "next/image";
import { cloudinaryLoader, buildBlurUrl } from "@/lib/image";

type CloudinaryImageProps = Omit<ImageProps, "loader">;

export const CloudinaryImage = ({ alt, src, ...rest }: CloudinaryImageProps) => {
  const blurUrl = typeof src === "string" ? buildBlurUrl(src) : undefined;

  return (
    <Image
      loader={cloudinaryLoader}
      src={src}
      alt={alt}
      placeholder={blurUrl ? "blur" : "empty"}
      blurDataURL={blurUrl}
      {...rest}
    />
  );
};
