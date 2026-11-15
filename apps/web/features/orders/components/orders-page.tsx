"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AlertCircle, Plus, ReceiptText } from "lucide-react";
import { useCallback, useState } from "react";

import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

import { ORDER_STATUSES, type OrderSummary } from "../api/orders-api";
import { useOrders, type OrderStatusFilter } from "../hooks/use-orders";
import { useWhatsAppDefaultCountry } from "../whatsapp/hooks/use-whatsapp-default-country";
import { OrderWhatsAppDialog } from "../whatsapp/components/order-whatsapp-dialog";
import { OrderDeleteDialog } from "./order-delete-dialog";
import { OrdersTable } from "./orders-table";
import { OrdersTableSkeleton } from "./orders-table-skeleton";
import { OrdersToolbar } from "./orders-toolbar";

const NOTICE_PARAM = "notice";

export function OrdersPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  // One-shot success notice left in the URL by the editor pages (e.g.
  // after creating or deleting an order); dismissed notices never replay.
  const notice = searchParams.get(NOTICE_PARAM);
  // The dashboard links to status-filtered orders. Only an explicit,
  // supported status is accepted so a hand-edited URL cannot break the list.
  const statusParam = searchParams.get("status");
  const initialStatusFilter =
    statusParam !== null &&
    (ORDER_STATUSES as readonly string[]).includes(statusParam)
      ? (statusParam as OrderStatusFilter)
      : "all";
  const {
    view,
    isFetching,
    searchInput,
    debouncedSearch,
    setSearchInput,
    statusFilter,
    setStatusFilter,
    paymentStatusFilter,
    setPaymentStatusFilter,
    dateFrom,
    setDateFrom,
    dateTo,
    setDateTo,
    sortBy,
    sortOrder,
    setSort,
    setPage,
    setPageSize,
    refresh,
    clearFilters,
  } = useOrders(initialStatusFilter);

  const [deleteTarget, setDeleteTarget] = useState<OrderSummary | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [whatsAppTarget, setWhatsAppTarget] = useState<OrderSummary | null>(
    null,
  );
  const whatsAppDefaultCountry = useWhatsAppDefaultCountry();
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);
  const [dismissedNotice, setDismissedNotice] = useState<string | null>(null);

  const liveNotice =
    notice !== null && notice !== dismissedNotice ? notice : null;
  const feedback = actionFeedback ?? liveNotice;

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

  function handleDeleteSuccess(order: OrderSummary) {
    setDeleteTarget(null);
    setDeleteDialogOpen(false);
    setActionFeedback(`Order ${order.orderNumber} was deleted.`);

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
  const orders = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  const hasActiveFilters =
    debouncedSearch.length > 0 ||
    statusFilter !== "all" ||
    paymentStatusFilter !== "all" ||
    dateFrom !== "" ||
    dateTo !== "";

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Orders"
        description="Track orders from placement to delivery, record payments, and keep customers updated."
        actions={
          <Button
            type="button"
            asChild
            className="w-full sm:w-auto"
          >
            <Link href="/orders/new">
              <Plus aria-hidden="true" />
              Create order
            </Link>
          </Button>
        }
      />

      {feedback ? (
        <SuccessAlert message={feedback} onDismiss={dismissFeedback} />
      ) : null}

      <Card aria-busy={isFetching} className="gap-0 overflow-hidden py-0">
        <OrdersToolbar
          searchInput={searchInput}
          onSearchChange={setSearchInput}
          isInitialLoading={isInitialLoading}
          isFetching={isFetching}
          total={meta ? meta.total : null}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          paymentStatusFilter={paymentStatusFilter}
          onPaymentStatusFilterChange={setPaymentStatusFilter}
          dateFrom={dateFrom}
          onDateFromChange={setDateFrom}
          dateTo={dateTo}
          onDateToChange={setDateTo}
          sortBy={sortBy}
          sortOrder={sortOrder}
          onSortChange={setSort}
          onRefresh={refresh}
          onResetFilters={clearFilters}
          hasActiveFilters={hasActiveFilters}
        />

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
          <OrdersTableSkeleton />
        ) : orders.length === 0 ? (
          hasActiveFilters ? (
            <EmptyState
              icon={ReceiptText}
              title="No orders found"
              description="No orders match the current search and filters. Try adjusting or resetting them."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button type="button" variant="outline" onClick={clearFilters}>
                Clear filters
              </Button>
            </EmptyState>
          ) : (
            <EmptyState
              icon={ReceiptText}
              title="No orders yet"
              description="Create your first order to start tracking sales, payments, and deliveries."
              className="rounded-none border-0 bg-transparent py-16"
            >
              <Button type="button" asChild>
                <Link href="/orders/new">
                  <Plus aria-hidden="true" />
                  Create order
                </Link>
              </Button>
            </EmptyState>
          )
        ) : (
          <OrdersTable
            orders={orders}
            defaultCountry={whatsAppDefaultCountry}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSortChange={setSort}
            onDelete={(order) => {
              setDeleteTarget(order);
              setDeleteDialogOpen(true);
            }}
            onWhatsApp={setWhatsAppTarget}
          />
        )}

        {meta ? (
          <TablePagination
            meta={meta}
            onPageChange={setPage}
            disabled={view.status !== "success"}
            itemLabel="orders"
            pageSizeOptions={[10, 20, 50, 100]}
            onPageSizeChange={setPageSize}
          />
        ) : null}
      </Card>

      <OrderDeleteDialog
        order={deleteTarget}
        open={deleteDialogOpen}
        onOpenChange={(open) => {
          setDeleteDialogOpen(open);
          if (!open) {
            setDeleteTarget(null);
          }
        }}
        onSuccess={handleDeleteSuccess}
      />

      <OrderWhatsAppDialog
        order={whatsAppTarget}
        open={whatsAppTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setWhatsAppTarget(null);
          }
        }}
        defaultCountry={whatsAppDefaultCountry}
      />
    </div>
  );
}
