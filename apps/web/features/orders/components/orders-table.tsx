import Link from "next/link";
import { MapPin, Phone } from "lucide-react";

import { createColumnHelper, type SortingState } from "@tanstack/react-table";

import { DataTable } from "@/components/ui/data-table";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";
import type { DataTableFeatures } from "@/components/ui/data-table-features";

import type {
  OrderSortField,
  OrderSummary,
  SortOrder,
} from "../api/orders-api";
import {
  formatCurrency,
  formatDate,
  formatItemCount,
  formatOptionalValue,
  orderCustomerName,
  orderCustomerPhone,
} from "../utils/orders.utils";
import { OrderRowActions } from "./order-row-actions";
import { OrderStatusBadge, PaymentStatusBadge } from "./order-status-badge";

const columnHelper = createColumnHelper<DataTableFeatures, OrderSummary>();

interface OrdersTableProps {
  orders: OrderSummary[];
  sortBy: OrderSortField;
  sortOrder: SortOrder;
  onSortChange: (sort: {
    sortBy: OrderSortField;
    sortOrder: SortOrder;
  }) => void;
  onDelete: (order: OrderSummary) => void;
}

export function OrdersTable({
  orders,
  sortBy,
  sortOrder,
  onSortChange,
  onDelete,
}: OrdersTableProps) {
  const columns = columnHelper.columns([
    columnHelper.accessor("orderNumber", {
      meta: { className: "min-w-[240px]" },
      sortDescFirst: false,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Order" />
      ),
      cell: ({ row }) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`/orders/${row.original.id}`}
            title={row.original.orderNumber}
            className="text-foreground hover:text-primary focus-visible:ring-ring/40 w-fit max-w-[220px] truncate rounded-sm text-sm font-medium tabular-nums transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
          >
            {row.original.orderNumber}
          </Link>
          <span
            title={orderCustomerName(row.original)}
            className="text-muted-foreground max-w-[220px] truncate text-xs"
          >
            {orderCustomerName(row.original)}
            <span className="sm:hidden">
              {" · "}
              {formatDate(row.original.createdAt)}
            </span>
          </span>
        </div>
      ),
    }),
    columnHelper.accessor("customer", {
      enableSorting: false,
      meta: { className: "hidden md:table-cell" },
      header: "Customer",
      cell: ({ row }) => (
        <div className="flex max-w-[220px] flex-col gap-0.5">
          <Link
            href={row.original.customer ? `/customers/${row.original.customer.id}` : "#"}
            title={orderCustomerName(row.original)}
            className="text-foreground hover:text-primary focus-visible:ring-ring/40 w-fit max-w-full truncate rounded-sm text-sm transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
          >
            {orderCustomerName(row.original)}
          </Link>
          <a
            href={orderCustomerPhone(row.original) ? `tel:${orderCustomerPhone(row.original)}` : "#"}
            className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 w-fit rounded-sm text-xs whitespace-nowrap tabular-nums transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
          >
            {orderCustomerPhone(row.original) ?? "—"}
          </a>
        </div>
      ),
    }),
    columnHelper.accessor("createdAt", {
      meta: { className: "hidden sm:table-cell" },
      sortDescFirst: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Date" />
      ),
      cell: ({ row }) => (
        <span className="text-muted-foreground text-sm whitespace-nowrap tabular-nums">
          {formatDate(row.original.createdAt)}
        </span>
      ),
    }),
    columnHelper.accessor("status", {
      enableSorting: false,
      header: "Status",
      cell: ({ row }) => <OrderStatusBadge status={row.original.status} />,
    }),
    columnHelper.accessor("paymentStatus", {
      enableSorting: false,
      meta: { className: "hidden sm:table-cell" },
      header: "Payment",
      cell: ({ row }) => (
        <PaymentStatusBadge status={row.original.paymentStatus} />
      ),
    }),
    columnHelper.accessor("totalAmount", {
      meta: { className: "text-right font-medium tabular-nums" },
      sortDescFirst: true,
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Total" />
      ),
      cell: ({ row }) =>
        formatCurrency(row.original.totalAmount, row.original.currency),
    }),
    columnHelper.display({
      id: "actions",
      meta: { className: "w-[64px] text-right" },
      header: () => <span className="sr-only">Actions</span>,
      cell: ({ row }) => <OrderRowActions order={row.original} onDelete={onDelete} />,
    }),
  ]);

  const sorting: SortingState = [{ id: sortBy, desc: sortOrder === "desc" }];

  return (
    <>
      <div className="hidden md:block">
        <DataTable
          label="Orders"
          columns={columns}
          data={orders}
          getRowId={(order) => order.id}
          sorting={sorting}
          onSortingChange={(next) => {
            const active = next[0];
            if (
              active &&
              (active.id === "orderNumber" ||
                active.id === "createdAt" ||
                active.id === "totalAmount")
            ) {
              onSortChange({
                sortBy: active.id,
                sortOrder: active.desc ? "desc" : "asc",
              });
            }
          }}
        />
      </div>

      <OrdersMobileList orders={orders} onDelete={onDelete} />
    </>
  );
}

function OrdersMobileList({
  orders,
  onDelete,
}: {
  orders: OrderSummary[];
  onDelete: (order: OrderSummary) => void;
}) {
  return (
    <ul aria-label="Orders" className="divide-border-subtle divide-y md:hidden">
      {orders.map((order) => (
        <li
          key={order.id}
          className="group hover:bg-surface-hover/50 flex items-start gap-3 px-4 py-4 transition-colors focus-within:bg-surface-hover/50 active:bg-surface-active/60 motion-reduce:transition-none"
        >
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            <div className="flex items-start justify-between gap-2">
              <Link
                href={`/orders/${order.id}`}
                title={order.orderNumber}
                className="text-foreground hover:text-primary focus-visible:ring-ring/40 max-w-[190px] truncate rounded-sm text-sm font-semibold tabular-nums transition-colors hover:underline hover:underline-offset-4 focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                {order.orderNumber}
              </Link>
              <OrderRowActions order={order} onDelete={onDelete} />
            </div>

            <Link
              href={order.customer ? `/customers/${order.customer.id}` : "#"}
              className="text-muted-foreground hover:text-foreground w-fit max-w-[220px] truncate rounded-sm text-xs transition-colors hover:underline hover:underline-offset-4"
            >
              {orderCustomerName(order)}
            </Link>

            <div className="text-muted-foreground flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
              <a
                href={(order.customer ? order.customer.phone : orderCustomerPhone(order)) ? `tel:${order.customer ? order.customer.phone : orderCustomerPhone(order)}` : undefined}
                className="hover:text-foreground focus-visible:ring-ring/40 flex items-center gap-1.5 rounded-sm whitespace-nowrap tabular-nums transition-colors focus-visible:ring-[3px] focus-visible:outline-hidden"
              >
                <Phone className="size-3" aria-hidden="true" />
                {orderCustomerPhone(order) ?? "—"}
              </a>
              {order.shippingCity ? (
                <span
                  className="flex items-center gap-1.5 truncate"
                  title={formatOptionalValue(order.shippingCity)}
                >
                  <MapPin className="size-3 shrink-0" aria-hidden="true" />
                  {order.shippingCity}
                </span>
              ) : null}
            </div>

            <div className="mt-1 flex flex-wrap items-center gap-2">
              <OrderStatusBadge status={order.status} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>

            <div className="text-muted-foreground flex items-center justify-between gap-2 text-xs">
              <span>
                {formatDate(order.createdAt)} · {formatItemCount(order.items.length)}
              </span>
              <span className="text-foreground text-sm font-semibold tabular-nums">
                {formatCurrency(order.totalAmount, order.currency)}
              </span>
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
