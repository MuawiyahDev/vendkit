import { Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";
import { cn } from "@/lib/utils";

import type { ReportsResponse } from "../api/reports-api";
import { getInitials } from "../reports.utils";
import { ReportCard, ReportEmptyState } from "./report-card";

interface ReportsTopCustomersCardProps {
  report: ReportsResponse;
}

export function ReportsTopCustomersCard({
  report,
}: ReportsTopCustomersCardProps) {
  const { regional } = report;

  return (
    <ReportCard
      title="Top customers"
      description="Highest spend in this period."
      action={
        report.topCustomers.length > 0 ? (
          <Badge variant="secondary">
            {report.topCustomers.length} customer
            {report.topCustomers.length === 1 ? "" : "s"}
          </Badge>
        ) : null
      }
    >
      {report.topCustomers.length === 0 ? (
        <ReportEmptyState
          icon={Users}
          title="No customer sales"
          description="Customers appear here after they place an order in this period."
        />
      ) : (
        <ul className="divide-border-subtle flex flex-col divide-y">
          {report.topCustomers.map((customer, index) => (
            <li
              key={customer.customerId}
              className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span
                className={cn(
                  "flex size-9 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  index === 0
                    ? "bg-warning-soft text-warning-soft-foreground"
                    : "bg-primary-soft text-primary-soft-foreground",
                )}
                aria-hidden="true"
              >
                {getInitials(customer.name)}
              </span>

              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <span className="truncate text-sm font-medium">
                  {customer.name}
                </span>
                <span className="text-muted-foreground truncate text-xs">
                  {customer.phone}
                </span>
              </div>

              <div className="flex shrink-0 flex-col items-end gap-0.5">
                <span className="text-sm font-medium tabular-nums">
                  {formatDashboardMoney(customer.revenue, regional)}
                </span>
                <span className="text-muted-foreground text-xs tabular-nums">
                  {formatCount(customer.ordersCount)} order
                  {customer.ordersCount === 1 ? "" : "s"}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </ReportCard>
  );
}
