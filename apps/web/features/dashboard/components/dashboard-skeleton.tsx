import { Skeleton } from "@/components/ui/skeleton";

function StatsSkeleton() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <Skeleton className="h-[148px] rounded-xl sm:col-span-2" />
      <Skeleton className="h-[148px] rounded-xl" />
      <Skeleton className="h-[148px] rounded-xl" />
      <Skeleton className="h-[148px] rounded-xl" />
      <Skeleton className="h-[148px] rounded-xl" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div
      className="flex flex-col gap-6"
      role="status"
      aria-live="polite"
      aria-label="Loading dashboard"
    >
      <span className="sr-only">Loading dashboard…</span>

      <StatsSkeleton />

      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[360px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[360px] rounded-xl" />
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Skeleton className="h-[380px] rounded-xl xl:col-span-2" />
        <Skeleton className="h-[380px] rounded-xl" />
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Skeleton className="h-[340px] rounded-xl" />
        <Skeleton className="h-[340px] rounded-xl" />
      </div>
    </div>
  );
}
