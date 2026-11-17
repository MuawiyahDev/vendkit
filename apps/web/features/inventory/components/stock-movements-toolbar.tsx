"use client";

import { ListFilter, RefreshCw, X } from "lucide-react";

import { NativeSelect } from "@/components/shared/native-select";
import { SearchInput } from "@/components/shared/search-input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

import {
  STOCK_MOVEMENT_TYPES,
  type StockMovementType,
} from "../api/inventory-api";
import { MOVEMENT_TYPE_LABELS } from "../utils/inventory.utils";

interface StockMovementsToolbarProps {
  searchInput: string;
  onSearchChange: (value: string) => void;
  typeFilter: StockMovementType | "all";
  onTypeChange: (value: StockMovementType | "all") => void;
  productFilter: { id: string; name: string } | null;
  onClearProduct: () => void;
  isInitialLoading: boolean;
  isFetching: boolean;
  total: number | null;
  onRefresh: () => void;
}

const TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: "all", label: "All movement types" },
  ...STOCK_MOVEMENT_TYPES.map((value) => ({
    value,
    label: MOVEMENT_TYPE_LABELS[value],
  })),
];

export function StockMovementsToolbar({
  searchInput,
  onSearchChange,
  typeFilter,
  onTypeChange,
  productFilter,
  onClearProduct,
  isInitialLoading,
  isFetching,
  total,
  onRefresh,
}: StockMovementsToolbarProps) {
  return (
    <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <SearchInput
          value={searchInput}
          onChange={onSearchChange}
          disabled={isInitialLoading}
          placeholder="Search product, SKU, or order…"
          ariaLabel="Search stock movements"
        />

        <div className="flex items-center gap-2">
          {total !== null ? (
            <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
              {total.toLocaleString()}{" "}
              {total === 1 ? "movement" : "movements"}
            </span>
          ) : null}
          <Button
            type="button"
            variant="outline"
            size="icon"
            onClick={onRefresh}
            disabled={isInitialLoading || isFetching}
            aria-label="Refresh stock movements"
            title="Refresh stock movements"
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
          ariaLabel="Filter by movement type"
          value={typeFilter}
          disabled={isInitialLoading}
          onChange={(event) =>
            onTypeChange(event.target.value as StockMovementType | "all")
          }
          className="w-full sm:w-auto sm:min-w-48"
          options={TYPE_OPTIONS}
        />
        {productFilter ? (
          <Badge variant="secondary" className="gap-1.5 py-1">
            <span className="max-w-48 truncate">{productFilter.name}</span>
            <button
              type="button"
              onClick={onClearProduct}
              aria-label="Clear product filter"
              className="hover:text-foreground focus-visible:ring-ring/40 rounded-full outline-none focus-visible:ring-2"
            >
              <X className="size-3" aria-hidden="true" />
            </button>
          </Badge>
        ) : null}
      </div>
    </div>
  );
}
