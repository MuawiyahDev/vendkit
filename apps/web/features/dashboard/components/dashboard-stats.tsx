import type { LucideIcon } from "lucide-react";
import {
  ArrowDownRight,
  ArrowRight,
  ArrowUpRight,
  Boxes,
  Minus,
  ReceiptText,
  ShoppingBag,
  Users,
  Wallet,
} from "lucide-react";
import Link from "next/link";

import { Card } from "@/components/ui/card";
import { cn } from "@/lib/utils";

import type {
  DashboardRegionalSettings,
  DashboardSummary,
} from "../dashboard.types";
import {
  formatCount,
  formatDashboardMoney,
  formatPercentageChange,
} from "../utils/dashboard.utils";

interface DashboardStatsProps {
  summary: DashboardSummary;
  regional: DashboardRegionalSettings;
  previousRangeLabel: string;
}

function ChangeIndicator({
  changePercent,
  previousRangeLabel,
}: {
  changePercent: number | null;
  previousRangeLabel: string;
}) {
  if (changePercent === null) {
    return (
      <span
        className="text-muted-foreground text-xs"
        title="The previous period has no data to compare against."
      >
        No comparison
      </span>
    );
  }

  const isPositive = changePercent > 0;
  const isNegative = changePercent < 0;
  const Icon = isPositive ? ArrowUpRight : isNegative ? ArrowDownRight : Minus;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 text-xs font-medium tabular-nums",
        isPositive && "text-success-soft-foreground",
        isNegative && "text-destructive-soft-foreground",
        !isPositive && !isNegative && "text-muted-foreground",
      )}
      title={`Compared with ${previousRangeLabel}`}
    >
      <Icon className="size-3.5" aria-hidden="true" />
      {formatPercentageChange(changePercent)}
      <span className="text-muted-foreground font-normal">vs previous</span>
    </span>
  );
}

function StatCard({
  label,
  icon: Icon,
  className,
  iconTone,
  children,
  footer,
}: {
  label: string;
  icon: LucideIcon;
  className?: string;
  iconTone?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <Card className={cn("h-full gap-0 py-0 shadow-xs", className)}>
      <div className="flex h-full flex-col gap-3 p-5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-muted-foreground text-[0.8125rem] font-medium">
            {label}
          </p>
          <span
            className={cn(
              "bg-surface-muted text-muted-foreground flex size-8 shrink-0 items-center justify-center rounded-lg",
              iconTone,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-3">
          <div>{children}</div>
          {footer ? <div>{footer}</div> : null}
        </div>
      </div>
    </Card>
  );
}

function InventoryRow({
  label,
  value,
  dotClassName,
}: {
  label: string;
  value: number;
  dotClassName: string;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-muted-foreground flex min-w-0 items-center gap-2 text-xs">
        <span
          aria-hidden="true"
          className={cn("size-1.5 shrink-0 rounded-full", dotClassName)}
        />
        <span className="truncate">{label}</span>
      </span>
      <span className="text-sm font-medium tabular-nums">
        {formatCount(value)}
      </span>
    </div>
  );
}

export function DashboardStats({
  summary,
  regional,
  previousRangeLabel,
}: DashboardStatsProps) {
  const inventory = summary.inventory;
  const newCustomers = summary.customers.newInPeriod;

  return (
    <section aria-label="Business statistics">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard
          label="Revenue"
          icon={Wallet}
          className="sm:col-span-2"
          iconTone="bg-primary-soft text-primary-soft-foreground"
          footer={
            <ChangeIndicator
              changePercent={summary.revenue.changePercent}
              previousRangeLabel={previousRangeLabel}
            />
          }
        >
          <p className="text-3xl leading-none font-semibold tracking-tight tabular-nums">
            {formatDashboardMoney(summary.revenue.current, regional)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs">
            Non-cancelled orders in the selected period
          </p>
        </StatCard>

        <StatCard
          label="Orders"
          icon={ReceiptText}
          footer={
            <ChangeIndicator
              changePercent={summary.orders.changePercent}
              previousRangeLabel={previousRangeLabel}
            />
          }
        >
          <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {formatCount(summary.orders.current)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs">
            Orders received, including cancellations
          </p>
        </StatCard>

        <StatCard
          label="Average order value"
          icon={ShoppingBag}
          footer={
            <ChangeIndicator
              changePercent={summary.averageOrderValue.changePercent}
              previousRangeLabel={previousRangeLabel}
            />
          }
        >
          <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {formatDashboardMoney(summary.averageOrderValue.current, regional)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs">
            Revenue per non-cancelled order
          </p>
        </StatCard>

        <StatCard
          label="Customers"
          icon={Users}
          footer={
            <p className="text-xs">
              <span
                className={cn(
                  "font-medium",
                  newCustomers > 0
                    ? "text-success-soft-foreground"
                    : "text-muted-foreground",
                )}
              >
                {newCustomers > 0 ? `+${formatCount(newCustomers)}` : "0"}
              </span>{" "}
              <span className="text-muted-foreground">new in this period</span>
            </p>
          }
        >
          <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums">
            {formatCount(summary.customers.total)}
          </p>
          <p className="text-muted-foreground mt-1.5 text-xs">
            Total saved customers
          </p>
        </StatCard>

        <StatCard
          label="Inventory"
          icon={Boxes}
          footer={
            <Link
              href="/products"
              className="text-primary hover:text-primary-hover focus-visible:ring-ring/40 inline-flex items-center gap-1 rounded-sm text-xs font-medium outline-none focus-visible:ring-[3px]"
            >
              Manage inventory
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </Link>
          }
        >
          <div className="flex flex-col gap-2">
            <InventoryRow
              label="Active products"
              value={inventory.totalProducts}
              dotClassName="bg-muted-foreground/50"
            />
            <InventoryRow
              label="Low stock"
              value={inventory.lowStock}
              dotClassName="bg-warning"
            />
            <InventoryRow
              label="Out of stock"
              value={inventory.outOfStock}
              dotClassName="bg-destructive"
            />
          </div>
        </StatCard>
      </div>
    </section>
  );
}
