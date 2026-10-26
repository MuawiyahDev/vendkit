import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

function DesktopSkeleton() {
  return (
    <div className="hidden md:block" aria-hidden="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="min-w-[260px]">Brand</TableHead>
            <TableHead className="w-[120px]">Status</TableHead>
            <TableHead className="hidden sm:table-cell">Created</TableHead>
            <TableHead className="w-[64px] text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-40" />
                  <Skeleton className="h-3 w-28" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto size-8" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

function MobileSkeleton() {
  return (
    <ul className="divide-border-subtle divide-y md:hidden" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <li key={index} className="flex items-start gap-3 px-4 py-4">
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="h-3 w-24" />
            <div className="flex items-center gap-3">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-28" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function BrandsTableSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading brands"
      data-testid="brands-table-skeleton"
    >
      <span className="sr-only">Loading brands…</span>
      <DesktopSkeleton />
      <MobileSkeleton />
    </div>
  );
}
