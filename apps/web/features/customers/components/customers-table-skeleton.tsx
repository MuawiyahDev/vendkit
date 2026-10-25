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
            <TableHead className="min-w-[260px]">Customer</TableHead>
            <TableHead className="min-w-[150px]">Phone</TableHead>
            <TableHead className="hidden lg:table-cell">Location</TableHead>
            <TableHead className="hidden md:table-cell">Added</TableHead>
            <TableHead className="w-[64px] text-right">
              <span className="sr-only">Actions</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 8 }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <div className="flex items-center gap-3">
                  <Skeleton className="size-9 shrink-0 rounded-full" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-36" />
                    <Skeleton className="h-3 w-44" />
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-3.5 w-28" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell className="hidden md:table-cell">
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
          <Skeleton className="size-10 shrink-0 rounded-full" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-32" />
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="h-3 w-44 max-w-full" />
            <Skeleton className="h-3 w-28" />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function CustomersTableSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading customers"
      data-testid="customers-table-skeleton"
    >
      <span className="sr-only">Loading customers…</span>
      <DesktopSkeleton />
      <MobileSkeleton />
    </div>
  );
}
