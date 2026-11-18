"use client";

import { AlertCircle, FileText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { useInvoices } from "../hooks/use-invoices";
import { InvoicesTable } from "./invoices-table";
import { InvoicesTableSkeleton } from "./invoices-table-skeleton";
import { InvoicesToolbar } from "./invoices-toolbar";

export function InvoicesPage() {
  const {
    invoices,
    meta,
    isFetching,
    error,
    searchInput,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    setPage,
    setPageSize,
    refresh,
    clearFilters,
    hasActiveFilters,
  } = useInvoices();

  const showSkeleton = isFetching && invoices.length === 0;
  const showEmpty = !isFetching && !error && invoices.length === 0;

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Invoices"
        description="Every invoice issued from an order, with its reserved number and current status."
      />

      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="flex flex-col gap-2">
            <span>{error}</span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={refresh}
              className="self-start"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <Card className="gap-0 overflow-hidden py-0">
        <div className="border-border-subtle flex flex-col gap-3 border-b px-4 py-4">
          <InvoicesToolbar
            searchInput={searchInput}
            onSearchChange={setSearchInput}
            statusFilter={statusFilter}
            onStatusChange={setStatusFilter}
            hasActiveFilters={hasActiveFilters}
            onClearFilters={clearFilters}
            disabled={isFetching && invoices.length === 0}
          />
        </div>

        {showSkeleton ? <InvoicesTableSkeleton /> : null}

        {showEmpty ? (
          <EmptyState
            icon={FileText}
            title={hasActiveFilters ? "No matching invoices" : "No invoices yet"}
            description={
              hasActiveFilters
                ? "Try a different search term or clear the status filter."
                : "Open an order and create its invoice to reserve a number and download a PDF."
            }
            className="border-0 bg-transparent"
          >
            {hasActiveFilters ? (
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            ) : null}
          </EmptyState>
        ) : null}

        {!showSkeleton && !showEmpty && !error ? (
          <InvoicesTable invoices={invoices} />
        ) : null}

        {!showSkeleton && !error ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            itemLabel="invoices"
            disabled={isFetching}
          />
        ) : null}
      </Card>
    </div>
  );
}
