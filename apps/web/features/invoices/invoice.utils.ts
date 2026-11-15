import type { Order } from "@/features/orders/api/orders-api";

import type { InvoiceBusinessProfile } from "./invoice.types";

const invoiceDateFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
});

const invoiceDateTimeFormatter = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
});

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats money with an explicit currency code. `currencyDisplay: "code"`
 * avoids locale-specific symbols (for example, the BDT glyph) so totals stay
 * unambiguous on printed invoices.
 */
export function formatInvoiceCurrency(
  value: string | number,
  currency: string,
): string {
  const amount = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(amount)) {
    return `${currency} -`;
  }

  const formatter = getCurrencyFormatter(currency);
  if (!formatter) {
    return `${currency} ${amount.toFixed(2)}`;
  }

  return formatter.format(amount).replace(/\u00A0/g, " ");
}

export function formatInvoiceDate(value: string | Date): string {
  const date = toDate(value);
  return date ? invoiceDateFormatter.format(date) : "-";
}

export function formatInvoiceDateTime(value: string | Date): string {
  const date = toDate(value);
  return date ? invoiceDateTimeFormatter.format(date) : "-";
}

/** `PARTIALLY_PAID` -> `Partially Paid`. */
export function formatInvoiceStatus(value: string): string {
  return value
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

type InvoiceCustomerSource = Pick<
  Order,
  "customer" | "shippingName" | "shippingPhone"
>;

export function getInvoiceCustomerName(order: InvoiceCustomerSource): string {
  return (
    order.customer?.name?.trim() ||
    order.shippingName?.trim() ||
    "Walk-in customer"
  );
}

export function getInvoiceCustomerContactLines(
  order: InvoiceCustomerSource,
): string[] {
  const lines: string[] = [];
  const phone = order.customer?.phone?.trim() || order.shippingPhone?.trim();
  const email = order.customer?.email?.trim();

  if (phone) {
    lines.push(phone);
  }
  if (email) {
    lines.push(email);
  }

  return lines;
}

type InvoiceShippingSource = Pick<
  Order,
  | "shippingName"
  | "shippingPhone"
  | "shippingAddress"
  | "shippingCity"
  | "shippingPostalCode"
>;

export function hasInvoiceShippingDetails(
  order: InvoiceShippingSource,
): boolean {
  return Boolean(
    order.shippingName?.trim() ||
      order.shippingPhone?.trim() ||
      order.shippingAddress?.trim() ||
      order.shippingCity?.trim() ||
      order.shippingPostalCode?.trim(),
  );
}

export function getInvoiceShippingLines(
  order: InvoiceShippingSource,
): string[] {
  const lines: string[] = [];

  if (order.shippingPhone?.trim()) {
    lines.push(order.shippingPhone.trim());
  }
  if (order.shippingAddress?.trim()) {
    lines.push(order.shippingAddress.trim());
  }

  const cityLine = [
    order.shippingCity?.trim(),
    order.shippingPostalCode?.trim(),
  ]
    .filter(Boolean)
    .join(", ");

  if (cityLine) {
    lines.push(cityLine);
  }

  return lines;
}

export function parseInvoiceAmount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function getInvoiceOutstandingBalance(
  order: Pick<Order, "totalAmount" | "amountPaid">,
): number {
  const balance =
    parseInvoiceAmount(order.totalAmount) -
    parseInvoiceAmount(order.amountPaid);

  return Math.max(0, Math.round((balance + Number.EPSILON) * 100) / 100);
}

/** Up to two letters for the invoice brand mark, e.g. `VendKit` -> `VK`. */
export function getBusinessInitials(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    return "VK";
  }

  const words = trimmed.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return `${words[0]?.charAt(0) ?? ""}${
      words[words.length - 1]?.charAt(0) ?? ""
    }`.toUpperCase();
  }

  const capitals = trimmed.match(/[A-Z]/g);
  if (capitals && capitals.length >= 2) {
    return capitals.slice(0, 2).join("");
  }

  return trimmed.slice(0, 2).toUpperCase();
}

export function buildInvoiceBusinessContactLine(
  business: Pick<InvoiceBusinessProfile, "phone" | "email" | "website">,
): string {
  return [business.phone, business.email, business.website]
    .filter(Boolean)
    .join("  |  ");
}

/** Safe, human-readable download name for the invoice PDF. */
export function buildInvoiceFileName(orderNumber: string): string {
  const safeOrderNumber =
    orderNumber
      .trim()
      .replace(/[^a-zA-Z0-9._-]+/g, "-")
      .replace(/^-+|-+$/g, "") || "order";

  return `invoice-${safeOrderNumber}.pdf`;
}

function toDate(value: string | Date): Date | null {
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function getCurrencyFormatter(currency: string): Intl.NumberFormat | null {
  const cached = currencyFormatterCache.get(currency);
  if (cached) {
    return cached;
  }

  try {
    const formatter = new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      currencyDisplay: "code",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    currencyFormatterCache.set(currency, formatter);
    return formatter;
  } catch {
    return null;
  }
}
