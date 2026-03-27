import { StyleCardSkeleton } from "@/components/ui/Skeleton";

export default function StylesLoading() {
  return (
    <div className="flex flex-col gap-6">
      <div className="h-7 w-40 animate-pulse rounded bg-gray-200" />
      <div className="h-32 w-full animate-pulse rounded-xl bg-gray-200" />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <StyleCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
