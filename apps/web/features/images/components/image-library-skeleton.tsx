import { Skeleton } from "@/components/ui/skeleton";

import type { ImageViewMode } from "../images.constants";

interface ImageLibrarySkeletonProps {
  layout?: ImageViewMode;
}

export function ImageLibrarySkeleton({
  layout = "grid",
}: ImageLibrarySkeletonProps) {
  if (layout === "list") {
    return (
      <div
        role="status"
        aria-live="polite"
        aria-label="Loading images"
        className="p-4 sm:p-5"
      >
        <span className="sr-only">Loading images…</span>
        <ul className="flex flex-col gap-2">
          {Array.from({ length: 6 }, (_, index) => (
            <li
              key={index}
              className="border-border-subtle bg-card flex items-center gap-3 rounded-lg border p-2.5 sm:p-3"
            >
              <Skeleton className="size-16 shrink-0 rounded-lg" />
              <span className="flex min-w-0 flex-1 flex-col gap-1.5">
                <Skeleton className="h-3.5 w-1/2" />
                <Skeleton className="h-3 w-2/3" />
                <Skeleton className="h-2.5 w-1/3" />
              </span>
              <Skeleton className="size-8 shrink-0 rounded-md" />
              <Skeleton className="size-8 shrink-0 rounded-md" />
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading images"
      className="p-4 sm:p-5"
    >
      <span className="sr-only">Loading images…</span>
      <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4 xl:grid-cols-5">
        {Array.from({ length: 10 }, (_, index) => (
          <li
            key={index}
            className="border-border-subtle bg-card flex flex-col overflow-hidden rounded-xl border"
          >
            <Skeleton className="aspect-square w-full rounded-none" />
            <div className="flex flex-col gap-1.5 px-3 py-2.5">
              <Skeleton className="h-3 w-3/4" />
              <Skeleton className="h-2.5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
