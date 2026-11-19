"use client";

import { BarChart3 } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  formatBucketTick,
  formatBucketTooltip,
  formatCompactMoney,
  formatCount,
  formatDashboardMoney,
} from "@/features/dashboard/utils/dashboard.utils";
import { cn } from "@/lib/utils";

import type {
  ReportsResponse,
  ReportsSeriesPoint,
} from "../api/reports-api";

const CHART_HEIGHT = 280;
const MARGIN = { top: 14, right: 12, bottom: 30, left: 56 };
const TICK_COUNT = 4;

type ChartMetric = "revenue" | "orders";

function niceCeil(value: number): number {
  if (!Number.isFinite(value) || value <= 0) {
    return 1;
  }

  const exponent = Math.floor(Math.log10(value));
  const fraction = value / 10 ** exponent;
  const niceFraction =
    fraction <= 1 ? 1 : fraction <= 2 ? 2 : fraction <= 5 ? 5 : 10;

  return niceFraction * 10 ** exponent;
}

function getTickIndices(length: number, count: number): number[] {
  if (length <= count) {
    return Array.from({ length }, (_, index) => index);
  }

  const indices = new Set<number>();

  for (let tick = 0; tick < count; tick += 1) {
    indices.add(Math.round((tick * (length - 1)) / (count - 1)));
  }

  return [...indices].sort((left, right) => left - right);
}

function peakPointFor(
  series: ReportsSeriesPoint[],
  metric: ChartMetric,
): ReportsSeriesPoint | null {
  let peak: ReportsSeriesPoint | null = null;
  let peakValue = -1;

  for (const point of series) {
    const value = metric === "revenue" ? Number(point.revenue) : point.orders;
    if (value > peakValue) {
      peak = point;
      peakValue = value;
    }
  }

  return peak;
}

interface ReportsRevenueChartProps {
  report: ReportsResponse;
}

/**
 * Daily sales chart. Uses a line for revenue and a line for order count so
 * the same panel answers both "how much" and "how many" without swapping
 * chart types.
 */
export function ReportsRevenueChart({ report }: ReportsRevenueChartProps) {
  const { series, regional } = report;
  const [metric, setMetric] = useState<ChartMetric>("revenue");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = `report-chart-${useId().replace(/:/g, "")}`;

  useEffect(() => {
    const element = containerRef.current;
    if (!element) {
      return;
    }

    const updateWidth = () => {
      const nextWidth = element.getBoundingClientRect().width;
      if (nextWidth > 0) {
        setWidth(nextWidth);
      }
    };

    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  const totalRevenue = series.reduce(
    (sum, point) => sum + Number(point.revenue),
    0,
  );
  const totalOrders = series.reduce((sum, point) => sum + point.orders, 0);
  const isEmpty = totalRevenue === 0 && totalOrders === 0;

  const values = series.map((point) =>
    metric === "revenue" ? Number(point.revenue) : point.orders,
  );
  const rawMax = Math.max(...values, 0);
  const yMax =
    metric === "orders"
      ? Math.max(TICK_COUNT, Math.ceil(rawMax / TICK_COUNT) * TICK_COUNT)
      : niceCeil(rawMax);

  const plotWidth = Math.max(width - MARGIN.left - MARGIN.right, 1);
  const plotHeight = CHART_HEIGHT - MARGIN.top - MARGIN.bottom;
  const baseline = MARGIN.top + plotHeight;
  const bandWidth = series.length > 0 ? plotWidth / series.length : plotWidth;

  const xForIndex = (index: number): number =>
    MARGIN.left + bandWidth * (index + 0.5);

  const yForValue = (value: number): number =>
    MARGIN.top + plotHeight - (value / yMax) * plotHeight;

  const points = values.map((value, index) => ({
    x: xForIndex(index),
    y: yForValue(value),
  }));

  const linePath = points
    .map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`)
    .join(" ");

  const areaPath =
    points.length > 0
      ? `${linePath} L ${points[points.length - 1]?.x ?? MARGIN.left} ${baseline} L ${points[0]?.x ?? MARGIN.left} ${baseline} Z`
      : "";

  const yTicks = Array.from({ length: TICK_COUNT + 1 }, (_, index) => {
    const value = (yMax / TICK_COUNT) * index;
    return {
      value,
      y: yForValue(value),
      label:
        metric === "revenue"
          ? formatCompactMoney(value, regional)
          : formatCount(value),
    };
  });

  const xTickIndices = getTickIndices(series.length, 6);
  const accent = metric === "revenue" ? "var(--chart-1)" : "var(--chart-2)";
  const hoveredPoint = hoverIndex !== null ? series[hoverIndex] : undefined;
  const hoveredX = hoverIndex !== null ? xForIndex(hoverIndex) : 0;
  const tooltipLeft = Math.min(
    Math.max(hoveredX, 88),
    Math.max(width - 88, 88),
  );
  const peak = peakPointFor(series, metric);

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (series.length === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const index = Math.floor(relativeX / bandWidth);

    setHoverIndex(Math.min(Math.max(index, 0), series.length - 1));
  }

  return (
    <Card className="gap-0 overflow-hidden py-0 shadow-xs">
      <div className="flex flex-col gap-3 p-5 pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base leading-snug font-semibold tracking-tight">
            Sales over time
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Daily performance for the selected period. Cancelled orders are
            excluded.
          </p>
        </div>

        <div
          className="bg-surface-muted flex w-fit items-center gap-0.5 rounded-lg p-0.5"
          role="group"
          aria-label="Chart metric"
        >
          {(
            [
              { value: "revenue", label: "Revenue" },
              { value: "orders", label: "Orders" },
            ] as const
          ).map((option) => (
            <button
              key={option.value}
              type="button"
              aria-pressed={metric === option.value}
              onClick={() => {
                setMetric(option.value);
                setHoverIndex(null);
              }}
              className={cn(
                "focus-visible:ring-ring/40 rounded-md px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]",
                metric === option.value
                  ? "bg-surface text-foreground shadow-xs"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="border-border-subtle mx-5 flex flex-wrap gap-x-8 gap-y-3 border-t py-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
            Revenue
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatDashboardMoney(totalRevenue, regional)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
            Orders
          </span>
          <span className="text-sm font-semibold tabular-nums">
            {formatCount(totalOrders)}
          </span>
        </div>
        {peak && !isEmpty ? (
          <div className="flex flex-col gap-0.5">
            <span className="text-muted-foreground text-[0.625rem] font-semibold tracking-[0.08em] uppercase">
              Peak day
            </span>
            <span className="text-sm font-semibold tabular-nums">
              {formatBucketTick(peak.date, "day")} ·{" "}
              {metric === "revenue"
                ? formatDashboardMoney(peak.revenue, regional)
                : `${formatCount(peak.orders)} orders`}
            </span>
          </div>
        ) : null}
      </div>

      <div className="px-3 pb-4 sm:px-5">
        <div ref={containerRef} className="relative w-full">
          {isEmpty ? (
            <div className="flex h-[280px] flex-col items-center justify-center gap-3 px-4 text-center">
              <span className="bg-surface-muted text-muted-foreground ring-border-subtle flex size-11 items-center justify-center rounded-xl ring-1 ring-inset">
                <BarChart3 className="size-5" aria-hidden="true" />
              </span>
              <div className="flex max-w-xs flex-col gap-1">
                <p className="text-sm font-medium">No sales in this period</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Try a wider date range, or create an order to start filling
                  in this chart.
                </p>
              </div>
              <Button type="button" variant="outline" size="sm" asChild>
                <Link href="/orders/new">Create order</Link>
              </Button>
            </div>
          ) : width > 0 ? (
            <>
              <svg
                width={width}
                height={CHART_HEIGHT}
                role="img"
                aria-label={`${metric === "revenue" ? "Revenue" : "Order count"} by day`}
                className="block overflow-visible"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.2" />
                    <stop offset="100%" stopColor={accent} stopOpacity="0" />
                  </linearGradient>
                </defs>

                {yTicks.map((tick) => (
                  <g key={tick.value}>
                    <line
                      x1={MARGIN.left}
                      x2={MARGIN.left + plotWidth}
                      y1={tick.y}
                      y2={tick.y}
                      stroke="var(--border-subtle)"
                      strokeDasharray={tick.value === 0 ? undefined : "3 4"}
                    />
                    <text
                      x={MARGIN.left - 9}
                      y={tick.y + 3}
                      textAnchor="end"
                      fontSize={10}
                      fill="var(--muted-foreground)"
                    >
                      {tick.label}
                    </text>
                  </g>
                ))}

                <path d={areaPath} fill={`url(#${gradientId})`} />
                <path
                  d={linePath}
                  fill="none"
                  stroke={accent}
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {series.length === 1 && points[0] ? (
                  <circle
                    cx={points[0].x}
                    cy={points[0].y}
                    r={4}
                    fill="var(--card)"
                    stroke={accent}
                    strokeWidth={2}
                  />
                ) : null}

                {hoverIndex !== null && points[hoverIndex] ? (
                  <>
                    <line
                      x1={hoveredX}
                      x2={hoveredX}
                      y1={MARGIN.top}
                      y2={baseline}
                      stroke="var(--border-strong)"
                      strokeDasharray="3 3"
                    />
                    <circle
                      cx={points[hoverIndex].x}
                      cy={points[hoverIndex].y}
                      r={4}
                      fill="var(--card)"
                      stroke={accent}
                      strokeWidth={2}
                    />
                  </>
                ) : null}

                {xTickIndices.map((index) => {
                  const point = points[index];
                  const entry = series[index];
                  if (!point || !entry) {
                    return null;
                  }

                  return (
                    <text
                      key={`${entry.date}-tick`}
                      x={point.x}
                      y={CHART_HEIGHT - 6}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--muted-foreground)"
                    >
                      {formatBucketTick(entry.date, "day")}
                    </text>
                  );
                })}

                <rect
                  x={MARGIN.left}
                  y={MARGIN.top}
                  width={plotWidth}
                  height={plotHeight}
                  fill="transparent"
                  onPointerMove={handlePointerMove}
                  onPointerLeave={() => setHoverIndex(null)}
                />
              </svg>

              {hoveredPoint ? (
                <div
                  className="bg-popover border-border-subtle pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-lg border px-3 py-2 text-xs shadow-md"
                  style={{ left: tooltipLeft }}
                >
                  <p className="font-medium">
                    {formatBucketTooltip(
                      hoveredPoint.date,
                      "day",
                      regional.dateFormat,
                    )}
                  </p>
                  <div className="text-muted-foreground mt-1 flex flex-col gap-0.5">
                    <span className="flex items-center justify-between gap-4">
                      Revenue
                      <span className="text-foreground font-medium tabular-nums">
                        {formatDashboardMoney(hoveredPoint.revenue, regional)}
                      </span>
                    </span>
                    <span className="flex items-center justify-between gap-4">
                      Orders
                      <span className="text-foreground font-medium tabular-nums">
                        {formatCount(hoveredPoint.orders)}
                      </span>
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <Skeleton className="h-[280px] w-full" />
          )}
        </div>
      </div>
    </Card>
  );
}
