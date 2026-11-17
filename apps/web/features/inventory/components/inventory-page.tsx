"use client";

import type { SortingState } from "@tanstack/react-table";
import Link from "next/link";
import {
  AlertCircle,
  Boxes,
  History,
  Package,
  SearchX,
} from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

import type {
  InventorySortField,
  InventoryItem,
  SortOrder,
  StockAdjustmentResult,
} from "../api/inventory-api";
import { useInventory } from "../hooks/use-inventory";
import { useInventoryOverview } from "../hooks/use-inventory-overview";
import { useStockMovements } from "../hooks/use-stock-movements";
import { InventorySettingsDialog } from "./inventory-settings-dialog";
import { InventoryStats } from "./inventory-stats";
import { InventoryTable } from "./inventory-table";
import { InventoryToolbar } from "./inventory-toolbar";
import { StockAdjustDialog } from "./stock-adjust-dialog";
import { StockMovementsTable } from "./stock-movements-table";
import { StockMovementsToolbar } from "./stock-movements-toolbar";

type View = "stock" | "movements";

const SORTABLE_COLUMN_IDS = ["name", "stockQuantity", "updatedAt"] as const;
type SortableColumnId = (typeof SORTABLE_COLUMN_IDS)[number];

function toSortingEntry(
  sortBy: InventorySortField,
  sortOrder: SortOrder,
): { id: SortableColumnId; desc: boolean } | null {
  const match = SORTABLE_COLUMN_IDS.find((id) => id === sortBy);
  return match ? { id: match, desc: sortOrder === "desc" } : null;
}

export function InventoryPage() {
  const [activeView, setActiveView] = useState<View>("stock");
  const [feedback, setFeedback] = useState<string | null>(null);
  const [adjustTarget, setAdjustTarget] = useState<InventoryItem | null>(null);
  const [settingsTarget, setSettingsTarget] = useState<InventoryItem | null>(
    null,
  );

  const inventory = useInventory();
  const overview = useInventoryOverview();
  const movements = useStockMovements();

  const refreshAll = useCallback(() => {
    inventory.refresh();
    overview.refresh();
    movements.refresh();
  }, [inventory, overview, movements]);

  const sorting: SortingState = (() => {
    const entry = toSortingEntry(inventory.sortBy, inventory.sortOrder);
    return entry ? [entry] : [];
  })();

  function handleSortingChange(next: SortingState) {
    const entry = next[0];
    const match = SORTABLE_COLUMN_IDS.find((id) => id === entry?.id);
    if (match) {
      inventory.setSort({
        sortBy: match,
        sortOrder: entry?.desc ? "desc" : "asc",
      });
    }
  }

  function handleAdjusted(result: StockAdjustmentResult) {
    setFeedback(
      `Stock for ${result.item.name} is now ${result.item.availableQuantity.toLocaleString()} ${result.item.unit ?? "units"}.`,
    );
    refreshAll();
  }

  function handleSettingsSaved(item: InventoryItem) {
    setFeedback(
      `${item.name} is now ${item.trackInventory ? "tracked" : "not tracked"}${
        item.lowStockThreshold !== null
          ? ` with a threshold of ${item.lowStockThreshold.toLocaleString()}`
          : ""
      }.`,
    );
    refreshAll();
  }

  function handleViewHistory(item: InventoryItem) {
    movements.showProduct({ id: item.id, name: item.name });
    setActiveView("movements");
  }

  const hasStockFilters =
    inventory.debouncedSearch.length > 0 || inventory.statusFilter !== "all";
  const isInitialLoading = inventory.view.status === "loading";
  const movementsLoading = movements.view.status === "loading";
  const movementItems =
    movements.view.status === "success" ? movements.view.data.data : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Inventory"
        description="Track stock levels, adjust quantities with a full audit trail, and catch low-stock products before they run out."
        actions={
          <Button type="button" variant="outline" asChild className="w-full sm:w-auto">
            <Link href="/products">
              <Package aria-hidden="true" />
              Manage products
            </Link>
          </Button>
        }
      />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={() => setFeedback(null)} />
      ) : null}

      {overview.view.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>
            Inventory totals could not be loaded: {overview.view.message}
          </AlertDescription>
        </Alert>
      ) : null}

      <InventoryStats
        overview={
          overview.view.status === "success" ? overview.view.data : null
        }
        loading={overview.view.status === "loading"}
        error={overview.view.status === "error" ? overview.view.message : null}
      />

      <div
        role="tablist"
        aria-label="Inventory views"
        className="border-border-subtle bg-surface-muted/60 inline-flex w-fit items-center gap-1 rounded-lg border p-1"
      >
        <Button
          type="button"
          role="tab"
          aria-selected={activeView === "stock"}
          size="sm"
          variant={activeView === "stock" ? "default" : "ghost"}
          onClick={() => setActiveView("stock")}
        >
          <Boxes aria-hidden="true" />
          Stock levels
        </Button>
        <Button
          type="button"
          role="tab"
          aria-selected={activeView === "movements"}
          size="sm"
          variant={activeView === "movements" ? "default" : "ghost"}
          onClick={() => setActiveView("movements")}
        >
          <History aria-hidden="true" />
          Movement history
        </Button>
      </div>

      {activeView === "stock" ? (
        <Card aria-busy={inventory.isFetching} className="gap-0 overflow-hidden py-0">
          <InventoryToolbar
            searchInput={inventory.searchInput}
            onSearchChange={inventory.setSearchInput}
            statusFilter={inventory.statusFilter}
            onStatusChange={inventory.setStatusFilter}
            sortBy={inventory.sortBy}
            sortOrder={inventory.sortOrder}
            onSortChange={inventory.setSort}
            isInitialLoading={isInitialLoading}
            isFetching={inventory.isFetching}
            total={inventory.meta?.total ?? null}
            onRefresh={refreshAll}
            onResetFilters={inventory.clearFilters}
            hasActiveFilters={hasStockFilters}
          />

          {inventory.view.status === "error" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <Alert variant="destructive" className="max-w-md text-left">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{inventory.view.message}</AlertDescription>
              </Alert>
              <Button type="button" variant="outline" onClick={refreshAll}>
                Try again
              </Button>
            </div>
          ) : isInitialLoading ? (
            <InventoryTableSkeleton />
          ) : inventory.items.length === 0 ? (
            <EmptyState
              icon={hasStockFilters ? SearchX : Boxes}
              title={
                hasStockFilters ? "No products match" : "No products to track"
              }
              description={
                hasStockFilters
                  ? "Try another search or clear the stock filter."
                  : "Add products to your catalog to start tracking inventory."
              }
              className="rounded-none border-0 bg-transparent py-16"
            >
              {hasStockFilters ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={inventory.clearFilters}
                >
                  Clear filters
                </Button>
              ) : (
                <Button type="button" asChild>
                  <Link href="/products/new">Add product</Link>
                </Button>
              )}
            </EmptyState>
          ) : (
            <InventoryTable
              items={inventory.items}
              sorting={sorting}
              onSortingChange={handleSortingChange}
              onAdjust={(item) => {
                setAdjustTarget(item);
              }}
              onSettings={(item) => {
                setSettingsTarget(item);
              }}
              onViewHistory={handleViewHistory}
            />
          )}

          {inventory.meta ? (
            <TablePagination
              meta={inventory.meta}
              onPageChange={inventory.setPage}
              disabled={inventory.view.status !== "success"}
              itemLabel="products"
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={inventory.setPageSize}
            />
          ) : null}
        </Card>
      ) : (
        <Card
          aria-busy={movements.isFetching}
          className="gap-0 overflow-hidden py-0"
        >
          <StockMovementsToolbar
            searchInput={movements.searchInput}
            onSearchChange={movements.setSearchInput}
            typeFilter={movements.typeFilter}
            onTypeChange={movements.setTypeFilter}
            productFilter={movements.productFilter}
            onClearProduct={movements.clearProductFilter}
            isInitialLoading={movementsLoading}
            isFetching={movements.isFetching}
            total={movements.meta?.total ?? null}
            onRefresh={movements.refresh}
          />

          {movements.view.status === "error" ? (
            <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
              <Alert variant="destructive" className="max-w-md text-left">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{movements.view.message}</AlertDescription>
              </Alert>
              <Button
                type="button"
                variant="outline"
                onClick={movements.refresh}
              >
                Try again
              </Button>
            </div>
          ) : movementsLoading ? (
            <InventoryTableSkeleton />
          ) : movementItems.length === 0 ? (
            <EmptyState
              icon={History}
              title="No stock movements yet"
              description="Adjust stock or place an order to start building the audit trail."
              className="rounded-none border-0 bg-transparent py-16"
            />
          ) : (
            <StockMovementsTable movements={movementItems} />
          )}

          {movements.meta ? (
            <TablePagination
              meta={movements.meta}
              onPageChange={movements.setPage}
              disabled={movements.view.status !== "success"}
              itemLabel="movements"
              pageSizeOptions={[10, 20, 50, 100]}
              onPageSizeChange={movements.setPageSize}
            />
          ) : null}
        </Card>
      )}

      {adjustTarget ? (
        <StockAdjustDialog
          key={adjustTarget.id}
          item={adjustTarget}
          open
          onOpenChange={(open) => {
            if (!open) {
              setAdjustTarget(null);
            }
          }}
          onAdjusted={handleAdjusted}
        />
      ) : null}

      {settingsTarget ? (
        <InventorySettingsDialog
          key={settingsTarget.id}
          item={settingsTarget}
          open
          onOpenChange={(open) => {
            if (!open) {
              setSettingsTarget(null);
            }
          }}
          onSaved={handleSettingsSaved}
        />
      ) : null}
    </div>
  );
}

function InventoryTableSkeleton() {
  return (
    <div className="flex flex-col gap-3 px-5 py-4" aria-hidden="true">
      {Array.from({ length: 6 }, (_, index) => (
        <div key={index} className="flex items-center gap-3">
          <Skeleton className="size-9 shrink-0 rounded-md" />
          <div className="flex flex-1 flex-col gap-1.5">
            <Skeleton className="h-4 w-48 max-w-[50%]" />
            <Skeleton className="h-3 w-28 max-w-[35%]" />
          </div>
          <Skeleton className="h-6 w-20" />
          <Skeleton className="hidden h-4 w-24 sm:block" />
        </div>
      ))}
    </div>
  );
}
