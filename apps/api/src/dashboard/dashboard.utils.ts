import { BadRequestException } from '@nestjs/common';
import {
  DEFAULT_DASHBOARD_PRESET,
  MAX_CUSTOM_RANGE_DAYS,
  type DashboardGranularity,
  type DashboardPreset,
} from './dashboard.constants.js';
import type {
  DatePeriod,
  LocalDateParts,
  PeriodInstants,
  ResolvedDashboardRange,
  ZonedDateTimeParts,
} from './dashboard.types.js';

const DATE_ONLY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

const MS_PER_DAY = 86_400_000;

const dateTimeFormatterCache = new Map<string, Intl.DateTimeFormat>();

function getDateTimeFormatter(timeZone: string): Intl.DateTimeFormat {
  const cached = dateTimeFormatterCache.get(timeZone);
  if (cached) {
    return cached;
  }

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });

  dateTimeFormatterCache.set(timeZone, formatter);
  return formatter;
}

function pad(value: number): string {
  return value.toString().padStart(2, '0');
}

export function formatLocalDate(parts: LocalDateParts): string {
  return `${parts.year.toString().padStart(4, '0')}-${pad(parts.month)}-${pad(parts.day)}`;
}

export function parseLocalDate(value: string): LocalDateParts {
  const match = DATE_ONLY_PATTERN.exec(value);

  if (!match) {
    throw new BadRequestException('Dashboard dates must use YYYY-MM-DD');
  }

  const parts: LocalDateParts = {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };

  if (!isValidDate(parts)) {
    throw new BadRequestException(`Invalid dashboard date: ${value}`);
  }

  return parts;
}

function isValidDate(parts: LocalDateParts): boolean {
  const date = toUtcDate(parts);

  return (
    date.getUTCFullYear() === parts.year &&
    date.getUTCMonth() + 1 === parts.month &&
    date.getUTCDate() === parts.day
  );
}

function toUtcDate(parts: LocalDateParts): Date {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day));
}

function fromUtcDate(date: Date): LocalDateParts {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function addLocalDays(
  parts: LocalDateParts,
  days: number,
): LocalDateParts {
  const date = toUtcDate(parts);
  date.setUTCDate(date.getUTCDate() + days);
  return fromUtcDate(date);
}

export function addLocalMonths(
  parts: LocalDateParts,
  months: number,
  day = 1,
): LocalDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month - 1 + months, day));
  return fromUtcDate(date);
}

export function compareLocalDates(
  left: LocalDateParts,
  right: LocalDateParts,
): number {
  return toUtcDate(left).getTime() - toUtcDate(right).getTime();
}

export function daysBetweenInclusive(
  from: LocalDateParts,
  to: LocalDateParts,
): number {
  return (
    Math.round(
      (toUtcDate(to).getTime() - toUtcDate(from).getTime()) / MS_PER_DAY,
    ) + 1
  );
}

export function firstDayOfMonth(parts: LocalDateParts): LocalDateParts {
  return { year: parts.year, month: parts.month, day: 1 };
}

export function lastDayOfMonth(parts: LocalDateParts): LocalDateParts {
  const date = new Date(Date.UTC(parts.year, parts.month, 0));
  return fromUtcDate(date);
}

export function getZonedDateTimeParts(
  date: Date,
  timeZone: string,
): ZonedDateTimeParts {
  const parts = getDateTimeFormatter(timeZone).formatToParts(date);
  const values: Record<string, number> = {};

  for (const part of parts) {
    if (part.type !== 'literal') {
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

export function getTodayInTimeZone(
  now: Date,
  timeZone: string,
): LocalDateParts {
  const parts = getZonedDateTimeParts(now, timeZone);
  return { year: parts.year, month: parts.month, day: parts.day };
}

function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const parts = getZonedDateTimeParts(date, timeZone);
  const asUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return asUtc - Math.trunc(date.getTime() / 1000) * 1000;
}

/**
 * Converts midnight on a calendar date in the configured business timezone
 * into the matching UTC instant. Iterating the offset converges across DST
 * boundaries and half-hour timezone offsets.
 */
export function zonedStartOfDayToUtc(
  parts: LocalDateParts,
  timeZone: string,
): Date {
  const target = Date.UTC(parts.year, parts.month - 1, parts.day, 0, 0, 0, 0);
  let instant = target;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const offset = getTimeZoneOffsetMs(new Date(instant), timeZone);
    const next = target - offset;

    if (next === instant) {
      break;
    }

    instant = next;
  }

  return new Date(instant);
}

export function getPeriodInstants(
  period: DatePeriod,
  timeZone: string,
): PeriodInstants {
  return {
    start: zonedStartOfDayToUtc(period.from, timeZone),
    end: zonedStartOfDayToUtc(addLocalDays(period.to, 1), timeZone),
  };
}

function resolvePresetPeriod(
  preset: DashboardPreset,
  today: LocalDateParts,
): DatePeriod {
  switch (preset) {
    case 'today':
      return { from: today, to: today };
    case 'yesterday': {
      const yesterday = addLocalDays(today, -1);
      return { from: yesterday, to: yesterday };
    }
    case 'last-7-days':
      return { from: addLocalDays(today, -6), to: today };
    case 'last-30-days':
      return { from: addLocalDays(today, -29), to: today };
    case 'this-month':
      return { from: firstDayOfMonth(today), to: today };
    case 'last-month': {
      const previousMonth = addLocalMonths(firstDayOfMonth(today), -1);
      return {
        from: firstDayOfMonth(previousMonth),
        to: lastDayOfMonth(previousMonth),
      };
    }
    case 'custom':
      throw new BadRequestException(
        'Custom dashboard ranges require explicit from and to dates',
      );
    default: {
      const exhaustive: never = preset;
      throw new BadRequestException(`Unknown dashboard preset: ${exhaustive}`);
    }
  }
}

function resolvePreviousPeriod(
  preset: DashboardPreset,
  current: DatePeriod,
): DatePeriod {
  if (preset === 'this-month') {
    const previousMonth = addLocalMonths(firstDayOfMonth(current.from), -1);
    const lastDay = lastDayOfMonth(previousMonth);

    return {
      from: firstDayOfMonth(previousMonth),
      to: {
        year: previousMonth.year,
        month: previousMonth.month,
        day: Math.min(current.to.day, lastDay.day),
      },
    };
  }

  if (preset === 'last-month') {
    const previousMonth = addLocalMonths(firstDayOfMonth(current.from), -1);
    return {
      from: firstDayOfMonth(previousMonth),
      to: lastDayOfMonth(previousMonth),
    };
  }

  const span = daysBetweenInclusive(current.from, current.to);
  const previousTo = addLocalDays(current.from, -1);

  return {
    from: addLocalDays(previousTo, -(span - 1)),
    to: previousTo,
  };
}

function resolveCustomPeriod(
  from: string | undefined,
  to: string | undefined,
): DatePeriod {
  if (!from || !to) {
    throw new BadRequestException(
      'Custom dashboard ranges require both from and to dates',
    );
  }

  const fromDate = parseLocalDate(from);
  const toDate = parseLocalDate(to);

  if (compareLocalDates(fromDate, toDate) > 0) {
    throw new BadRequestException('Dashboard from date must be before to date');
  }

  const span = daysBetweenInclusive(fromDate, toDate);
  if (span > MAX_CUSTOM_RANGE_DAYS) {
    throw new BadRequestException(
      `Dashboard custom ranges cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days`,
    );
  }

  return { from: fromDate, to: toDate };
}

export function resolveGranularity(spanDays: number): DashboardGranularity {
  if (spanDays <= 2) {
    return 'hour';
  }
  if (spanDays <= 62) {
    return 'day';
  }
  if (spanDays <= 180) {
    return 'week';
  }
  return 'month';
}

export function resolveDashboardRange(options: {
  preset?: DashboardPreset;
  from?: string;
  to?: string;
  timeZone: string;
  now: Date;
}): ResolvedDashboardRange {
  const preset = options.preset ?? DEFAULT_DASHBOARD_PRESET;
  const today = getTodayInTimeZone(options.now, options.timeZone);
  const current =
    preset === 'custom'
      ? resolveCustomPeriod(options.from, options.to)
      : resolvePresetPeriod(preset, today);

  const spanDays = daysBetweenInclusive(current.from, current.to);

  if (spanDays > MAX_CUSTOM_RANGE_DAYS) {
    throw new BadRequestException(
      `Dashboard ranges cannot exceed ${MAX_CUSTOM_RANGE_DAYS} days`,
    );
  }

  return {
    preset,
    current,
    previous: resolvePreviousPeriod(preset, current),
    granularity: resolveGranularity(spanDays),
  };
}

function startOfIsoWeek(parts: LocalDateParts): LocalDateParts {
  const dayOfWeek = toUtcDate(parts).getUTCDay();
  const daysSinceMonday = (dayOfWeek + 6) % 7;
  return addLocalDays(parts, -daysSinceMonday);
}

export function generateBuckets(
  from: LocalDateParts,
  to: LocalDateParts,
  granularity: DashboardGranularity,
): string[] {
  const buckets: string[] = [];
  const maxBuckets = MAX_CUSTOM_RANGE_DAYS * 24 + 1;

  if (granularity === 'hour') {
    let date = from;

    while (compareLocalDates(date, to) <= 0 && buckets.length < maxBuckets) {
      for (let hour = 0; hour < 24; hour += 1) {
        buckets.push(`${formatLocalDate(date)}T${pad(hour)}:00`);
      }
      date = addLocalDays(date, 1);
    }

    return buckets;
  }

  if (granularity === 'day') {
    let date = from;

    while (compareLocalDates(date, to) <= 0 && buckets.length < maxBuckets) {
      buckets.push(formatLocalDate(date));
      date = addLocalDays(date, 1);
    }

    return buckets;
  }

  if (granularity === 'week') {
    let date = startOfIsoWeek(from);

    while (compareLocalDates(date, to) <= 0 && buckets.length < maxBuckets) {
      buckets.push(formatLocalDate(date));
      date = addLocalDays(date, 7);
    }

    return buckets;
  }

  let month = firstDayOfMonth(from);

  while (compareLocalDates(month, to) <= 0 && buckets.length < maxBuckets) {
    buckets.push(formatLocalDate(month).slice(0, 7));
    month = addLocalMonths(month, 1);
  }

  return buckets;
}

export function calculatePercentageChange(
  current: number,
  previous: number | null,
): number | null {
  if (
    previous === null ||
    !Number.isFinite(current) ||
    !Number.isFinite(previous) ||
    previous === 0
  ) {
    return null;
  }

  return Math.round(((current - previous) / previous) * 1000) / 10;
}
