"use client";

import { AlertCircle, Plus, RefreshCw, SearchX, Tags } from "lucide-react";
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

import { updateCategory, type Category } from "../api/categories-api";
import { useCategories } from "../hooks/use-categories";
import { CategoriesStatusFilter } from "./categories-status-filter";
import { CategoriesTable } from "./categories-table";
import { CategoriesTableSkeleton } from "./categories-table-skeleton";
import { CategoryDeleteDialog } from "./category-delete-dialog";
import { CategoryFormDialog } from "./category-form-dialog";

type CategoryEditor =
  { mode: "create" } | { mode: "edit"; category: Category } | null;

export function CategoriesPage() {
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
  } = useCategories();

  const [editor, setEditor] = useState<CategoryEditor>(null);
  const [deleteTarget, setDeleteTarget] = useState<Category | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [updatingStatusId, setUpdatingStatusId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  const handleRefresh = useCallback(() => {
    setActionError(null);
    refresh();
  }, [refresh]);

  function handleFormSuccess(category: Category, mode: "create" | "edit") {
    setEditor(null);
    setActionError(null);
    setFeedback(
      mode === "create"
        ? `${category.name} was added.`
        : `Changes to ${category.name} were saved.`,
    );

    if (mode === "create" && page !== 1) {
      setPage(1);
      return;
    }
    refresh();
  }

  function handleDeleteSuccess(category: Category) {
    setDeleteTarget(null);
    setDeleteDialogOpen(false);
    setActionError(null);
    setFeedback(`${category.name} was deleted.`);

    // Step back a page when the removed row was the last one on its page.
    const meta = view.status === "success" ? view.data.meta : null;
    const remaining = meta ? meta.total - 1 : 0;
    if (meta && meta.page > 1 && remaining <= (meta.page - 1) * meta.limit) {
      setPage(meta.page - 1);
      return;
    }
    refresh();
  }

  async function handleToggleStatus(category: Category) {
    if (updatingStatusId) {
      return;
    }

    setUpdatingStatusId(category.id);
    setActionError(null);

    try {
      const updated = await updateCategory(category.id, {
        isActive: !category.isActive,
      });
      setFeedback(
        `${updated.name} is now ${updated.isActive ? "active" : "inactive"}.`,
      );
      refresh();
    } catch (error) {
      setActionError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong while updating this category.",
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
  const categories = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Categories"
        description="Organize your catalog with categories, and control which ones are active."
        actions={
          <Button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" />
            Add category
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
              placeholder="Search categories…"
              ariaLabel="Search categories"
            />

            <div className="flex items-center gap-2">
              {meta ? (
                <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
                  {meta.total.toLocaleString()}{" "}
                  {meta.total === 1 ? "category" : "categories"}
                </span>
              ) : null}
              <CategoriesStatusFilter
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
                aria-label="Refresh categories"
                title="Refresh categories"
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
          <CategoriesTableSkeleton />
        ) : categories.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={SearchX}
              title="No categories found"
              description={
                hasSearchQuery && hasStatusFilter
                  ? `No ${statusFilter} categories match “${debouncedSearch}”. Try another search or status.`
                  : hasSearchQuery
                    ? `No categories match “${debouncedSearch}”. Try a different search.`
                    : `There are no ${statusFilter} categories yet.`
              }
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={Tags}
              title="No categories yet"
              description="Add your first category to start organizing the products in your catalog."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add category
              </Button>
            </EmptyState>
          )
        ) : (
          <CategoriesTable
            categories={categories}
            updatingStatusId={updatingStatusId}
            onEdit={(category) => setEditor({ mode: "edit", category })}
            onToggleStatus={(category) => void handleToggleStatus(category)}
            onDelete={(category) => {
              setDeleteTarget(category);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {meta ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={view.status !== "success"}
            itemLabel="categories"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>

      {editor ? (
        <CategoryFormDialog
          key={editor.mode === "edit" ? editor.category.id : "create"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditor(null);
            }
          }}
          category={editor.mode === "edit" ? editor.category : null}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      <CategoryDeleteDialog
        category={deleteTarget}
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
