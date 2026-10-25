"use client";

import { useState, type ReactNode } from "react";

import {
  FlexRender,
  useTable,
  type ColumnDef,
  type RowData,
  type SortingState,
  type Updater,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import { features, type DataTableFeatures } from "./data-table-features";

interface DataTableBaseProps<TData extends RowData> {
  columns: ColumnDef<DataTableFeatures, TData>[];
  data: TData[];
  /** Accessible name announced for the table. */
  label?: string;
  /** Stable row identity for React keys. Defaults to the row index. */
  getRowId?: (row: TData, index: number) => string;
  /** Rendered below the table (e.g. pagination controls). */
  footer?: ReactNode;
}

type DataTableProps<TData extends RowData> = DataTableBaseProps<TData> &
  (
    | {
        /** Controlled sorting state owned by the caller (e.g. the server). */
        sorting: SortingState;
        /** Receives the next resolved sorting state when a header is toggled. */
        onSortingChange: (sorting: SortingState) => void;
      }
    | {
        sorting?: undefined;
        onSortingChange?: undefined;
      }
  );

export function DataTable<TData extends RowData>({
  columns,
  data,
  label,
  getRowId,
  footer,
  sorting,
  onSortingChange,
}: DataTableProps<TData>) {
  const isControlled = onSortingChange !== undefined;
  const [internalSorting, setInternalSorting] = useState<SortingState>([]);
  const sortingState = sorting ?? internalSorting;

  const table = useTable({
    features,
    columns,
    data,
    getRowId,
    manualSorting: isControlled,
    enableMultiSort: false,
    enableSortingRemoval: false,
    autoResetSorting: false,
    state: { sorting: sortingState },
    onSortingChange: (updater: Updater<SortingState>) => {
      const next =
        typeof updater === "function" ? updater(sortingState) : updater;
      if (onSortingChange) {
        onSortingChange(next);
      } else {
        setInternalSorting(next);
      }
    },
  });

  return (
    <div className="w-full">
      <Table aria-label={label}>
        <TableHeader>
          {table.getHeaderGroups().map((headerGroup) => (
            <TableRow key={headerGroup.id}>
              {headerGroup.headers.map((header) => {
                const { column } = header;
                const ariaSort = !column.getCanSort()
                  ? undefined
                  : column.getIsSorted() === "asc"
                    ? "ascending"
                    : column.getIsSorted() === "desc"
                      ? "descending"
                      : "none";

                return (
                  <TableHead
                    key={header.id}
                    className={column.columnDef.meta?.className}
                    aria-sort={ariaSort}
                  >
                    {header.isPlaceholder ? null : (
                      <FlexRender header={header} />
                    )}
                  </TableHead>
                );
              })}
            </TableRow>
          ))}
        </TableHeader>
        <TableBody>
          {table.getRowModel().rows.length ? (
            table.getRowModel().rows.map((row) => (
              <TableRow key={row.id}>
                {row.getVisibleCells().map((cell) => (
                  <TableCell
                    key={cell.id}
                    className={cell.column.columnDef.meta?.className}
                  >
                    <FlexRender cell={cell} />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell
                colSpan={columns.length}
                className="h-24 text-center text-muted-foreground"
              >
                No results.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
      {footer}
    </div>
  );
}
