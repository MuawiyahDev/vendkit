"use client";

import { ChevronDown, ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";

export interface PaginationMetaLike {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const DEFAULT_PAGE_SIZE_OPTIONS = [10, 20, 50, 100] as const;

interface TablePaginationProps {
  meta: PaginationMetaLike;
  onPageChange: (page: number) => void;
  disabled?: boolean;
  itemLabel?: string;
  /** When provided, renders a rows-per-page control. */
  pageSizeOptions?: readonly number[];
  onPageSizeChange?: (pageSize: number) => void;
}

export function TablePagination({
  meta,
  onPageChange,
  disabled = false,
  itemLabel = "results",
  pageSizeOptions = DEFAULT_PAGE_SIZE_OPTIONS,
  onPageSizeChange,
}: TablePaginationProps) {
  const { page, limit, total, totalPages } = meta;
  const rangeStart = total === 0 ? 0 : (page - 1) * limit + 1;
  const rangeEnd = Math.min(page * limit, total);
  const displayPage = Math.max(page, 1);
  const displayPages = Math.max(totalPages, 1);
  const sizeOptions = pageSizeOptions.includes(limit)
    ? pageSizeOptions
    : [...pageSizeOptions, limit].sort((a, b) => a - b);

  return (
    <div className="border-border-subtle bg-surface-muted/30 flex flex-col gap-3 border-t px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground text-xs" aria-live="polite">
        <span className="text-foreground font-medium">
          {total.toLocaleString()}
        </span>{" "}
        {itemLabel}
        {total > 0 ? (
          <>
            {" "}
            · Showing {rangeStart.toLocaleString()}–{rangeEnd.toLocaleString()}
          </>
        ) : null}
      </p>

      <nav
        aria-label="Pagination"
        className="flex flex-wrap items-center gap-x-4 gap-y-2"
      >
        {onPageSizeChange ? (
          <label className="text-muted-foreground flex items-center gap-2 text-xs">
            <span>Rows per page</span>
            <span className="relative inline-flex items-center">
              <select
                value={limit}
                disabled={disabled}
                onChange={(event) =>
                  onPageSizeChange(Number(event.target.value))
                }
                className="border-border-strong bg-surface text-foreground hover:bg-surface-hover focus-visible:border-ring focus-visible:ring-ring/40 h-8 cursor-pointer appearance-none rounded-md border pr-7 pl-2.5 text-xs font-medium shadow-xs transition-[color,background-color,border-color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:opacity-50"
              >
                {sizeOptions.map((size) => (
                  <option key={size} value={size}>
                    {size}
                  </option>
                ))}
              </select>
              <ChevronDown
                className="text-muted-foreground pointer-events-none absolute right-2 size-3.5"
                aria-hidden="true"
              />
            </span>
          </label>
        ) : null}

        <p className="text-muted-foreground text-xs tabular-nums">
          Page{" "}
          <span className="text-foreground font-medium">{displayPage}</span> of{" "}
          {displayPages}
        </p>

        <div className="flex items-center gap-1.5">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled || page <= 1}
            onClick={() => onPageChange(page - 1)}
            aria-label="Go to previous page"
          >
            <ChevronLeft aria-hidden="true" />
          </Button>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            disabled={disabled || page >= totalPages}
            onClick={() => onPageChange(page + 1)}
            aria-label="Go to next page"
          >
            <ChevronRight aria-hidden="true" />
          </Button>
        </div>
      </nav>
    </div>
  );
}
