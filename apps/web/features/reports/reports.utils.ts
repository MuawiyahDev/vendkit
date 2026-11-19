import {
  REPORT_RANGE_PRESETS,
  type ReportRangePresetId,
} from "./reports.constants";

export interface ReportDateRange {
  from: string;
  to: string;
}

/** Local calendar date in the `YYYY-MM-DD` shape accepted by date inputs. */
export function toDateInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function lastDays(now: Date, days: number): ReportDateRange {
  const start = new Date(now);
  start.setDate(start.getDate() - (days - 1));
  return { from: toDateInput(start), to: toDateInput(now) };
}

/** Inclusive calendar range for a quick preset. */
export function getPresetRange(
  preset: ReportRangePresetId,
  now: Date = new Date(),
): ReportDateRange {
  switch (preset) {
    case "7d":
      return lastDays(now, 7);
    case "30d":
      return lastDays(now, 30);
    case "90d":
      return lastDays(now, 90);
    case "this-month": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { from: toDateInput(start), to: toDateInput(now) };
    }
    case "last-month": {
      const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const end = new Date(now.getFullYear(), now.getMonth(), 0);
      return { from: toDateInput(start), to: toDateInput(end) };
    }
  }
}

/** Which quick preset, if any, matches the applied range exactly. */
export function findMatchingPreset(
  range: ReportDateRange,
  now: Date = new Date(),
): ReportRangePresetId | null {
  for (const preset of REPORT_RANGE_PRESETS) {
    const candidate = getPresetRange(preset.id, now);
    if (candidate.from === range.from && candidate.to === range.to) {
      return preset.id;
    }
  }

  return null;
}

export function toNumber(value: string): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Inclusive day count for a calendar range. */
export function countDays(range: ReportDateRange): number {
  const from = Date.parse(`${range.from}T00:00:00Z`);
  const to = Date.parse(`${range.to}T00:00:00Z`);

  if (!Number.isFinite(from) || !Number.isFinite(to) || to < from) {
    return 0;
  }

  return Math.round((to - from) / 86_400_000) + 1;
}

/** Rounded percentage of a total, safe for zero totals. */
export function formatShare(part: number, total: number): string {
  if (!Number.isFinite(part) || !Number.isFinite(total) || total <= 0) {
    return "0%";
  }

  return `${Math.round((part / total) * 100)}%`;
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  const first = parts[0];

  if (!first) {
    return "?";
  }

  const last = parts.at(-1);

  if (!last || last === first) {
    return first.slice(0, 2).toUpperCase();
  }

  return `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
}
