"use client";

import { useRouter, useSearchParams } from "next/navigation";

const SORT_OPTIONS = [
  { value: "similarity", label: "유사도순" },
  { value: "price_asc", label: "낮은 가격순" },
  { value: "price_desc", label: "높은 가격순" },
  { value: "brand", label: "브랜드순" },
] as const;

interface ProductSortBarProps {
  currentSort: string;
}

export const ProductSortBar = ({ currentSort }: ProductSortBarProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSort = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {SORT_OPTIONS.map((opt) => (
        <button
          key={opt.value}
          onClick={() => handleSort(opt.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            currentSort === opt.value
              ? "border-purple-600 bg-purple-600 text-white"
              : "border-gray-300 text-gray-600 hover:border-gray-500"
          }`}
        >
          {opt.label}
        </button>
      ))}
    </div>
  );
};
