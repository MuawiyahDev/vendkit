import type { CurrencyPosition } from "../settings.types";

export interface MoneyFormatOptions {
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
}

const MONTHS_LONG = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const MONTHS_SHORT = MONTHS_LONG.map((month) => month.slice(0, 3));

function pad(value: number): string {
  return value.toString().padStart(2, "0");
}

export function formatMoney(
  amount: number,
  options: MoneyFormatOptions,
): string {
  if (!Number.isFinite(amount)) {
    return "—";
  }

  const sign = amount < 0 ? "-" : "";
  const fixed = Math.abs(amount).toFixed(options.decimalPrecision);
  const [integerPart = "0", decimalPart] = fixed.split(".");
  const grouped = integerPart.replace(
    /\B(?=(\d{3})+(?!\d))/g,
    options.thousandSeparator,
  );
  const number =
    options.decimalPrecision > 0 && decimalPart !== undefined
      ? `${grouped}${options.decimalSeparator}${decimalPart}`
      : grouped;
  const symbol = options.currencySymbol.trim();
  const formatted = options.currencyPosition === "BEFORE"
    ? `${symbol} ${number}`
    : `${number} ${symbol}`;

  return `${sign}${formatted}`.trim();
}

export function formatDatePattern(date: Date, pattern: string): string {
  const day = date.getUTCDate();
  const month = date.getUTCMonth();
  const year = date.getUTCFullYear();

  const tokens: Record<string, string> = {
    YYYY: String(year),
    MMMM: MONTHS_LONG[month] ?? "",
    MMM: MONTHS_SHORT[month] ?? "",
    MM: pad(month + 1),
    M: String(month + 1),
    DD: pad(day),
    D: String(day),
  };

  return pattern.replace(/YYYY|MMMM|MMM|MM|M|DD|D/g, (token) => tokens[token] ?? token);
}

export function formatTimePattern(date: Date, pattern: string): string {
  const hours24 = date.getUTCHours();
  const hours12 = hours24 % 12 || 12;

  const tokens: Record<string, string> = {
    HH: pad(hours24),
    hh: pad(hours12),
    mm: pad(date.getUTCMinutes()),
    ss: pad(date.getUTCSeconds()),
    A: hours24 >= 12 ? "PM" : "AM",
  };

  return pattern.replace(/HH|hh|mm|ss|A/g, (token) => tokens[token] ?? token);
}

export function formatInvoiceNumberExample(options: {
  numberPrefix: string;
  numberFormat: string;
  yearBasedNumbering: boolean;
  sequence: number;
  date: Date;
}): string {
  const year = options.date.getUTCFullYear().toString();
  const month = pad(options.date.getUTCMonth() + 1);

  return options.numberFormat
    .replaceAll("{prefix}", options.numberPrefix)
    .replaceAll("{year}", options.yearBasedNumbering ? year : "")
    .replaceAll("{month}", month)
    .replaceAll("{sequence}", String(options.sequence));
}

export function getInitials(name: string): string {
  const parts = name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return "VK";
  }

  return parts.map((part) => part[0]?.toUpperCase() ?? "").join("");
}

export function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}
