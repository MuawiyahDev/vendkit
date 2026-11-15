import {
  formatDatePattern,
  formatMoney,
  formatTimePattern,
} from "@/features/settings/utils/settings-format.utils";

import type {
  DashboardGranularity,
  DashboardRegionalSettings,
} from "../dashboard.types";

const compactNumberFormatter = new Intl.NumberFormat(undefined, {
  notation: "compact",
  maximumFractionDigits: 1,
});

const integerFormatter = new Intl.NumberFormat(undefined, {
  maximumFractionDigits: 0,
});

const shortDayFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const monthFormatter = new Intl.DateTimeFormat(undefined, {
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

interface ZonedParts {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second: number;
}

const zonedFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getZonedFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = zonedFormatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  });

  zonedFormatterCache.set(timeZone, formatter);
  return formatter;
}

function getZonedParts(value: string, timeZone: string): ZonedParts | null {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const parts = getZonedFormatter(timeZone).formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== "literal") {
      values[part.type] = Number(part.value);
    }
  }

  return {
    year: values.year ?? 0,
    month: values.month ?? 1,
    day: values.day ?? 1,
    hour: values.hour ?? 0,
    minute: values.minute ?? 0,
    second: values.second ?? 0,
  };
}

/** A Date whose UTC fields mirror the wall-clock time in the target zone. */
function toPatternDate(parts: ZonedParts): Date {
  return new Date(
    Date.UTC(
      parts.year,
      parts.month - 1,
      parts.day,
      parts.hour,
      parts.minute,
      parts.second,
    ),
  );
}

function parseBucketDate(bucket: string): Date | null {
  let normalized = bucket;

  if (/^\d{4}-\d{2}$/.test(bucket)) {
    normalized = `${bucket}-01T00:00:00Z`;
  } else if (/^\d{4}-\d{2}-\d{2}$/.test(bucket)) {
    normalized = `${bucket}T00:00:00Z`;
  } else if (bucket.includes("T")) {
    normalized = `${bucket}:00Z`;
  }

  const date = new Date(normalized);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function toMoneyFormatOptions(regional: DashboardRegionalSettings) {
  return {
    currencySymbol: regional.currencySymbol,
    currencyPosition: regional.currencyPosition,
    decimalPrecision: regional.decimalPrecision,
    thousandSeparator: regional.thousandSeparator,
    decimalSeparator: regional.decimalSeparator,
  };
}

export function formatDashboardMoney(
  amount: string | number,
  regional: DashboardRegionalSettings,
): string {
  const value = typeof amount === "number" ? amount : Number(amount);

  if (!Number.isFinite(value)) {
    return "—";
  }

  return formatMoney(value, toMoneyFormatOptions(regional));
}

/** Compact currency value for chart axes (e.g. ৳12.5K). */
export function formatCompactMoney(
  amount: number,
  regional: DashboardRegionalSettings,
): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  const number = compactNumberFormatter.format(amount);
  const symbol = regional.currencySymbol.trim();

  if (!symbol) {
    return number;
  }

  return regional.currencyPosition === "BEFORE"
    ? `${symbol}${number}`
    : `${number}${symbol}`;
}

export function formatCount(value: number): string {
  return integerFormatter.format(Number.isFinite(value) ? value : 0);
}

export function formatPercentageChange(value: number): string {
  const prefix = value > 0 ? "+" : "";
  return `${prefix}${value.toFixed(1)}%`;
}

/** Formats a YYYY-MM-DD calendar date using the configured date pattern. */
export function formatCalendarDate(value: string, dateFormat: string): string {
  const date = parseBucketDate(value);
  return date ? formatDatePattern(date, dateFormat) : value;
}

export function formatRangeLabel(
  from: string,
  to: string,
  dateFormat: string,
): string {
  if (from === to) {
    return formatCalendarDate(from, dateFormat);
  }

  return `${formatCalendarDate(from, dateFormat)} – ${formatCalendarDate(to, dateFormat)}`;
}

/** Formats an API timestamp in the business timezone and configured pattern. */
export function formatDashboardDateTime(
  value: string,
  regional: DashboardRegionalSettings,
): string {
  const parts = getZonedParts(value, regional.timezone);
  if (!parts) {
    return "—";
  }

  const patternDate = toPatternDate(parts);
  return `${formatDatePattern(patternDate, regional.dateFormat)} · ${formatTimePattern(patternDate, regional.timeFormat)}`;
}

/** Short axis label for a time-series bucket. */
export function formatBucketTick(
  bucket: string,
  granularity: DashboardGranularity,
): string {
  if (granularity === "hour") {
    return bucket.slice(11, 16);
  }

  const date = parseBucketDate(bucket);
  if (!date) {
    return bucket;
  }

  if (granularity === "month") {
    return monthFormatter.format(date);
  }

  return shortDayFormatter.format(date);
}

/** Full tooltip label for a time-series bucket. */
export function formatBucketTooltip(
  bucket: string,
  granularity: DashboardGranularity,
  dateFormat: string,
): string {
  if (granularity === "hour") {
    const date = parseBucketDate(bucket);
    const hour = bucket.slice(11, 16);
    return date ? `${formatDatePattern(date, dateFormat)} · ${hour}` : bucket;
  }

  if (granularity === "month") {
    const date = parseBucketDate(`${bucket}-01`);
    return date ? monthFormatter.format(date) : bucket;
  }

  if (granularity === "week") {
    return `Week of ${formatCalendarDate(bucket, dateFormat)}`;
  }

  return formatCalendarDate(bucket, dateFormat);
}

export function clampPercentage(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }
  return Math.min(100, Math.max(0, value));
}

/** Time-of-day greeting resolved in the configured business timezone. */
export function getTimeOfDayGreeting(
  timeZone: string,
  now: Date = new Date(),
): string {
  const parts = getZonedFormatter(timeZone).formatToParts(now);
  const hour = Number(
    parts.find((part) => part.type === "hour")?.value ?? "12",
  );

  if (hour < 12) {
    return "Good morning";
  }
  if (hour < 18) {
    return "Good afternoon";
  }
  return "Good evening";
}
