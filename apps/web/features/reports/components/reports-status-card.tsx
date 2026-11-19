import { ShoppingBag } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";
import { formatStatusLabel } from "@/features/orders/utils/orders.utils";
import { cn } from "@/lib/utils";

import type { ReportsResponse } from "../api/reports-api";
import { ORDER_STATUS_TONES } from "../reports.constants";
import { formatShare } from "../reports.utils";
import { ReportCard, ReportEmptyState } from "./report-card";

interface ReportsStatusCardProps {
  report: ReportsResponse;
}

export function ReportsStatusCard({ report }: ReportsStatusCardProps) {
  const { regional } = report;
  const statuses = report.statuses.filter((entry) => entry.count > 0);
  const total = statuses.reduce((sum, entry) => sum + entry.count, 0);

  return (
    <ReportCard
      title="Order status"
      description="How the orders in this period are progressing."
      action={
        <Badge variant="secondary">
          {formatCount(report.totals.orders)} total
        </Badge>
      }
    >
      {statuses.length === 0 ? (
        <ReportEmptyState
          icon={ShoppingBag}
          title="No orders in this period"
          description="Orders will appear here as soon as they are created."
        />
      ) : (
        <>
          <div
            className="bg-surface-muted flex h-2.5 w-full overflow-hidden rounded-full"
            role="img"
            aria-label="Order status distribution"
          >
            {statuses.map((entry) => {
              const tone = ORDER_STATUS_TONES[entry.status];

              return (
                <div
                  key={entry.status}
                  className={cn("h-full", tone.bar)}
                  style={{ width: `${(entry.count / total) * 100}%` }}
                  title={`${formatStatusLabel(entry.status)}: ${formatCount(entry.count)}`}
                />
              );
            })}
          </div>

          <div className="mt-4">
            <div className="text-muted-foreground flex items-center gap-3 pb-2 text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
              <span className="size-2" />
              <span className="flex-1">Status</span>
              <span className="w-12 text-right">Orders</span>
              <span className="w-20 text-right sm:w-24">Revenue</span>
              <span className="w-9 text-right">Share</span>
            </div>

            <ul className="flex flex-col">
              {statuses.map((entry) => {
                const tone = ORDER_STATUS_TONES[entry.status];

                return (
                  <li
                    key={entry.status}
                    className="border-border-subtle flex items-center gap-3 border-b py-2.5 last:border-b-0 last:pb-0"
                  >
                    <span
                      className={cn("size-2 shrink-0 rounded-full", tone.dot)}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 truncate text-sm">
                      {formatStatusLabel(entry.status)}
                    </span>
                    <span className="text-muted-foreground w-12 text-right text-xs tabular-nums">
                      {formatCount(entry.count)}
                    </span>
                    <span className="w-20 text-right text-sm tabular-nums sm:w-24">
                      {formatDashboardMoney(entry.revenue, regional)}
                    </span>
                    <span className="text-muted-foreground w-9 text-right text-xs tabular-nums">
                      {formatShare(entry.count, total)}
                    </span>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </ReportCard>
  );
}
