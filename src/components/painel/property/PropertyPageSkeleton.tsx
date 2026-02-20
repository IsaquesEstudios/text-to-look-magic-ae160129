import { Skeleton } from "@/components/ui/skeleton";

export function PropertyPageSkeleton() {
  return (
    <div className="space-y-6">
      {/* SubNav skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-10 w-80 rounded-xl" />
      </div>

      {/* Content skeleton */}
      <div className="space-y-4">
        <Skeleton className="h-32 w-full rounded-xl" />
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    </div>
  );
}
