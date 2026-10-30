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
            <TableHead className="min-w-[300px]">Product</TableHead>
            <TableHead className="hidden md:table-cell w-[150px]">
              Category
            </TableHead>
            <TableHead className="hidden lg:table-cell w-[140px]">
              Brand
            </TableHead>
            <TableHead className="w-[130px]">Price</TableHead>
            <TableHead className="w-[150px]">Stock</TableHead>
            <TableHead className="w-[110px]">Status</TableHead>
            <TableHead className="hidden lg:table-cell w-[130px]">
              Created
            </TableHead>
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
                  <Skeleton className="size-9 rounded-md" />
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-24" />
                  </div>
                </div>
              </TableCell>
              <TableCell className="hidden md:table-cell">
                <Skeleton className="h-3.5 w-24" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
                <Skeleton className="h-3.5 w-20" />
              </TableCell>
              <TableCell>
                <div className="flex flex-col gap-1.5">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="h-3 w-12" />
                </div>
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-5 w-16 rounded-full" />
              </TableCell>
              <TableCell className="hidden lg:table-cell">
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
          <Skeleton className="size-11 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-2">
            <div className="flex items-center justify-between gap-4">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="size-7" />
            </div>
            <Skeleton className="h-3 w-24" />
            <div className="flex flex-wrap items-center gap-3">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}

export function ProductsTableSkeleton() {
  return (
    <div
      role="status"
      aria-live="polite"
      aria-label="Loading products"
      data-testid="products-table-skeleton"
    >
      <span className="sr-only">Loading products…</span>
      <DesktopSkeleton />
      <MobileSkeleton />
    </div>
  );
}
