"use client";

import { ListFilter, RefreshCw, RotateCcw } from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";

import type {
  InventorySortField,
  InventoryStatusFilter,
  SortOrder,
} from "../api/inventory-api";

interface InventoryToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  statusFilter: InventoryStatusFilter;
  onStatusChange: (value: InventoryStatusFilter) => void;
  sortBy: InventorySortField;
  sortOrder: SortOrder;
  onSortChange: (value: { sortBy: InventorySortField; sortOrder: SortOrder }) => void;
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number | null;
  onRefresh: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: InventoryStatusFilter; label: string }[] = [
  { value: "all", label: "All stock" },
  { value: "in-stock", label: "In stock" },
  { value: "low-stock", label: "Low stock" },
  { value: "out-of-stock", label: "Out of stock" },
  { value: "untracked", label: "Not tracked" },
];

const SORT_OPTIONS: {
  value: string;
  label: string;
  sortBy: InventorySortField;
  sortOrder: SortOrder;
}[] = [
  {
    value: "stock-asc",
    label: "Stock: low to high",
    sortBy: "stockQuantity",
    sortOrder: "asc",
  },
  {
    value: "stock-desc",
    label: "Stock: high to low",
    sortBy: "stockQuantity",
    sortOrder: "desc",
  },
  {
    value: "updated-desc",
    label: "Recently updated",
    sortBy: "updatedAt",
    sortOrder: "desc",
  },
  { value: "name-asc", label: "Name: A–Z", sortBy: "name", sortOrder: "asc" },
  { value: "name-desc", label: "Name: Z–A", sortBy: "name", sortOrder: "desc" },
];

function currentSortValue(
  sortBy: InventorySortField,
  sortOrder: SortOrder,
): string {
  return (
    SORT_OPTIONS.find(
      (option) => option.sortBy === sortBy && option.sortOrder === sortOrder,
    )?.value ?? "stock-asc"
  );
}

export function InventoryToolbar({
  searchInput,
  onSearchChange,
  statusFilter,
  onStatusChange,
  sortBy,
  sortOrder,
  onSortChange,
  isInitialLoading,
  isFetching,
  total,
  onRefresh,
  onResetFilters,
  hasActiveFilters,
}: InventoryToolbarProps) {
  return (
    <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          disabled={isInitialLoading}
          placeholder="Search by product name or SKU…"
          ariaLabel="Search inventory"
        />

        <div className="flex items-center gap-2">
          {total !== null ? (
            <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
              {total.toLocaleString()} {total === 1 ? "product" : "products"}
            </span>
          ) : null}
          {hasActiveFilters ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onResetFilters}
              disabled={isInitialLoading}
              className="text-muted-foreground hover:text-foreground"
            >
              <RotateCcw aria-hidden="true" />
              <span className="hidden sm:inline">Reset filters</span>
            </Button>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isInitialLoading || isFetching}
            aria-label="Refresh inventory"
            title="Refresh inventory"
          >
            <RefreshCw
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <ListFilter
          className="text-muted-foreground hidden size-4 shrink-0 sm:block"
          aria-hidden="true"
        />
        <NativeSelect
          ariaLabel="Filter by stock status"
          value={statusFilter}
          disabled={isInitialLoading}
          onChange={(event) =>
            onStatusChange(event.target.value as InventoryStatusFilter)
          }
          className="w-full sm:w-auto"
          options={STATUS_OPTIONS}
        />
        <div className="w-full sm:ml-auto sm:w-auto">
          <NativeSelect
            ariaLabel="Sort inventory"
            value={currentSortValue(sortBy, sortOrder)}
            disabled={isInitialLoading}
            onChange={(event) => {
              const option = SORT_OPTIONS.find(
                (candidate) => candidate.value === event.target.value,
              );
              if (option) {
                onSortChange({
                  sortBy: option.sortBy,
                  sortOrder: option.sortOrder,
                });
              }
            }}
            className="w-full sm:w-auto sm:min-w-48"
            options={SORT_OPTIONS}
          />
        </div>
      </div>
    </div>
  );
}
