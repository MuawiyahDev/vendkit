"use client";

import { AlertCircle, Plus, RefreshCw, SearchX, Shapes } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SearchInput } from "@/components/shared/search-input";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ApiError } from "@/lib/api/client";

import { updateBrand, type Brand } from "../api/brands-api";
import { useBrands } from "../hooks/use-brands";
import { BrandsStatusFilter } from "./brands-status-filter";
import { BrandsTable } from "./brands-table";
import { BrandsTableSkeleton } from "./brands-table-skeleton";
import { BrandDeleteDialog } from "./brand-delete-dialog";
import { BrandFormDialog } from "./brand-form-dialog";

type BrandEditor = { mode: "create" } | { mode: "edit"; brand: Brand } | null;

export function BrandsPage() {
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    page,
    setPage,
    setPageSize,
    refresh,
  } = useBrands();

  const [editor, setEditor] = useState<BrandEditor>(null);
  const [deleteTarget, setDeleteTarget] = useState<Brand | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const handleRefresh = useCallback(() => {
    setActionError(null);
    refresh();
  }, [refresh]);

  function handleFormSuccess(brand: Brand, mode: "create" | "edit") {
    setEditor(null);
    setActionError(null);
    setFeedback(
      mode === "create"
        ? `${brand.name} was added.`
        : `Changes to ${brand.name} were saved.`,
    );

    if (mode === "create" && page !== 1) {
      setPage(1);
      return;
    }
    refresh();
  }

  function handleDeleteSuccess(brand: Brand) {
    setDeleteTarget(null);
    setDeleteDialogOpen(false);
    setActionError(null);
    setFeedback(`${brand.name} was deleted.`);

    // Step back a page when the removed row was the last one on its page.
    const meta = view.status === "success" ? view.data.meta : null;
    const remaining = meta ? meta.total - 1 : 0;
    if (meta && meta.page > 1 && remaining <= (meta.page - 1) * meta.limit) {
      setPage(meta.page - 1);
      return;
    }
    refresh();
  }

  async function handleToggleStatus(brand: Brand) {
    if (updatingStatusId) {
      return;
    }

    setUpdatingStatusId(brand.id);
    setActionError(null);

    try {
      const updated = await updateBrand(brand.id, {
        isActive: !brand.isActive,
      });
      setFeedback(
        `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`,
      );
      refresh();
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while updating this brand.",
      );
    } finally {
      setUpdatingStatusId(null);
    }
  }

  function clearFilters() {
    setSearchInput("");
    setStatusFilter("all");
  }

  const isInitialLoading = view.status === "loading";
  const hasSearchQuery = debouncedSearch.length > 0;
  const hasStatusFilter = statusFilter !== "all";
  const hasActiveFilters = hasSearchQuery || hasStatusFilter;
  const brands = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Brands"
        description="Organize your products by brand, and control which brands are available across your catalog."
        actions={
          <Button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" />
            Add brand
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
        <div className="border-border-subtle border-b px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <SearchInput
              value={searchInput}
              onChange={setSearchInput}
              disabled={isInitialLoading}
              placeholder="Search brands…"
              ariaLabel="Search brands"
            />

            <div className="flex items-center gap-2">
              {meta ? (
                <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
                  {meta.total.toLocaleString()}{" "}
                  {meta.total === 1 ? "brand" : "brands"}
                </span>
              ) : null}
              <BrandsStatusFilter
                value={statusFilter}
                onChange={setStatusFilter}
                disabled={isInitialLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleRefresh}
                disabled={isInitialLoading || isFetching}
                aria-label="Refresh brands"
                title="Refresh brands"
              >
                <RefreshCw
                  className={isFetching ? "animate-spin" : undefined}
                  aria-hidden="true"
                />
              </Button>
            </div>
          </div>
        </div>

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
          <BrandsTableSkeleton />
        ) : brands.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No brands found"
              description={
                hasSearchQuery && hasStatusFilter
                  ? `No ${statusFilter} brands match “${debouncedSearch}”. Try another search or status.`
                  : hasSearchQuery
                    ? `No brands match “${debouncedSearch}”. Try a different search.`
                    : `There are no ${statusFilter} brands yet.`
              }
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Shapes}
              title="No brands yet"
              description="Add your first brand to group products by manufacturer or label."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add brand
              </Button>
            </EmptyState>
          )
        ) : (
          <BrandsTable
            brands={brands}
            updatingStatusId={updatingStatusId}
            onEdit={(brand) => setEditor({ mode: "edit", brand })}
            onToggleStatus={(brand) => void handleToggleStatus(brand)}
            onDelete={(brand) => {
              setDeleteTarget(brand);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {meta ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={view.status !== "success"}
            itemLabel="brands"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>

      {editor ? (
        <BrandFormDialog
          key={editor.mode === "edit" ? editor.brand.id : "create"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditor(null);
            }
          }}
          brand={editor.mode === "edit" ? editor.brand : null}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      <BrandDeleteDialog
        brand={deleteTarget}
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
