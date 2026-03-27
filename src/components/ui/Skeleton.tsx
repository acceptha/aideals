// src/components/ui/Skeleton.tsx

interface SkeletonProps {
  className?: string;
}

export const Skeleton = ({ className = "" }: SkeletonProps) => {
  return (
    <div className={`animate-pulse rounded-lg bg-gray-200 ${className}`} />
  );
};

export const StyleCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-2">
      <Skeleton className="aspect-[4/5] w-full" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-3 w-1/2" />
    </div>
  );
};
