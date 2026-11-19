import type { LucideIcon } from "lucide-react";
import {
  CircleDollarSign,
  ReceiptText,
  ShoppingBag,
  Wallet,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import {
  clampPercentage,
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";
import { cn } from "@/lib/utils";

import type { ReportsResponse } from "../api/reports-api";
import { toNumber } from "../reports.utils";

interface SummaryCardProps {
  label: string;
  value: string;
  icon: LucideIcon;
  tone: string;
  children: React.ReactNode;
}

function SummaryCard({
  label,
  value,
  icon: Icon,
  tone,
  children,
}: SummaryCardProps) {
  return (
    <Card className="h-full gap-0 py-0 shadow-xs">
      <div className="flex h-full flex-col gap-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <p className="text-muted-foreground text-[0.8125rem] font-medium">
            {label}
          </p>
          <span
            className={cn(
              "flex size-8 shrink-0 items-center justify-center rounded-lg",
              tone,
            )}
          >
            <Icon className="size-4" aria-hidden="true" />
          </span>
        </div>

        <div className="flex flex-1 flex-col justify-end gap-2">
          <p className="text-2xl leading-none font-semibold tracking-tight tabular-nums sm:text-[1.75rem]">
            {value}
          </p>
          <div className="min-h-[1.625rem]">{children}</div>
        </div>
      </div>
    </Card>
  );
}

interface ReportsSummaryProps {
  report: ReportsResponse;
}

/** Four headline metrics, with just enough context to read them honestly. */
export function ReportsSummary({ report }: ReportsSummaryProps) {
  const { totals, regional } = report;
  const collectionRate = clampPercentage(
    toNumber(totals.revenue) > 0
      ? (toNumber(totals.paidAmount) / toNumber(totals.revenue)) * 100
      : 0,
  );
  const fullyCollected =
    toNumber(totals.revenue) > 0 && toNumber(totals.outstandingAmount) <= 0;
  const hasCancellations = totals.cancelledOrders > 0;
  const nothingOutstanding = toNumber(totals.outstandingAmount) <= 0;

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <SummaryCard
        label="Revenue"
        value={formatDashboardMoney(totals.revenue, regional)}
        icon={Wallet}
        tone="bg-primary-soft text-primary-soft-foreground"
      >
        <div className="flex flex-col gap-1.5">
          <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
            <span>
              {formatCount(totals.salesOrders)} sale
              {totals.salesOrders === 1 ? "" : "s"}
            </span>
            <span className="text-foreground font-medium tabular-nums">
              {Math.round(collectionRate)}% collected
            </span>
          </div>
          <div className="bg-surface-muted h-1.5 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full rounded-full transition-[width]"
              style={{ width: `${collectionRate}%` }}
            />
          </div>
        </div>
      </SummaryCard>

      <SummaryCard
        label="Orders"
        value={formatCount(totals.orders)}
        icon={ShoppingBag}
        tone="bg-info-soft text-info-soft-foreground"
      >
        <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
          <span>
            {formatCount(totals.newCustomers)} new customer
            {totals.newCustomers === 1 ? "" : "s"}
          </span>
          <span
            className={cn(
              "tabular-nums",
              hasCancellations
                ? "text-destructive-soft-foreground font-medium"
                : undefined,
            )}
          >
            {hasCancellations
              ? `${formatCount(totals.cancelledOrders)} cancelled`
              : "No cancellations"}
          </span>
        </div>
      </SummaryCard>

      <SummaryCard
        label="Average order"
        value={formatDashboardMoney(totals.averageOrderValue, regional)}
        icon={ReceiptText}
        tone="bg-success-soft text-success-soft-foreground"
      >
        <p className="text-muted-foreground text-xs">Per sales order</p>
      </SummaryCard>

      <SummaryCard
        label="Outstanding"
        value={formatDashboardMoney(totals.outstandingAmount, regional)}
        icon={CircleDollarSign}
        tone={
          nothingOutstanding
            ? "bg-success-soft text-success-soft-foreground"
            : "bg-warning-soft text-warning-soft-foreground"
        }
      >
        <p className="text-muted-foreground text-xs">
          {nothingOutstanding ? (
            fullyCollected ? (
              "Everything is collected"
            ) : (
              "No sales in this period"
            )
          ) : (
            <>
              <span className="text-foreground font-medium tabular-nums">
                {formatDashboardMoney(totals.paidAmount, regional)}
              </span>{" "}
              collected so far
            </>
          )}
        </p>
      </SummaryCard>
    </div>
  );
}

