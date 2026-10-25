"use client";

import { createColumnHelper } from "@tanstack/react-table";
import { AlertCircle, ReceiptText } from "lucide-react";

import { EmptyState } from "@/components/shared/empty-state";
import { TablePagination } from "@/components/shared/table-pagination";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { DataTable } from "@/components/ui/data-table";
import type { DataTableFeatures } from "@/components/ui/data-table-features";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

import type { CustomerOrderSummary } from "../api/customers-api";
import { useCustomerOrders } from "../hooks/use-customer-orders";
import { formatCurrency, formatDate } from "../utils/customers.utils";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";

const orderColumnHelper = createColumnHelper<
  DataTableFeatures,
  CustomerOrderSummary
>();

const ORDER_COLUMNS = orderColumnHelper.columns([
  orderColumnHelper.display({
    id: "order",
    meta: { className: "font-medium tabular-nums" },
    header: "Order",
    cell: ({ row }) => (
      <>
        {row.original.orderNumber}
        <span className="text-muted-foreground block text-xs font-normal sm:hidden">
          {formatDate(row.original.createdAt)}
        </span>
      </>
    ),
  }),
  orderColumnHelper.display({
    id: "date",
    meta: { className: "hidden text-muted-foreground sm:table-cell" },
    header: "Date",
    cell: ({ row }) => formatDate(row.original.createdAt),
  }),
  orderColumnHelper.display({
    id: "status",
    header: "Status",
    cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
  }),
  orderColumnHelper.display({
    id: "payment",
    header: "Payment",
    cell: ({ row }) => (
      <PaymentStatusBadge status={row.original.paymentStatus} />
    ),
  }),
  orderColumnHelper.display({
    id: "total",
    meta: { className: "text-right font-medium tabular-nums" },
    header: "Total",
    cell: ({ row }) =>
      formatCurrency(row.original.totalAmount, row.original.currency),
  }),
]);

function OrderHistorySkeleton() {
  return (
    <div aria-hidden="true">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Order</TableHead>
            <TableHead className="hidden sm:table-cell">Date</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Payment</TableHead>
            <TableHead className="text-right">Total</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {Array.from({ length: 4 }, (_, index) => (
            <TableRow key={index}>
              <TableCell>
                <Skeleton className="h-4 w-32" />
              </TableCell>
              <TableCell className="hidden sm:table-cell">
                <Skeleton className="h-4 w-24" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-[22px] w-20" />
              </TableCell>
              <TableCell>
                <Skeleton className="h-[22px] w-20" />
              </TableCell>
              <TableCell className="text-right">
                <Skeleton className="ml-auto h-4 w-16" />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

interface CustomerOrderHistoryProps {
  customerId: string;
}

export function CustomerOrderHistory({
  customerId,
}: CustomerOrderHistoryProps) {
  const { view, setPage, refresh } = useCustomerOrders(customerId);
  const orders = view.status === "success" ? view.data.data : [];
  const meta = view.status === "success" ? view.data.meta : null;

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <CardHeader className="border-border-subtle border-b py-5">
        <CardTitle className="text-base">Order history</CardTitle>
        <CardDescription>
          Orders placed by this customer, newest first.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-0">
        {view.status === "error" ? (
          <div className="flex flex-col items-center gap-4 px-6 py-10 text-center">
            <Alert variant="destructive" className="max-w-md text-left">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{view.message}</AlertDescription>
            </Alert>
            <Button type="button" variant="outline" onClick={refresh}>
              Try again
            </Button>
          </div>
        ) : view.status === "loading" ? (
          <OrderHistorySkeleton />
        ) : orders.length === 0 ? (
          <EmptyState
            icon={ReceiptText}
            title="No orders yet"
            description="When this customer places an order, it will show up here."
            className="border-0 bg-transparent py-12"
          />
        ) : (
          <DataTable
            label="Order history"
            columns={ORDER_COLUMNS}
            data={orders}
            getRowId={(order) => order.id}
            footer={
              meta && meta.totalPages > 1 ? (
                <TablePagination
                  meta={meta}
                  onPageChange={setPage}
                  itemLabel="orders"
                />
              ) : null
            }
          />
        )}
      </CardContent>
    </Card>
  );
}
