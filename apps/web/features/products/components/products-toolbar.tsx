"use client";

import { ListFilter, RefreshCw, RotateCcw } from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";

import type { Brand } from "@/features/brands/api/brands-api";
import type { Category } from "@/features/categories/api/categories-api";

import type {
  ProductSortField,
  SortOrder,
} from "../api/products-api";
import { ProductsSortMenu } from "./products-sort-menu";

type StatusFilterValue = "all" | "active" | "inactive";
type StockFilterValue = "all" | "low";

function readStatusFilter(value: string): StatusFilterValue | null {
  const match = STATUS_OPTIONS.find((option) => option.value === value);
  return match ? match.value : null;
}

function readStockFilter(value: string): StockFilterValue | null {
  const match = STOCK_OPTIONS.find((option) => option.value === value);
  return match ? match.value : null;
}

interface ProductsToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number | null;
  categories: Category[];
  brands: Brand[];
  statusFilter: StatusFilterValue;
  onStatusFilterChange: (value: StatusFilterValue) => void;
  stockFilter: StockFilterValue;
  onStockFilterChange: (value: StockFilterValue) => void;
  categoryId: string;
  onCategoryChange: (value: string) => void;
  brandId: string;
  onBrandChange: (value: string) => void;
  sortBy: ProductSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: ProductSortField;
    sortOrder: SortOrder;
  }) => void;
  onRefresh: () => void;
  onResetFilters: () => void;
  hasActiveFilters: boolean;
}

const STATUS_OPTIONS: { value: StatusFilterValue; label: string }[] = [
  { value: "all", label: "All statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
];

const STOCK_OPTIONS: { value: StockFilterValue; label: string }[] = [
  { value: "all", label: "Any stock" },
  { value: "low", label: "Low stock" },
];

/**
 * Search, filters, sorting, and refresh controls for the products table.
 * Category and brand options come from their real API endpoints.
 */
export function ProductsToolbar({
  searchInput,
  onSearchChange,
  isInitialLoading,
  isFetching,
  total,
  categories,
  brands,
  statusFilter,
  onStatusFilterChange,
  stockFilter,
  onStockFilterChange,
  categoryId,
  onCategoryChange,
  brandId,
  onBrandChange,
  sortBy,
  sortOrder,
  onSortChange,
  onRefresh,
  onResetFilters,
  hasActiveFilters,
}: ProductsToolbarProps) {
  return (
    <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          disabled={isInitialLoading}
          placeholder="Search products…"
          ariaLabel="Search products"
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
            aria-label="Refresh products"
            title="Refresh products"
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
          ariaLabel="Filter by category"
          placeholder="All categories"
          value={categoryId}
          disabled={isInitialLoading}
          onChange={(event) => onCategoryChange(event.target.value)}
          className="w-full sm:w-auto sm:min-w-44"
          options={categories.map((category) => ({
            value: category.id,
            label: category.name,
          }))}
        />
        <NativeSelect
          ariaLabel="Filter by brand"
          placeholder="All brands"
          value={brandId}
          disabled={isInitialLoading}
          onChange={(event) => onBrandChange(event.target.value)}
          className="w-full sm:w-auto sm:min-w-40"
          options={brands.map((brand) => ({
            value: brand.id,
            label: brand.name,
          }))}
        />
        <NativeSelect
          ariaLabel="Filter by status"
          value={statusFilter}
          disabled={isInitialLoading}
          onChange={(event) => {
            const next = readStatusFilter(event.target.value);
            if (next !== null) {
              onStatusFilterChange(next);
            }
          }}
          className="w-full sm:w-auto"
          options={STATUS_OPTIONS}
        />
        <NativeSelect
          ariaLabel="Filter by stock level"
          value={stockFilter}
          disabled={isInitialLoading}
          onChange={(event) => {
            const next = readStockFilter(event.target.value);
            if (next !== null) {
              onStockFilterChange(next);
            }
          }}
          className="w-full sm:w-auto"
          options={STOCK_OPTIONS}
        />
        <div className="ml-auto w-full sm:w-auto">
          <ProductsSortMenu
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={onSortChange}
            disabled={isInitialLoading}
            className="w-full sm:w-auto"
          />
        </div>
      </div>
    </div>
  );
}
