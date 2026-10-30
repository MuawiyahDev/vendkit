import { Skeleton } from "@/components/ui/skeleton";

export function ImageLibrarySkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading images"
      className="px-4 py-4 sm:px-5"
    >
      <span className="sr-only">Loading images…</span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {Array.from({ length: 8 }, (_, index) => (
          <li key={index} className="flex flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-3.5 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}
