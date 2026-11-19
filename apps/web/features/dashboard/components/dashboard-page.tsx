"use client";

import { AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useDashboard } from "../hooks/use-dashboard";
import { DASHBOARD_PRESET_LABELS } from "../dashboard.constants";
import type { DashboardRange } from "../dashboard.types";
import { formatRangeLabel } from "../utils/dashboard.utils";
import { BestSellingProducts } from "./best-selling-products";
import { DashboardHeader } from "./dashboard-header";
import { DashboardSkeleton } from "./dashboard-skeleton";
import { DashboardStats } from "./dashboard-stats";
import { InventoryAlerts } from "./inventory-alerts";
import { OrderStatusOverview } from "./order-status-overview";
import { QuickActions } from "./quick-actions";
import { RecentOrders } from "./recent-orders";
import { RevenueChart } from "./revenue-chart";
import { SetupChecklist } from "./setup-checklist";

function toRangeLabel(range: DashboardRange, dateFormat: string): string {
  if (range.preset === "custom") {
    return formatRangeLabel(range.from, range.to, dateFormat);
  }

  return DASHBOARD_PRESET_LABELS[range.preset];
}

export function DashboardPage() {
  const {
    selection,
    data,
    error,
    isLoading,
    isFetching,
    selectRange,
    refresh,
    retry,
  } = useDashboard();

  const headerRangeLabel =
    data !== null
      ? toRangeLabel(data.range, data.regional.dateFormat)
      : selection.preset === "custom"
        ? formatRangeLabel(selection.from, selection.to, "DD/MM/YYYY")
        : DASHBOARD_PRESET_LABELS[selection.preset];

  return (
    <div className="flex flex-col gap-6">
      <DashboardHeader
        selection={selection}
        rangeLabel={headerRangeLabel}
        regional={data?.regional ?? null}
        isFetching={isFetching}
        onSelectRange={selectRange}
        onRefresh={refresh}
      />

      {error && data ? (
        <div
          role="alert"
          className="border-destructive/20 bg-destructive-soft/30 flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <p className="text-destructive-soft-foreground flex items-start gap-2 text-sm">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            <span>{error} Showing the last loaded results.</span>
          </p>
          <Button type="button" variant="outline" size="sm" onClick={retry}>
            Try again
          </Button>
        </div>
      ) : null}

      {isLoading && data === null ? <DashboardSkeleton /> : null}

      {!isLoading && data === null && error ? (
        <Card className="items-start gap-4 p-6">
          <div className="flex items-start gap-3">
            <span className="bg-destructive-soft text-destructive-soft-foreground flex size-10 shrink-0 items-center justify-center rounded-lg">
              <AlertCircle className="size-5" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-1">
              <h2 className="text-base font-semibold">Dashboard unavailable</h2>
              <p className="text-muted-foreground text-sm">{error}</p>
            </div>
          </div>
          <Button type="button" variant="outline" onClick={retry}>
            Try again
          </Button>
        </Card>
      ) : null}

      {data ? (
        <div className="flex flex-col gap-6" aria-busy={isFetching}>
          <DashboardStats
            summary={data.summary}
            regional={data.regional}
            previousRangeLabel={formatRangeLabel(
              data.range.previousFrom,
              data.range.previousTo,
              data.regional.dateFormat,
            )}
          />

          <SetupChecklist setup={data.setup} />

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <RevenueChart
                series={data.series}
                granularity={data.range.granularity}
                regional={data.regional}
                rangeLabel={toRangeLabel(data.range, data.regional.dateFormat)}
              />
            </div>
            <div className="min-w-0">
              <OrderStatusOverview
                statusCounts={data.statusCounts}
                totalOrders={data.summary.orders.current}
              />
            </div>
          </div>

          <div className="grid gap-6 xl:grid-cols-3">
            <div className="min-w-0 xl:col-span-2">
              <RecentOrders
                orders={data.recentOrders}
                regional={data.regional}
                rangeLabel={toRangeLabel(data.range, data.regional.dateFormat)}
              />
            </div>
            <div className="min-w-0">
              <QuickActions />
            </div>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="min-w-0">
              <BestSellingProducts
                products={data.bestSellingProducts}
                regional={data.regional}
                rangeLabel={toRangeLabel(data.range, data.regional.dateFormat)}
              />
            </div>
            <div className="min-w-0">
              <InventoryAlerts alerts={data.inventoryAlerts} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
