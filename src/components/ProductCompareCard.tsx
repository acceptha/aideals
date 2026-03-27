// src/components/ProductCompareCard.tsx — Server Component

import Image from "next/image";
import Link from "next/link";
import type { SimilarProduct } from "@/types";

interface ProductCompareCardProps {
  product: SimilarProduct;
}

function formatPrice(price: number): string {
  return price.toLocaleString("ko-KR") + "원";
}

export const ProductCompareCard = ({ product }: ProductCompareCardProps) => {
  const scorePercent = Math.round(product.similarityScore * 100);

  return (
    <Link
      href={`/products/${product.id}`}
      className="group flex flex-col overflow-hidden rounded-xl border border-gray-200 bg-white transition-shadow hover:shadow-md"
    >
      <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-100">
        <Image
          src={product.productImageUrl}
          alt={`${product.brandName} ${product.productName}`}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-105"
          sizes="(max-width: 768px) 100vw, 33vw"
        />
      </div>
      <div className="flex flex-col gap-1.5 p-3">
        <p className="text-xs font-semibold text-gray-500">{product.brandName}</p>
        <p className="line-clamp-2 text-sm font-medium text-gray-900">
          {product.productName}
        </p>
        <p className="text-sm font-bold text-gray-900">
          {formatPrice(product.representativePrice)}
        </p>
        <div className="flex items-center gap-2">
          <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-200">
            <div
              className="h-full rounded-full bg-purple-500"
              style={{ width: `${scorePercent}%` }}
            />
          </div>
          <span className="shrink-0 text-xs font-medium text-purple-600">
            {scorePercent}%
          </span>
        </div>
      </div>
    </Link>
  );
};
