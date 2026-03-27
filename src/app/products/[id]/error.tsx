"use client";

interface ErrorProps {
  error: Error;
  reset: () => void;
}

export default function ProductError({ error, reset }: ErrorProps) {
  return (
    <div className="flex flex-col items-center gap-4 py-20">
      <span className="text-4xl">⚠️</span>
      <p className="text-sm text-gray-600">{error.message || "상품 정보를 불러오는 중 오류가 발생했어요"}</p>
      <button
        onClick={reset}
        className="rounded-full bg-black px-6 py-2 text-sm font-medium text-white hover:bg-gray-800"
      >
        다시 시도
      </button>
    </div>
  );
}
