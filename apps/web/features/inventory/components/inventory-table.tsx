"use client";

import {
  createColumnHelper,
  type SortingState,
} from "@tanstack/react-table";
import Link from "next/link";
import {
  ClipboardList,
  History,
  MoreHorizontal,
  PackageSearch,
  Settings2,
  SlidersHorizontal,
} from "lucide-react";

import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ProductThumbnail } from "@/features/products/components/product-thumbnail";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";

import type { InventoryItem } from "../api/inventory-api";
import { InventoryStatusBadge } from "./inventory-status-badge";

const columnHelper = createColumnHelper<DataTableFeatures, InventoryItem>();

interface InventoryTableProps {
  items: InventoryItem[];
  sorting: SortingState;
  onSortingChange: (sorting: SortingState) => void;
  onAdjust: (item: InventoryItem) => void;
  onSettings: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}

export function InventoryTable({
  items,
  sorting,
  onSortingChange,
  onAdjust,
  onSettings,
  onViewHistory,
}: InventoryTableProps) {
  const columns = columnHelper.columns([
    columnHelper.accessor("name", {
      enableSorting: true,
      meta: { className: "min-w-[280px]" },
      header: "Product",
      cell: ({ row }) => <ProductCell item={row.original} />,
    }),
    columnHelper.accessor("category.name", {
      id: "category",
      enableSorting: false,
      meta: { className: "hidden lg:table-cell w-[150px]" },
      header: "Category",
      cell: ({ getValue }) => (
        <span className="text-muted-foreground block max-w-[150px] truncate text-sm">
          {getValue()}
        </span>
      ),
    }),
    columnHelper.accessor("stockQuantity", {
      enableSorting: true,
      meta: { className: "w-[190px]" },
      header: "Available",
      cell: ({ row }) => <StockCell item={row.original} />,
    }),
    columnHelper.accessor("lowStockThreshold", {
      enableSorting: false,
      meta: { className: "hidden sm:table-cell w-[120px]" },
      header: "Threshold",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {row.original.lowStockThreshold === null
            ? "—"
            : row.original.lowStockThreshold.toLocaleString()}
        </span>
      ),
    }),
    columnHelper.accessor("updatedAt", {
      enableSorting: true,
      meta: { className: "hidden md:table-cell w-[150px]" },
      header: "Last updated",
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm tabular-nums">
          {formatDate(row.original.updatedAt)}
        </span>
      ),
    }),
    columnHelper.display({
      id: "actions",
      meta: { className: "w-[64px] text-right" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => (
        <RowActions
          item={row.original}
          onAdjust={onAdjust}
          onSettings={onSettings}
          onViewHistory={onViewHistory}
        />
      ),
    }),
  ]);

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          label="Inventory"
          columns={columns}
          data={items}
          getRowId={(item) => item.id}
          sorting={sorting}
          onSortingChange={onSortingChange}
        />
      </div>

      <ul
        aria-label="Inventory"
        className="divide-border-subtle divide-y md:hidden"
      >
        {items.map((item) => (
          <li key={item.id} className="flex flex-col gap-3 px-4 py-4">
            <div className="flex items-start gap-3">
              <Link
                href={`/products/${item.id}/edit`}
                aria-label={`Open ${item.name}`}
                className="border-border-subtle bg-surface-muted ring-border-subtle size-11 shrink-0 overflow-hidden rounded-md ring-1 ring-inset"
              >
                <ProductThumbnail src={item.image?.url ?? null} alt={item.name} />
              </Link>

              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex min-w-0 flex-col gap-0.5">
                    <Link
                      href={`/products/${item.id}/edit`}
                      className="text-foreground hover:text-primary max-w-[220px] truncate text-sm font-semibold transition-colors hover:underline hover:underline-offset-4"
                    >
                      {item.name}
                    </Link>
                    <span className="text-muted-foreground max-w-[220px] truncate font-mono text-xs">
                      {item.sku ?? `/${item.slug}`}
                      {!item.isActive ? " · inactive" : ""}
                    </span>
                  </div>
                  <RowActions
                    item={item}
                    onAdjust={onAdjust}
                    onSettings={onSettings}
                    onViewHistory={onViewHistory}
                  />
                </div>

                <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                  <span className="text-foreground text-lg leading-none font-semibold tabular-nums">
                    {item.availableQuantity.toLocaleString()}
                    <span className="text-muted-foreground ml-1 text-xs font-normal">
                      available
                    </span>
                  </span>
                  <InventoryStatusBadge status={item.status} />
                </div>

                <div className="text-muted-foreground flex flex-wrap items-center gap-x-3 text-xs">
                  <span>{item.category.name}</span>
                  <span>
                    Threshold:{" "}
                    {item.lowStockThreshold === null
                      ? "—"
                      : item.lowStockThreshold.toLocaleString()}
                  </span>
                  <span>Updated {formatDate(item.updatedAt)}</span>
                </div>
              </div>
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ProductCell({ item }: { item: InventoryItem }) {
  return (
    <div className="flex min-w-0 items-center gap-3">
      <Link
        href={`/products/${item.id}/edit`}
        aria-label={`Open ${item.name}`}
        className="border-border-subtle bg-surface-muted ring-border-subtle size-9 shrink-0 overflow-hidden rounded-md ring-1 ring-inset"
      >
        <ProductThumbnail src={item.image?.url ?? null} alt={item.name} />
      </Link>
      <div className="flex min-w-0 flex-col gap-0.5">
        <Link
          href={`/products/${item.id}/edit`}
          className="text-foreground hover:text-primary max-w-[260px] truncate text-sm font-medium transition-colors hover:underline hover:underline-offset-4"
          title={item.name}
        >
          {item.name}
        </Link>
        <span className="text-muted-foreground flex items-center gap-1.5 font-mono text-xs">
          <span className="max-w-[260px] truncate">
            {item.sku ?? `/${item.slug}`}
          </span>
          {!item.isActive ? (
            <span className="shrink-0 rounded bg-surface-muted px-1 py-px font-sans text-[0.625rem] font-medium tracking-wide uppercase">
              Inactive
            </span>
          ) : null}
        </span>
      </div>
    </div>
  );
}

function StockCell({ item }: { item: InventoryItem }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span
        className={cn(
          "text-lg leading-none font-semibold tabular-nums",
          item.status === "out-of-stock" &&
            "text-destructive-soft-foreground",
          item.status === "low-stock" && "text-warning-soft-foreground",
        )}
      >
        {item.availableQuantity.toLocaleString()}
        {item.unit ? (
          <span className="text-muted-foreground ml-1 text-xs font-normal">
            {item.unit}
          </span>
        ) : null}
      </span>
      <InventoryStatusBadge status={item.status} />
    </div>
  );
}

interface RowActionsProps {
  item: InventoryItem;
  onAdjust: (item: InventoryItem) => void;
  onSettings: (item: InventoryItem) => void;
  onViewHistory: (item: InventoryItem) => void;
}

function RowActions({
  item,
  onAdjust,
  onSettings,
  onViewHistory,
}: RowActionsProps) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          aria-label={`Actions for ${item.name}`}
          className="text-muted-foreground data-[state=open]:bg-surface-active data-[state=open]:text-foreground"
        >
          <MoreHorizontal aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={6} className="w-56">
        <DropdownMenuLabel className="text-muted-foreground text-xs font-normal">
          {item.sku ? `SKU ${item.sku}` : item.name}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          disabled={!item.trackInventory}
          onSelect={() => {
            onAdjust(item);
          }}
        >
          <SlidersHorizontal aria-hidden="true" />
          Adjust stock
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onSettings(item);
          }}
        >
          <Settings2 aria-hidden="true" />
          Tracking & threshold
        </DropdownMenuItem>
        <DropdownMenuItem
          onSelect={() => {
            onViewHistory(item);
          }}
        >
          <History aria-hidden="true" />
          Stock history
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href={`/products/${item.id}/edit`}>
            <PackageSearch aria-hidden="true" />
            Open product
          </Link>
        </DropdownMenuItem>
        {item.trackInventory ? (
          <DropdownMenuItem asChild>
            <Link href={`/products/${item.id}/edit`}>
              <ClipboardList aria-hidden="true" />
              Edit product details
            </Link>
          </DropdownMenuItem>
        ) : null}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
