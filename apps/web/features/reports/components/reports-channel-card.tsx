import { Globe2 } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";
import { formatOrderSource } from "@/features/orders/utils/orders.utils";

import type { ReportsResponse } from "../api/reports-api";
import { ORDER_SOURCE_ICONS } from "../reports.constants";
import { formatShare } from "../reports.utils";
import { ReportCard, ReportEmptyState } from "./report-card";

interface ReportsChannelCardProps {
  report: ReportsResponse;
}

export function ReportsChannelCard({ report }: ReportsChannelCardProps) {
  const { regional } = report;
  const sources = report.sources.filter((entry) => entry.count > 0);
  const total = sources.reduce((sum, entry) => sum + entry.count, 0);
  const maxCount = Math.max(...sources.map((entry) => entry.count), 1);

  return (
    <ReportCard
      title="Sales by channel"
      description="Which channels are bringing in orders."
      action={
        <Badge variant="secondary">
          {sources.length} channel{sources.length === 1 ? "" : "s"}
        </Badge>
      }
    >
      {sources.length === 0 ? (
        <ReportEmptyState
          icon={Globe2}
          title="No channel data yet"
          description="Every order records where it came from, so this fills in as sales arrive."
        />
      ) : (
        <ul className="divide-border-subtle flex flex-col divide-y">
          {sources.map((entry) => {
            const Icon = ORDER_SOURCE_ICONS[entry.source];

            return (
              <li
                key={entry.source}
                className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
              >
                <span className="bg-surface-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
                  <Icon className="size-4" aria-hidden="true" />
                </span>

                <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="truncate text-sm font-medium">
                      {formatOrderSource(entry.source)}
                    </span>
                    <span className="text-muted-foreground shrink-0 text-xs tabular-nums">
                      {formatCount(entry.count)} orders ·{" "}
                      {formatShare(entry.count, total)}
                    </span>
                  </div>
                  <div className="bg-surface-muted h-1.5 overflow-hidden rounded-full">
                    <div
                      className="bg-primary h-full rounded-full"
                      style={{
                        width: `${(entry.count / maxCount) * 100}%`,
                      }}
                    />
                  </div>
                </div>

                <span className="text-muted-foreground w-20 shrink-0 text-right text-xs whitespace-nowrap tabular-nums sm:w-24">
                  {formatDashboardMoney(entry.revenue, regional)}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ReportCard>
  );
}
