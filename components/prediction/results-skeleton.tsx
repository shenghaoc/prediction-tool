"use client";

import { Skeleton } from "@/components/ui/skeleton";

export function ResultsSkeleton() {
  return (
    <div className="flex flex-col gap-5" aria-hidden>
      <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="animate-shimmer h-[72px] rounded-xl" />
        ))}
      </div>
      <Skeleton className="animate-shimmer h-px w-full" />
      <div className="space-y-3">
        <Skeleton className="animate-shimmer h-3 w-32 rounded-md" />
        <Skeleton className="animate-shimmer h-4 w-48 rounded-md" />
        <div className="grid grid-cols-3 gap-2.5 max-sm:grid-cols-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="animate-shimmer h-16 rounded-xl" />
          ))}
        </div>
        <Skeleton className="animate-shimmer h-[260px] w-full rounded-xl" />
      </div>
    </div>
  );
}
