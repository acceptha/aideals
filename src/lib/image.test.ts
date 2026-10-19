import { describe, it, expect } from "vitest";
import { buildBlurUrl, buildImageUrl, cloudinaryLoader } from "./image";

const CLOUDINARY_URL =
  "https://res.cloudinary.com/demo/image/upload/v1/aideals/styles/a.jpg";

describe("image", () => {
  // ── cloudinaryLoader ──

  it("Cloudinary URL이면 width 변환을 /upload/ 뒤에 삽입한다", () => {
    expect(cloudinaryLoader({ src: CLOUDINARY_URL, width: 640 })).toBe(
      "https://res.cloudinary.com/demo/image/upload/w_640,c_limit,f_auto,q_auto/v1/aideals/styles/a.jpg",
    );
  });

  it("quality를 지정하면 q_ 값에 반영한다", () => {
    expect(cloudinaryLoader({ src: CLOUDINARY_URL, width: 320, quality: 60 })).toContain(
      "q_60",
    );
  });

  it("외부 URL은 ?w= 를 붙인다", () => {
    expect(cloudinaryLoader({ src: "https://placehold.co/400x500", width: 640 })).toBe(
      "https://placehold.co/400x500?w=640",
    );
  });

  it("쿼리스트링이 있는 외부 URL은 &w= 로 이어 붙인다", () => {
    expect(
      cloudinaryLoader({ src: "https://images.unsplash.com/photo-1?ixid=abc", width: 640 }),
    ).toBe("https://images.unsplash.com/photo-1?ixid=abc&w=640");
  });

  // ── buildImageUrl / buildBlurUrl ──

  it("preset 변환을 삽입하고 외부 URL은 그대로 둔다", () => {
    expect(buildImageUrl(CLOUDINARY_URL, "card")).toContain(
      "/upload/w_400,h_500,c_fill,f_auto,q_auto/",
    );
    expect(buildImageUrl("https://placehold.co/1", "card")).toBe("https://placehold.co/1");
  });

  it("blur URL은 Cloudinary URL에만 생성한다", () => {
    expect(buildBlurUrl(CLOUDINARY_URL)).toContain("e_blur:1000");
    expect(buildBlurUrl("https://placehold.co/1")).toBeUndefined();
  });
});
