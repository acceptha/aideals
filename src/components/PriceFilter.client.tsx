"use client";

import { useRouter, useSearchParams } from "next/navigation";

const PRICE_RANGES = [
  { label: "~3만", value: "0-30000" },
  { label: "3~5만", value: "30000-50000" },
  { label: "5~10만", value: "50000-100000" },
  { label: "10~20만", value: "100000-200000" },
  { label: "20만~", value: "200000-" },
] as const;

interface PriceFilterProps {
  currentRange: string | null;
}

export const PriceFilter = ({ currentRange }: PriceFilterProps) => {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSelect = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (currentRange === value) {
      params.delete("priceRange");
    } else {
      params.set("priceRange", value);
    }
    router.push(`?${params.toString()}`);
  };

  return (
    <div className="flex flex-wrap gap-1.5">
      {PRICE_RANGES.map((range) => (
        <button
          key={range.value}
          onClick={() => handleSelect(range.value)}
          className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
            currentRange === range.value
              ? "border-black bg-black text-white"
              : "border-gray-300 text-gray-600 hover:border-gray-500"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
};
