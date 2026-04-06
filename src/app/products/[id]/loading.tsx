export default function ProductLoading() {
  return (
    <div className="flex flex-col gap-6">
      {/* 뒤로가기 */}
      <div className="h-5 w-32 animate-pulse rounded bg-gray-200" />

      {/* 상품 정보 */}
      <div className="flex flex-col gap-4 md:flex-row md:gap-6">
        <div className="aspect-[3/4] w-full animate-pulse rounded-xl bg-gray-200 md:w-72 md:shrink-0" />
        <div className="flex flex-col gap-3">
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
          <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-7 w-28 animate-pulse rounded bg-gray-200" />
          <div className="h-2 w-24 animate-pulse rounded-full bg-gray-200" />
        </div>
      </div>

      {/* 구매처 목록 */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-20 animate-pulse rounded bg-gray-200" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-16 w-full animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    </div>
  );
}
