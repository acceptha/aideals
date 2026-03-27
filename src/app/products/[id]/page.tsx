// src/app/products/[id]/page.tsx — 상품 상세 → 구매처 확인

import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PurchaseLinkList } from "@/components/PurchaseLinkList";
import { prisma } from "@/lib/prisma";

interface ProductDetailPageProps {
  params: Promise<{ id: string }>;
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export default async function ProductDetailPage({ params }: ProductDetailPageProps) {
  const { id } = await params;

  const product = await prisma.similarProduct.findUnique({
    where: { id },
    select: {
      id: true,
      styleId: true,
      brandName: true,
      productName: true,
      productImageUrl: true,
      representativePrice: true,
      similarityScore: true,
      style: {
        select: { id: true, celebName: true },
      },
    },
  });

  if (!product) {
    notFound();
  }

  const links = await prisma.purchaseLink.findMany({
    where: { productId: id },
    orderBy: { price: "asc" },
    select: {
      id: true,
      productId: true,
      platformName: true,
      platformLogoUrl: true,
      price: true,
      currency: true,
      productUrl: true,
      inStock: true,
      lastCheckedAt: true,
    },
  });

  const scorePercent = Math.round(product.similarityScore * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* 뒤로가기 */}
      <Link
        href={`/styles/${product.style.id}`}
        className="self-start text-sm text-gray-500 hover:text-gray-900"
      >
        ← {product.style.celebName} 스타일로
      </Link>

      {/* 상품 정보 */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="relative aspect-[3/4] w-full overflow-hidden rounded-xl bg-gray-100 md:w-72 md:shrink-0">
          <Image
            src={product.productImageUrl}
            alt={`${product.brandName} ${product.productName}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 288px"
            priority
          />
        </div>
        <div className="flex flex-col gap-3">
          <p className="text-sm font-semibold text-gray-500">{product.brandName}</p>
          <h1 className="text-xl font-bold text-gray-900">{product.productName}</h1>
          <p className="text-2xl font-bold text-gray-900">
            {formatPrice(product.representativePrice)}
          </p>
          <div className="flex items-center gap-2">
            <div className="h-2 w-24 overflow-hidden rounded-full bg-gray-200">
              <div
                className="h-full rounded-full bg-purple-500"
                style={{ width: `${scorePercent}%` }}
              />
            </div>
            <span className="text-sm text-purple-600">유사도 {scorePercent}%</span>
          </div>
        </div>
      </div>

      {/* 구매처 목록 */}
      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">구매처</h2>
          <span className="text-sm text-gray-500">{links.length}개 플랫폼</span>
        </div>
        <PurchaseLinkList links={links} />
      </section>
    </div>
  );
}
