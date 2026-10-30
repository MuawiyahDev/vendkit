"use client";

import type { SortingState } from "@tanstack/react-table";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Package, Plus, SearchX } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";

import { updateProduct, type Product } from "../api/products-api";
import { useCatalogOptions } from "../hooks/use-catalog-options";
import { useProducts } from "../hooks/use-products";
import { ProductDeleteDialog } from "./product-delete-dialog";
import { ProductsTable } from "./products-table";
import { ProductsTableSkeleton } from "./products-table-skeleton";
import { ProductsToolbar } from "./products-toolbar";
import {
  fromTableSorting,
  toSortingEntry,
} from "../utils/products.utils";

const NOTICE_PARAM = "notice";

export function ProductsPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // One-shot success notice left in the URL by the editor pages (e.g.
  // after creating a product); dismissed notices never replay.
  const notice = searchParams.get(NOTICE_PARAM);
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    stockFilter,
    setStockFilter,
    categoryId,
    setCategoryId,
    brandId,
    setBrandId,
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setPageSize,
    refresh,
    clearFilters,
  } = useProducts();

  const {
    view: catalogView,
  } = useCatalogOptions();

  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const liveNotice =
    notice !== null && notice !== dismissedNotice ? notice : null;
  const feedback = actionFeedback ?? liveNotice;

  /**
   * Shows a new action message, consuming any pending creation notice so
   * the two sources can never fight, and cleaning the URL so a refresh
   * cannot replay it.
   */
  function publishFeedback(message: string) {
    if (notice !== null) {
      setDismissedNotice(notice);
      router.replace(pathname, { scroll: false });
    }
    setActionFeedback(message);
  }

  const dismissFeedback = useCallback(() => {
    if (actionFeedback !== null) {
      setActionFeedback(null);
      return;
    }
    if (notice !== null) {
      setDismissedNotice(notice);
      router.replace(pathname, { scroll: false });
    }
  }, [actionFeedback, notice, router, pathname]);

  const handleRefresh = useCallback(() => {
    setActionError(null);
    refresh();
  }, [refresh]);

  const sorting: SortingState = (() => {
    const entry = toSortingEntry(sortBy, sortOrder);
    return entry ? [entry] : [];
  })();

  function handleSortingChange(next: SortingState) {
    const parsed = fromTableSorting(next);
    if (parsed) {
      setSort(parsed);
    }
  }

  function handleDeleteSuccess(product: Product) {
    setDeleteTarget(null);
    setDeleteDialogOpen(false);
    setActionError(null);
    publishFeedback(`${product.name} was deleted.`);

    // Step back a page when the removed row was the last one on its page.
    const meta = view.status === "success" ? view.data.meta : null;
    const remaining = meta ? meta.total - 1 : 0;
    if (meta && meta.page > 1 && remaining <= (meta.page - 1) * meta.limit) {
      setPage(meta.page - 1);
      return;
    }
    refresh();
  }

  async function handleToggleStatus(product: Product) {
    if (updatingStatusId) {
      return;
    }

    setUpdatingStatusId(product.id);
    setActionError(null);

    try {
      const updated = await updateProduct(product.id, {
        isActive: !product.isActive,
      });
      publishFeedback(
        `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`,
      );
      refresh();
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while updating this product.",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  const isInitialLoading = view.status === "loading";
  const hasSearchQuery = debouncedSearch.length > 0;
  const hasStatusFilter = statusFilter !== "all";
  const hasStockFilter = stockFilter !== "all";
  const hasCategoryFilter = categoryId.length > 0;
  const hasBrandFilter = brandId.length > 0;
  const hasActiveFilters =
    hasSearchQuery ||
    hasStatusFilter ||
    hasStockFilter ||
    hasCategoryFilter ||
    hasBrandFilter;
  const products = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  const categories = catalogView.status === "success" ? catalogView.categories : [];
  const brands = catalogView.status === "success" ? catalogView.brands : [];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Products"
        description="Manage your catalog: pricing, stock levels, categories, brands, and images."
        actions={
          <Button
            type="button"
            onClick={() => router.push("/products/new")}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" />
            Add product
          </Button>
        }
      />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      {actionError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{actionError}</AlertDescription>
        </Alert>
      ) : null}

      <Card aria-busy={isFetching} className="gap-0 overflow-hidden py-0">
        <ProductsToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          isInitialLoading={isInitialLoading}
          isFetching={isFetching}
          total={meta ? meta.total : null}
          categories={categories}
          brands={brands}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          stockFilter={stockFilter}
          onStockFilterChange={setStockFilter}
          categoryId={categoryId}
          onCategoryChange={setCategoryId}
          brandId={brandId}
          onBrandChange={setBrandId}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSort}
          onRefresh={handleRefresh}
          onResetFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

        {view.status === "error" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-12 text-center">
            <Alert variant="destructive" className="max-w-md text-left">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{view.message}</AlertDescription>
            </Alert>
            <Button type="button" variant="outline" onClick={handleRefresh}>
              Try again
            </Button>
          </div>
        ) : isInitialLoading ? (
          <ProductsTableSkeleton />
        ) : products.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No products found"
              description={
                hasSearchQuery
                  ? `No products match “${debouncedSearch}”. Try another search or clear your filters.`
                  : "No products match the selected filters."
              }
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Package}
              title="No products yet"
              description="Add your first product to start building your catalog with prices, stock, and images."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button
                type="button"
                onClick={() => router.push("/products/new")}
              >
                <Plus aria-hidden="true" />
                Add product
              </Button>
            </EmptyState>
          )
        ) : (
          <ProductsTable
            products={products}
            sorting={sorting}
            onSortingChange={handleSortingChange}
            updatingStatusId={updatingStatusId}
            onEdit={(product) => router.push(`/products/${product.id}/edit`)}
            onToggleStatus={(product) => void handleToggleStatus(product)}
            onDelete={(product) => {
              setDeleteTarget(product);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {meta ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={view.status !== "success"}
            itemLabel="products"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>

      <ProductDeleteDialog
        product={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onSuccess={handleDeleteSuccess}
      />
    </div>
  );
}
