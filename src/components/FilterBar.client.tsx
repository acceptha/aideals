"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useFilterStore } from "@/stores/useFilterStore";

const GENDER_OPTIONS = [
  { value: "male", label: "남성" },
  { value: "female", label: "여성" },
];

const COLOR_OPTIONS = [
  "블랙", "화이트", "베이지", "그레이", "네이비",
  "브라운", "레드", "블루", "그린", "핑크",
];

export const FilterBar = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { gender, colors, setGender, toggleColor, reset } = useFilterStore();

  const applyFilter = (updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value === null) {
        params.delete(key);
      } else {
        params.set(key, value);
      }
    }
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const handleGender = (value: string) => {
    const next = gender === value ? null : (value as "male" | "female");
    setGender(next);
    applyFilter({ gender: next });
  };

  const handleColor = (color: string) => {
    toggleColor(color);
    const next = colors.includes(color)
      ? colors.filter((c) => c !== color)
      : [...colors, color];
    applyFilter({ color: next.length > 0 ? next.join(",") : null });
  };

  const handleReset = () => {
    reset();
    const params = new URLSearchParams(searchParams.toString());
    params.delete("gender");
    params.delete("color");
    params.delete("page");
    router.push(`?${params.toString()}`);
  };

  const hasFilter = gender !== null || colors.length > 0;

  return (
    <div className="flex flex-col gap-3 rounded-xl border border-gray-200 bg-white p-4">
      {/* 성별 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-10 shrink-0 text-xs font-semibold text-gray-500">성별</span>
        <div className="flex flex-wrap gap-1.5">
          {GENDER_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              onClick={() => handleGender(opt.value)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                gender === opt.value
                  ? "border-black bg-black text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-500"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* 색상 */}
      <div className="flex flex-wrap items-center gap-2">
        <span className="w-10 shrink-0 text-xs font-semibold text-gray-500">색상</span>
        <div className="flex flex-wrap gap-1.5">
          {COLOR_OPTIONS.map((color) => (
            <button
              key={color}
              onClick={() => handleColor(color)}
              className={`rounded-full border px-3 py-1 text-xs font-medium transition-colors ${
                colors.includes(color)
                  ? "border-purple-600 bg-purple-600 text-white"
                  : "border-gray-300 text-gray-600 hover:border-gray-500"
              }`}
            >
              {color}
            </button>
          ))}
        </div>
      </div>

      {/* 초기화 */}
      {hasFilter && (
        <button
          onClick={handleReset}
          className="self-start text-xs text-gray-400 underline hover:text-gray-700"
        >
          필터 초기화
        </button>
      )}
    </div>
  );
};
