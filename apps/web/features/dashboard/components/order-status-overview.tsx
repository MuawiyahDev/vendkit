import { ReceiptText } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { formatStatusLabel } from "@/features/orders/utils/orders.utils";
import type { OrderStatus } from "@/features/orders/api/orders-api";
import { cn } from "@/lib/utils";

import type { DashboardStatusCount } from "../dashboard.types";
import { clampPercentage, formatCount } from "../utils/dashboard.utils";
import { DashboardSectionHeader } from "./dashboard-section-header";

const STATUS_STYLES: Record<OrderStatus, { dot: string; bar: string }> = {
  PENDING: { dot: "bg-warning", bar: "bg-warning/80" },
  CONFIRMED: { dot: "bg-info", bar: "bg-info/80" },
  PROCESSING: { dot: "bg-info", bar: "bg-info/80" },
  SHIPPED: { dot: "bg-info", bar: "bg-info/80" },
  DELIVERED: { dot: "bg-success", bar: "bg-success/80" },
  CANCELLED: { dot: "bg-destructive", bar: "bg-destructive/80" },
};

interface OrderStatusOverviewProps {
  statusCounts: DashboardStatusCount[];
  totalOrders: number;
}

export function OrderStatusOverview({
  statusCounts,
  totalOrders,
}: OrderStatusOverviewProps) {
  return (
    <Card className="h-full gap-0 py-0">
      <div className="p-5 pb-4">
        <DashboardSectionHeader
          title="Order status"
          description="Orders placed in the selected period"
          action={
            <Badge variant="secondary" className="tabular-nums">
              {formatCount(totalOrders)} orders
            </Badge>
          }
        />
      </div>

      {totalOrders === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 pb-6 text-center">
          <span className="bg-surface-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
            <ReceiptText className="size-4" aria-hidden="true" />
          </span>
          <div className="flex max-w-xs flex-col gap-1">
            <p className="text-sm font-medium">No orders in this period</p>
            <p className="text-muted-foreground text-xs leading-relaxed">
              Order statuses will be summarized here once orders start coming
              in.
            </p>
          </div>
          <Button type="button" variant="outline" size="sm" asChild>
            <Link href="/orders/new">Create order</Link>
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-1 px-3 pb-4">
          {statusCounts.map(({ status, count }) => {
            const percentage = (count / totalOrders) * 100;
            const styles = STATUS_STYLES[status];

            return (
              <Link
                key={status}
                href={`/orders?status=${status}`}
                aria-label={`${formatStatusLabel(status)}: ${formatCount(count)} orders. View filtered orders.`}
                className="hover:bg-surface-hover focus-visible:ring-ring/40 group flex flex-col gap-1.5 rounded-md px-2 py-2 outline-none transition-colors focus-visible:ring-[3px]"
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex min-w-0 items-center gap-2 text-sm">
                    <span
                      aria-hidden="true"
                      className={cn(
                        "size-1.5 shrink-0 rounded-full",
                        styles.dot,
                      )}
                    />
                    <span className="truncate">
                      {formatStatusLabel(status)}
                    </span>
                  </span>
                  <span className="text-sm font-medium tabular-nums">
                    {formatCount(count)}
                  </span>
                </div>
                <span
                  aria-hidden="true"
                  className="bg-surface-muted h-1.5 w-full overflow-hidden rounded-full"
                >
                  <span
                    className={cn("block h-full rounded-full", styles.bar)}
                    style={{ width: `${clampPercentage(percentage)}%` }}
                  />
                </span>
              </Link>
            );
          })}

          <Button
            type="button"
            variant="ghost"
            size="sm"
            asChild
            className="text-muted-foreground hover:text-foreground mt-1 justify-start"
          >
            <Link href="/orders">View all orders</Link>
          </Button>
        </div>
      )}
    </Card>
  );
}
