import { ChevronRight, ReceiptText } from "lucide-react";
import Link from "next/link";

import { EmptyState } from "@/components/shared/empty-state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  OrderStatusBadge,
  PaymentStatusBadge,
} from "@/features/orders/components/order-status-badge";
import { formatCurrency } from "@/features/orders/utils/orders.utils";

import type {
  DashboardRecentOrder,
  DashboardRegionalSettings,
} from "../dashboard.types";
import { formatDashboardDateTime } from "../utils/dashboard.utils";
import { DashboardSectionHeader } from "./dashboard-section-header";

interface RecentOrdersProps {
  orders: DashboardRecentOrder[];
  regional: DashboardRegionalSettings;
  rangeLabel: string;
}

export function RecentOrders({
  orders,
  regional,
  rangeLabel,
}: RecentOrdersProps) {
  return (
    <Card className="h-full gap-0 overflow-hidden py-0">
      <div className="p-5 pb-4">
        <DashboardSectionHeader
          title="Recent orders"
          description={`Latest orders in ${rangeLabel}`}
          action={
            <Button type="button" variant="outline" size="sm" asChild>
              <Link href="/orders">
                View all orders
                <ChevronRight aria-hidden="true" />
              </Link>
            </Button>
          }
        />
      </div>

      {orders.length === 0 ? (
        <EmptyState
          icon={ReceiptText}
          title="No recent orders"
          description="Orders created in the selected period will appear here."
          className="rounded-none border-0 bg-transparent py-12"
        >
          <Button type="button" asChild>
            <Link href="/orders/new">Create order</Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <div className="hidden md:block">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Customer</TableHead>
                  <TableHead className="hidden lg:table-cell">Date</TableHead>
                  <TableHead className="text-right">Total</TableHead>
                  <TableHead>Payment</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-12 text-right">
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-foreground hover:text-primary focus-visible:ring-ring/40 rounded-sm font-medium outline-none focus-visible:ring-[3px]"
                      >
                        {order.orderNumber}
                      </Link>
                    </TableCell>
                    <TableCell className="max-w-44">
                      <span className="block truncate">
                        {order.customerName ?? "Walk-in customer"}
                      </span>
                    </TableCell>
                    <TableCell className="text-muted-foreground hidden text-xs lg:table-cell">
                      {formatDashboardDateTime(order.createdAt, regional)}
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </TableCell>
                    <TableCell>
                      <PaymentStatusBadge status={order.paymentStatus} />
                    </TableCell>
                    <TableCell>
                      <OrderStatusBadge status={order.status} />
                    </TableCell>
                    <TableCell className="text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        aria-label={`View order ${order.orderNumber}`}
                        className="text-muted-foreground hover:text-foreground focus-visible:ring-ring/40 inline-flex size-7 items-center justify-center rounded-md outline-none transition-colors focus-visible:ring-[3px]"
                      >
                        <ChevronRight className="size-4" aria-hidden="true" />
                      </Link>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <ul className="divide-border-subtle border-border-subtle divide-y border-t md:hidden">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  href={`/orders/${order.id}`}
                  className="hover:bg-surface-hover focus-visible:ring-ring/40 flex flex-col gap-2 px-4 py-3.5 outline-none transition-colors focus-visible:ring-[3px] focus-visible:ring-inset"
                >
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-sm font-medium">
                      {order.orderNumber}
                    </span>
                    <span className="text-sm font-medium tabular-nums">
                      {formatCurrency(order.totalAmount, order.currency)}
                    </span>
                  </div>
                  <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                    <span className="truncate">
                      {order.customerName ?? "Walk-in customer"}
                    </span>
                    <span className="shrink-0">
                      {formatDashboardDateTime(order.createdAt, regional)}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <PaymentStatusBadge status={order.paymentStatus} />
                    <OrderStatusBadge status={order.status} />
                    <ChevronRight
                      className="text-muted-foreground ml-auto size-4"
                      aria-hidden="true"
                    />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
