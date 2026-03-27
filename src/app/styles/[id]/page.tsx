// src/app/styles/[id]/page.tsx — 스타일 상세 → 유사 상품 비교

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/ui/Badge";
import { ProductCompareCard } from "@/components/ProductCompareCard";
import { prisma } from "@/lib/prisma";

interface StyleDetailPageProps {
  params: Promise<{ id: string }>;
}

const GENDER_LABEL: Record<string, string> = {
  male: "남성",
  female: "여성",
  unisex: "공용",
};

const SEASON_LABEL: Record<string, string> = {
  spring: "봄",
  summer: "여름",
  fall: "가을",
  winter: "겨울",
  all: "사계절",
};

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export default async function StyleDetailPage({ params }: StyleDetailPageProps) {
  const { id } = await params;

  const style = await prisma.celebStyle.findUnique({
    where: { id },
    select: {
      id: true,
      celebName: true,
      imageUrl: true,
      categoryId: true,
      colors: true,
      gender: true,
      season: true,
    },
  });

  if (!style) {
    notFound();
  }

  const products = await prisma.similarProduct.findMany({
    where: { styleId: id },
    orderBy: { similarityScore: "desc" },
    select: {
      id: true,
      styleId: true,
      brandName: true,
      productName: true,
      productImageUrl: true,
      representativePrice: true,
      similarityScore: true,
      createdAt: true,
    },
  });

  return (
    <div className="flex flex-col gap-6">
      {/* 뒤로가기 */}
      <Link
        href={`/styles?categoryId=${style.categoryId}`}
        className="self-start text-sm text-gray-500 hover:text-gray-900"
      >
        ← 목록으로
      </Link>

      {/* 셀럽 스타일 정보 */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="relative aspect-[4/5] w-full overflow-hidden rounded-xl bg-gray-100 md:w-80 md:shrink-0">
          <Image
            src={style.imageUrl}
            alt={`${style.celebName} 스타일`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 320px"
            priority
          />
        </div>
        <div className="flex flex-col gap-3">
          <h1 className="text-xl font-bold text-gray-900">{style.celebName}</h1>
          <div className="flex flex-wrap gap-1.5">
            <Badge label={GENDER_LABEL[style.gender] ?? style.gender} variant="gender" />
            <Badge label={SEASON_LABEL[style.season] ?? style.season} variant="season" />
            {style.colors.map((color) => (
              <Badge key={color} label={color} variant="tag" />
            ))}
          </div>
        </div>
      </div>

      {/* 유사 상품 비교 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">유사 상품</h2>
          <span className="text-sm text-gray-500">{products.length}개</span>
        </div>

        {products.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-16 text-gray-400">
            <span className="text-4xl">👕</span>
            <p className="text-sm">유사 상품이 아직 등록되지 않았어요</p>
          </div>
        ) : (
          <>
            {/* 가격 범위 요약 */}
            <p className="text-sm text-gray-500">
              {formatPrice(Math.min(...products.map((p) => p.representativePrice)))} ~{" "}
              {formatPrice(Math.max(...products.map((p) => p.representativePrice)))}
            </p>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
              {products.map((product) => (
                <ProductCompareCard key={product.id} product={product} />
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  );
}
