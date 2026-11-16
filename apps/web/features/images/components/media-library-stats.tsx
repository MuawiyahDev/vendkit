"use client";

import {
  AlertCircle,
  Clock3,
  FileImage,
  HardDrive,
  Images,
  RefreshCw,
  type LucideIcon,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

import type { ImageLibraryStats, ImageTypeUsage } from "../api/images-api";
import { useImageStats } from "../hooks/use-image-stats";
import { formatBytes, formatImageMimeType } from "../utils/images.utils";

interface MediaLibraryStatsProps {
  /** Increment to request a fresh snapshot after uploads or deletions. */
  refreshToken: number;
  className?: string;
}

const PANEL_CLASSES =
  "border-border-subtle bg-border-subtle grid grid-cols-2 gap-px overflow-hidden rounded-xl border shadow-xs lg:grid-cols-4";

const TYPE_TONES: Record<string, string> = {
  "image/jpeg": "bg-chart-4",
  "image/png": "bg-chart-1",
  "image/webp": "bg-chart-2",
  "image/gif": "bg-chart-5",
};

function typeTone(mimeType: string): string {
  return TYPE_TONES[mimeType] ?? "bg-muted-foreground/40";
}

function MetricCell({
  icon: Icon,
  label,
  value,
  hint,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="bg-card flex min-h-[7.25rem] flex-col justify-between gap-3 p-4 sm:p-5">
      <div className="text-muted-foreground flex items-center gap-2">
        <span className="bg-surface-muted ring-border-subtle flex size-7 items-center justify-center rounded-md ring-1 ring-inset">
          <Icon className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium">{label}</span>
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-foreground text-xl font-semibold tracking-tight tabular-nums sm:text-2xl">
          {value}
        </span>
        <span className="text-muted-foreground text-xs">{hint}</span>
      </div>
    </div>
  );
}

function TypeBreakdownCell({ stats }: { stats: ImageLibraryStats }) {
  const entries: ImageTypeUsage[] = stats.byType.filter(
    (entry) => entry.count > 0,
  );

  return (
    <div className="bg-card flex min-h-[7.25rem] flex-col gap-3 p-4 sm:p-5">
      <div className="text-muted-foreground flex items-center gap-2">
        <span className="bg-surface-muted ring-border-subtle flex size-7 items-center justify-center rounded-md ring-1 ring-inset">
          <FileImage className="size-3.5" aria-hidden="true" />
        </span>
        <span className="text-xs font-medium">File types</span>
      </div>

      {entries.length === 0 ? (
        <p className="text-muted-foreground text-xs leading-relaxed">
          Upload an image to see the format breakdown.
        </p>
      ) : (
        <>
          <div
            role="img"
            aria-label={entries
              .map(
                (entry) =>
                  `${formatImageMimeType(entry.mimeType)}: ${entry.count}`,
              )
              .join(", ")}
            className="bg-surface-muted flex h-1.5 overflow-hidden rounded-full"
          >
            {entries.map((entry) => (
              <span
                key={entry.mimeType}
                className={cn("h-full", typeTone(entry.mimeType))}
                style={{
                  width: `${(entry.count / stats.totalImages) * 100}%`,
                }}
              />
            ))}
          </div>

          <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
            {entries.map((entry) => (
              <li
                key={entry.mimeType}
                title={`${formatImageMimeType(entry.mimeType)}: ${entry.count.toLocaleString()} ${entry.count === 1 ? "image" : "images"}, ${formatBytes(entry.size)} total`}
                className="flex min-w-0 items-center gap-1.5 text-[0.6875rem]"
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "size-1.5 shrink-0 rounded-full",
                    typeTone(entry.mimeType),
                  )}
                />
                <span className="text-muted-foreground truncate">
                  {formatImageMimeType(entry.mimeType)}
                </span>
                <span className="text-foreground ml-auto font-medium tabular-nums">
                  {entry.count.toLocaleString()}
                </span>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

function StatsSkeleton() {
  return (
    <section
      aria-label="Loading media statistics"
      aria-busy="true"
      className={PANEL_CLASSES}
    >
      {Array.from({ length: 4 }, (_, index) => (
        <div
          key={index}
          className="bg-card flex min-h-[7.25rem] flex-col justify-between gap-3 p-4 sm:p-5"
        >
          <div className="flex items-center gap-2">
            <Skeleton className="size-7 rounded-md" />
            <Skeleton className="h-3 w-20" />
          </div>
          <div className="flex flex-col gap-1.5">
            <Skeleton className="h-7 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
        </div>
      ))}
    </section>
  );
}

/**
 * Aggregate overview for the Media Library page. The picker does not render
 * this component, so embedded views keep their compact footprint.
 */
export function MediaLibraryStats({
  refreshToken,
  className,
}: MediaLibraryStatsProps) {
  const { view, refresh } = useImageStats(refreshToken);

  if (view.status === "loading") {
    return <StatsSkeleton />;
  }

  if (view.status === "error") {
    return (
      <section
        aria-label="Media statistics unavailable"
        className={cn(
          "border-border-subtle bg-card flex flex-col gap-3 rounded-xl border p-4 shadow-xs sm:flex-row sm:items-center sm:justify-between",
          className,
        )}
      >
        <div className="flex items-start gap-3">
          <span className="bg-destructive-soft text-destructive-soft-foreground flex size-8 shrink-0 items-center justify-center rounded-md">
            <AlertCircle className="size-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-foreground text-sm font-medium">
              Statistics unavailable
            </p>
            <p className="text-muted-foreground text-xs">{view.message}</p>
          </div>
        </div>
        <Button type="button" variant="outline" size="sm" onClick={refresh}>
          <RefreshCw aria-hidden="true" />
          Retry
        </Button>
      </section>
    );
  }

  const stats = view.data;
  const fileCountLabel = `${stats.totalImages.toLocaleString()} ${
    stats.totalImages === 1 ? "file" : "files"
  }`;

  return (
    <section
      aria-label="Media library statistics"
      className={cn(PANEL_CLASSES, className)}
    >
      <MetricCell
        icon={Images}
        label="Total images"
        value={stats.totalImages.toLocaleString()}
        hint="Ready to reuse anywhere"
      />
      <MetricCell
        icon={HardDrive}
        label="Storage used"
        value={formatBytes(stats.storageBytes)}
        hint={
          stats.totalImages === 0
            ? "No files uploaded yet"
            : `Across ${fileCountLabel}`
        }
      />
      <MetricCell
        icon={Clock3}
        label="Recent uploads"
        value={stats.recentUploads.toLocaleString()}
        hint={`Added in the last ${stats.recentWindowDays} days`}
      />
      <TypeBreakdownCell stats={stats} />
    </section>
  );
}
