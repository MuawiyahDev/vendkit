"use client";

import { AlertCircle, Info, RefreshCw } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { PageHeader } from "@/components/shared/page-header";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatRangeLabel } from "@/features/dashboard/utils/dashboard.utils";

import { getReports, type ReportsResponse } from "../api/reports-api";
import type { ReportRangePresetId } from "../reports.constants";
import {
  countDays,
  findMatchingPreset,
  getPresetRange,
  type ReportDateRange,
} from "../reports.utils";
import { ReportsChannelCard } from "./reports-channel-card";
import { ReportsRangeFilter } from "./reports-range-filter";
import { ReportsRevenueChart } from "./reports-revenue-chart";
import { ReportsSkeleton } from "./reports-skeleton";
import { ReportsStatusCard } from "./reports-status-card";
import { ReportsSummary } from "./reports-summary";
import { ReportsTopCustomersCard } from "./reports-top-customers-card";
import { ReportsTopProductsCard } from "./reports-top-products-card";

type ReportView =
  | { status: "loading" }
  | { status: "success"; data: ReportsResponse }
  | { status: "error"; message: string };

export function ReportsPage() {
  const [applied, setApplied] = useState<ReportDateRange>(() =>
    getPresetRange("30d"),
  );
  const [fromInput, setFromInput] = useState(applied.from);
  const [toInput, setToInput] = useState(applied.to);
  const [view, setView] = useState<ReportView>({ status: "loading" });
  const [isFetching, setIsFetching] = useState(true);

  const load = useCallback(
    (signal: AbortSignal) => {
      void getReports(applied, { signal })
        .then((data) => {
          if (!signal.aborted) {
            setView({ status: "success", data });
          }
        })
        .catch((error: unknown) => {
          if (signal.aborted) {
            return;
          }

          setView({
            status: "error",
            message:
              error instanceof Error
                ? error.message
                : "Something went wrong while loading the report.",
          });
        })
        .finally(() => {
          if (!signal.aborted) {
            setIsFetching(false);
          }
        });
    },
    [applied],
  );

  useEffect(() => {
    const controller = new AbortController();
    load(controller.signal);
    return () => controller.abort();
  }, [load]);

  const activePreset = useMemo(
    () => findMatchingPreset(applied),
    [applied],
  );
  const days = countDays(applied);
  const data = view.status === "success" ? view.data : null;
  const rangeLabel = data
    ? formatRangeLabel(applied.from, applied.to, data.regional.dateFormat)
    : `${applied.from} – ${applied.to}`;

  function selectPreset(preset: ReportRangePresetId) {
    const next = getPresetRange(preset);

    setFromInput(next.from);
    setToInput(next.to);
    setIsFetching(true);
    if (view.status === "error") {
      setView({ status: "loading" });
    }
    setApplied(next);
  }

  function applyRange() {
    if (!fromInput || !toInput) {
      return;
    }

    setIsFetching(true);
    if (view.status === "error") {
      setView({ status: "loading" });
    }
    setApplied({ from: fromInput, to: toInput });
  }

  function refresh() {
    setIsFetching(true);
    if (view.status === "error") {
      setView({ status: "loading" });
    }
    setApplied((current) => ({ ...current }));
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Reports"
        description="Revenue, order flow, and customer insights across any period. Numbers update as you record sales."
        actions={
          <Button
            type="button"
            variant="outline"
            onClick={refresh}
            disabled={isFetching}
            className="w-full sm:w-auto"
          >
            <RefreshCw
              className={isFetching ? "animate-spin" : undefined}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <ReportsRangeFilter
        fromInput={fromInput}
        toInput={toInput}
        activePreset={activePreset}
        rangeLabel={rangeLabel}
        days={days}
        isFetching={isFetching}
        onFromInputChange={setFromInput}
        onToInputChange={setToInput}
        onPresetSelect={selectPreset}
        onApply={applyRange}
      />

      {view.status === "error" ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertTitle>Could not load this report</AlertTitle>
          <AlertDescription>
            <p>{view.message}</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={refresh}
              className="mt-2"
            >
              Try again
            </Button>
          </AlertDescription>
        </Alert>
      ) : view.status === "loading" ? (
        <ReportsSkeleton />
      ) : (
        <>
          <ReportsSummary report={view.data} />

          <ReportsRevenueChart report={view.data} />

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportsStatusCard report={view.data} />
            <ReportsChannelCard report={view.data} />
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <ReportsTopProductsCard report={view.data} />
            <ReportsTopCustomersCard report={view.data} />
          </div>

          <p className="text-muted-foreground flex items-start gap-2 text-xs leading-relaxed">
            <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
            <span>
              Revenue excludes cancelled orders and uses your regional currency
              settings. New customer counts include customers created during the
              selected period.
            </span>
          </p>
        </>
      )}
    </div>
  );
}
