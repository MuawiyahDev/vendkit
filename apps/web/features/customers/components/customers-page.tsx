"use client";

import { AlertCircle, Plus, RefreshCw, UserX, Users } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import type { Customer } from "../api/customers-api";
import { useCustomers } from "../hooks/use-customers";
import { CustomerDeleteDialog } from "./customer-delete-dialog";
import { CustomerFormDialog } from "./customer-form-dialog";
import { CustomersSearchInput } from "./customers-search-input";
import { CustomersSortMenu } from "./customers-sort-menu";
import { CustomersTable } from "./customers-table";
import { CustomersTableSkeleton } from "./customers-table-skeleton";

type CustomerEditor =
  { mode: "create" } | { mode: "edit"; customer: Customer } | null;

export function CustomersPage() {
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    setPage,
    setPageSize,
    sortBy,
    sortOrder,
    setSort,
    refresh,
  } = useCustomers();

  const [editor, setEditor] = useState<CustomerEditor>(null);
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const dismissFeedback = useCallback(() => setFeedback(null), []);

  function handleFormSuccess(customer: Customer, mode: "create" | "edit") {
    setEditor(null);
    setFeedback(
      mode === "create"
        ? `${customer.name} was added.`
        : `Changes to ${customer.name} were saved.`,
    );
    refresh();
  }

  function handleDeleteSuccess(customer: Customer) {
    setDeleteTarget(null);
    setDeleteDialogOpen(false);
    setFeedback(`${customer.name} was deleted.`);

    // Step back a page when the removed row was the last one on its page.
    const meta = view.status === "success" ? view.data.meta : null;
    const remaining = meta ? meta.total - 1 : 0;
    if (meta && meta.page > 1 && remaining <= (meta.page - 1) * meta.limit) {
      setPage(meta.page - 1);
      return;
    }
    refresh();
  }

  const isInitialLoading = view.status === "loading";
  const hasSearchQuery = debouncedSearch.length > 0;
  const customers = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Customers"
        description="Manage customer contacts, delivery details, and order history in one place."
        actions={
          <Button
            type="button"
            onClick={() => setEditor({ mode: "create" })}
            className="w-full sm:w-auto"
          >
            <Plus aria-hidden="true" />
            Add customer
          </Button>
        }
      />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <Card aria-busy={isFetching} className="gap-0 overflow-hidden py-0">
        <div className="border-border-subtle border-b px-4 py-3.5 sm:px-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <CustomersSearchInput
              value={searchInput}
              onChange={setSearchInput}
              disabled={isInitialLoading}
            />

            <div className="flex items-center gap-2">
              {meta ? (
                <span className="text-muted-foreground mr-auto text-xs whitespace-nowrap tabular-nums">
                  {meta.total.toLocaleString()}{" "}
                  {meta.total === 1 ? "customer" : "customers"}
                </span>
              ) : null}
              <CustomersSortMenu
                sortBy={sortBy}
                sortOrder={sortOrder}
                onSortChange={setSort}
                disabled={isInitialLoading}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={refresh}
                disabled={isInitialLoading || isFetching}
                aria-label="Refresh customers"
                title="Refresh customers"
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
            <Button type="button" variant="outline" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : isInitialLoading ? (
          <CustomersTableSkeleton />
        ) : customers.length === 0 ? (
          hasSearchQuery ? (
            <EmptyState
              icon={Users}
              title="No customers found"
              description={`No customers match “${debouncedSearch}”. Try a different name, email, or phone number.`}
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button
                type="button"
                variant="outline"
                onClick={() => setSearchInput("")}
              >
                Clear search
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={UserX}
              title="No customers yet"
              description="Add your first customer to start keeping track of who orders from you."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button
                type="button"
                onClick={() => setEditor({ mode: "create" })}
              >
                <Plus aria-hidden="true" />
                Add customer
              </Button>
            </EmptyState>
          )
        ) : (
          <CustomersTable
            customers={customers}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={setSort}
            onEdit={(customer) => setEditor({ mode: "edit", customer })}
            onDelete={(customer) => {
              setDeleteTarget(customer);
              setDeleteDialogOpen(true);
            }}
          />
        )}

        {meta ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={view.status !== "success"}
            itemLabel="customers"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>

      {editor ? (
        <CustomerFormDialog
          key={editor.mode === "edit" ? editor.customer.id : "create"}
          open
          onOpenChange={(open) => {
            if (!open) {
              setEditor(null);
            }
          }}
          customer={editor.mode === "edit" ? editor.customer : null}
          onSuccess={handleFormSuccess}
        />
      ) : null}

      <CustomerDeleteDialog
        customer={deleteTarget}
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
