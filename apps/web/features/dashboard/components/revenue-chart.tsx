"use client";

import { ReceiptText } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type {
  DashboardGranularity,
  DashboardRegionalSettings,
  DashboardSeriesPoint,
} from "../dashboard.types";
import {
  formatBucketTick,
  formatBucketTooltip,
  formatCompactMoney,
  formatCount,
  formatDashboardMoney,
} from "../utils/dashboard.utils";

const CHART_HEIGHT = 264;
const MARGIN = { top: 16, right: 14, bottom: 28, left: 58 };
const TICK_COUNT = 4;

type ChartMetric = "revenue" | "orders";

interface RevenueChartProps {
  series: DashboardSeriesPoint[];
  granularity: DashboardGranularity;
  regional: DashboardRegionalSettings;
  rangeLabel: string;
}

interface ChartPoint {
  x: number;
  y: number;
  value: number;
}

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

  return [...indices].sort((a, b) => a - b);
}

export function RevenueChart({
  series,
  granularity,
  regional,
  rangeLabel,
}: RevenueChartProps) {
  const [metric, setMetric] = useState<ChartMetric>("revenue");
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [width, setWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const gradientId = `chart-gradient-${useId().replace(/:/g, "")}`;

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
  const isEmpty = totalOrders === 0 && totalRevenue === 0;

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
  const useBars = metric === "orders" || series.length === 1;

  const xForIndex = (index: number): number => {
    if (useBars) {
      return MARGIN.left + bandWidth * (index + 0.5);
    }
    if (series.length === 1) {
      return MARGIN.left + plotWidth / 2;
    }
    return MARGIN.left + (index / (series.length - 1)) * plotWidth;
  };

  const yForValue = (value: number): number =>
    MARGIN.top + plotHeight - (value / yMax) * plotHeight;

  const points: ChartPoint[] = values.map((value, index) => ({
    x: xForIndex(index),
    y: yForValue(value),
    value,
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
  const tooltipLeft = Math.min(Math.max(hoveredX, 82), width - 82);

  function handlePointerMove(event: React.PointerEvent<SVGRectElement>) {
    if (series.length === 0) {
      return;
    }

    const rect = event.currentTarget.getBoundingClientRect();
    const relativeX = event.clientX - rect.left;
    const index = useBars
      ? Math.floor(relativeX / bandWidth)
      : Math.round((relativeX / plotWidth) * (series.length - 1));

    setHoverIndex(Math.min(Math.max(index, 0), series.length - 1));
  }

  return (
    <Card className="h-full gap-0 py-0">
      <div className="flex flex-col gap-3 p-5 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex min-w-0 flex-col gap-1">
          <h2 className="text-base leading-snug font-semibold tracking-tight">
            Revenue &amp; sales
          </h2>
          <p className="text-muted-foreground text-xs leading-relaxed">
            {rangeLabel}
          </p>
        </div>

        <div
          className="bg-surface-muted flex w-fit items-center gap-0.5 rounded-md p-0.5"
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
                "focus-visible:ring-ring/40 rounded-[5px] px-2.5 py-1 text-xs font-medium transition-colors outline-none focus-visible:ring-[3px]",
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

      <div className="px-3 pb-4 sm:px-4">
        <div ref={containerRef} className="relative w-full">
          {isEmpty ? (
            <div className="flex h-[264px] flex-col items-center justify-center gap-3 px-4 text-center">
              <span className="bg-surface-muted text-muted-foreground flex size-10 items-center justify-center rounded-lg">
                <ReceiptText className="size-4" aria-hidden="true" />
              </span>
              <div className="flex max-w-xs flex-col gap-1">
                <p className="text-sm font-medium">No sales in this period</p>
                <p className="text-muted-foreground text-xs leading-relaxed">
                  The chart will fill in as orders are created for the selected
                  date range.
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
                aria-label={`${metric === "revenue" ? "Revenue" : "Order count"} chart for ${rangeLabel}`}
                className="block overflow-visible"
              >
                <defs>
                  <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={accent} stopOpacity="0.22" />
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

                {useBars
                  ? points.map((point, index) => {
                      const barWidth = Math.max(2, bandWidth * 0.56);
                      const height = Math.max(baseline - point.y, 0);
                      return (
                        <rect
                          key={`${series[index]?.bucket ?? index}-bar`}
                          x={point.x - barWidth / 2}
                          y={point.y}
                          width={barWidth}
                          height={height}
                          rx={Math.min(3, barWidth / 3)}
                          fill={accent}
                          opacity={
                            hoverIndex === null || hoverIndex === index
                              ? 0.92
                              : 0.45
                          }
                        />
                      );
                    })
                  : null}

                {!useBars ? (
                  <>
                    <path d={areaPath} fill={`url(#${gradientId})`} />
                    <path
                      d={linePath}
                      fill="none"
                      stroke={accent}
                      strokeWidth={2}
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {points.map((point, index) =>
                      hoverIndex === index ? (
                        <circle
                          key={`${series[index]?.bucket ?? index}-point`}
                          cx={point.x}
                          cy={point.y}
                          r={4}
                          fill="var(--card)"
                          stroke={accent}
                          strokeWidth={2}
                        />
                      ) : null,
                    )}
                  </>
                ) : null}

                {hoverIndex !== null ? (
                  <line
                    x1={hoveredX}
                    x2={hoveredX}
                    y1={MARGIN.top}
                    y2={baseline}
                    stroke="var(--border-strong)"
                    strokeDasharray="3 3"
                  />
                ) : null}

                {xTickIndices.map((index) => {
                  const point = points[index];
                  const bucket = series[index]?.bucket;
                  if (!point || !bucket) {
                    return null;
                  }

                  return (
                    <text
                      key={`${bucket}-tick`}
                      x={point.x}
                      y={CHART_HEIGHT - 6}
                      textAnchor="middle"
                      fontSize={10}
                      fill="var(--muted-foreground)"
                    >
                      {formatBucketTick(bucket, granularity)}
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
                  className="bg-popover pointer-events-none absolute top-2 z-10 -translate-x-1/2 rounded-md border border-border-subtle px-2.5 py-2 text-xs shadow-md"
                  style={{ left: tooltipLeft }}
                >
                  <p className="font-medium">
                    {formatBucketTooltip(
                      hoveredPoint.bucket,
                      granularity,
                      regional.dateFormat,
                    )}
                  </p>
                  <div className="text-muted-foreground mt-1 flex flex-col gap-0.5">
                    <span>
                      Revenue{" "}
                      <span className="text-foreground font-medium tabular-nums">
                        {formatDashboardMoney(hoveredPoint.revenue, regional)}
                      </span>
                    </span>
                    <span>
                      Orders{" "}
                      <span className="text-foreground font-medium tabular-nums">
                        {formatCount(hoveredPoint.orders)}
                      </span>
                    </span>
                  </div>
                </div>
              ) : null}
            </>
          ) : (
            <Skeleton className="h-[264px] w-full" />
          )}
        </div>
      </div>
    </Card>
  );
}
