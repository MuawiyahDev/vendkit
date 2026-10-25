import type * as React from "react";

import type { Column, RowData } from "@tanstack/react-table";
import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

import type { DataTableFeatures } from "./data-table-features";

interface DataTableColumnHeaderProps<TData extends RowData, TValue>
  extends React.HTMLAttributes<HTMLDivElement> {
  column: Column<DataTableFeatures, TData, TValue>;
  title: string;
}

export function DataTableColumnHeader<TData extends RowData, TValue>({
  column,
  title,
  className,
}: DataTableColumnHeaderProps<TData, TValue>) {
  if (!column.getCanSort()) {
    return <div className={className}>{title}</div>;
  }

  const sorted = column.getIsSorted();
  const Icon =
    sorted === "asc" ? ArrowUp : sorted === "desc" ? ArrowDown : ArrowUpDown;

  return (
    <button
      type="button"
      onClick={column.getToggleSortingHandler()}
      className={cn(
        "hover:text-foreground focus-visible:ring-ring/40 -mx-1 inline-flex cursor-pointer select-none items-center gap-1.5 rounded-sm px-1 py-0.5 font-semibold transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden",
        sorted && "text-foreground",
        className,
      )}
      aria-label={
        sorted
          ? `Sorted by ${title} ${sorted === "asc" ? "ascending" : "descending"}. Activate to sort ${sorted === "asc" ? "descending" : "ascending"}.`
          : `Sort by ${title}`
      }
    >
      {title}
      <Icon
        className={cn(
          "size-3.5 transition-opacity",
          !sorted && "text-muted-foreground/50",
        )}
        aria-hidden="true"
      />
    </button>
  );
}
