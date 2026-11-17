import {
  Boxes,
  PackageSearch,
  PackageX,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";

import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { InventoryOverview } from "../api/inventory-api";

interface InventoryStatsProps {
  overview: InventoryOverview | null;
  loading: boolean;
  error: string | null;
}

interface StatItem {
  label: string;
  value: number | null;
  icon: LucideIcon;
  tone: "neutral" | "warning" | "danger";
  hint: string;
}

function formatCount(value: number): string {
  return value.toLocaleString();
}

export function InventoryStats({ overview, loading, error }: InventoryStatsProps) {
  const items: StatItem[] = [
    {
      label: "Tracked products",
      value: overview?.totalProducts ?? null,
      icon: PackageSearch,
      tone: "neutral",
      hint: "Products with inventory tracking enabled",
    },
    {
      label: "Available units",
      value: overview?.totalAvailableStock ?? null,
      icon: Boxes,
      tone: "neutral",
      hint: "Total units on hand across tracked products",
    },
    {
      label: "Low stock",
      value: overview?.lowStockProducts ?? null,
      icon: TriangleAlert,
      tone: "warning",
      hint: "At or below the low-stock threshold",
    },
    {
      label: "Out of stock",
      value: overview?.outOfStockProducts ?? null,
      icon: PackageX,
      tone: "danger",
      hint: "Tracked products with zero available units",
    },
  ];

  return (
    <Card className="gap-0 overflow-hidden py-0">
      <div className="grid grid-cols-2 divide-x divide-y divide-border-subtle sm:grid-cols-4 sm:divide-y-0">
        {items.map((item) => (
          <div key={item.label} className="flex flex-col gap-2 px-4 py-4 sm:px-5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-muted-foreground text-xs font-medium tracking-wide uppercase">
                {item.label}
              </span>
              <span
                className={cn(
                  "flex size-7 items-center justify-center rounded-md",
                  item.tone === "warning" && "bg-warning-soft text-warning-soft-foreground",
                  item.tone === "danger" && "bg-destructive-soft text-destructive-soft-foreground",
                  item.tone === "neutral" && "bg-surface-muted text-muted-foreground",
                )}
              >
                <item.icon className="size-3.5" aria-hidden="true" />
              </span>
            </div>
            {loading ? (
              <Skeleton className="h-8 w-16" />
            ) : (
              <span
                className={cn(
                  "text-2xl leading-none font-semibold tabular-nums",
                  item.tone === "warning" && "text-warning-soft-foreground",
                  item.tone === "danger" && "text-destructive-soft-foreground",
                )}
              >
                {item.value === null ? "—" : formatCount(item.value)}
              </span>
            )}
            <span className="text-muted-foreground text-[0.6875rem] leading-snug">
              {error ? "Unavailable" : item.hint}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
