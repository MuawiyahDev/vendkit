import { Package } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";

import type { ReportsResponse } from "../api/reports-api";
import { toNumber } from "../reports.utils";
import { ReportCard, ReportEmptyState } from "./report-card";

interface ReportsTopProductsCardProps {
  report: ReportsResponse;
}

export function ReportsTopProductsCard({
  report,
}: ReportsTopProductsCardProps) {
  const { regional } = report;
  const maxRevenue = Math.max(
    ...report.topProducts.map((product) => toNumber(product.revenue)),
    1,
  );

  return (
    <ReportCard
      title="Top products"
      description="Best sellers by units sold in this period."
      action={
        report.topProducts.length > 0 ? (
          <Badge variant="secondary">
            {report.topProducts.length} product
            {report.topProducts.length === 1 ? "" : "s"}
          </Badge>
        ) : null
      }
    >
      {report.topProducts.length === 0 ? (
        <ReportEmptyState
          icon={Package}
          title="No product sales"
          description="Product performance appears once orders in this period include items."
        />
      ) : (
        <ul className="divide-border-subtle flex flex-col divide-y">
          {report.topProducts.map((product, index) => (
            <li
              key={product.productId}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="bg-surface-muted text-muted-foreground mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-md text-[0.6875rem] font-semibold tabular-nums">
                {index + 1}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                <div className="flex items-baseline justify-between gap-3">
                  <span className="truncate text-sm font-medium">
                    {product.name}
                  </span>
                  <span className="shrink-0 text-sm font-medium tabular-nums">
                    {formatDashboardMoney(product.revenue, regional)}
                  </span>
                </div>

                <div className="text-muted-foreground flex items-center justify-between gap-3 text-xs">
                  <span className="truncate">{product.sku ?? "No SKU"}</span>
                  <span className="shrink-0 tabular-nums">
                    {formatCount(product.unitsSold)} sold
                  </span>
                </div>

                <div className="bg-surface-muted h-1 overflow-hidden rounded-full">
                  <div
                    className="bg-primary/70 h-full rounded-full"
                    style={{
                      width: `${(toNumber(product.revenue) / maxRevenue) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
