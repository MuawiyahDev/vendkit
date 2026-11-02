import type {
  OrderBase,
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
} from "../api/orders-api";

export { formatDate, formatDateTime } from "@/lib/format";

/** `PARTIALLY_PAID` → `Partially Paid`. */
export function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

const currencyFormatterCache = new Map<string, Intl.NumberFormat>();

/**
 * Formats a decimal amount with the order's currency. Falls back to a plain
 * `CODE amount` string when the currency code is not a valid ISO 4217 value.
 */
export function formatCurrency(amount: string | number, currency: string): string {
  const value = typeof amount === "number" ? amount : Number(amount);
  if (!Number.isFinite(value)) {
    return `${currency} ${amount}`;
  }

  let formatter = currencyFormatterCache.get(currency);
  if (!formatter) {
    try {
      formatter = new Intl.NumberFormat(undefined, {
        style: "currency",
        currency,
      });
    } catch {
      return `${currency} ${value.toFixed(2)}`;
    }
    currencyFormatterCache.set(currency, formatter);
  }

  return formatter.format(value);
}

export function formatPaymentMethod(method: PaymentMethod): string {
  return formatStatusLabel(method);
}

export function formatOptionalValue(value: string | null): string {
  return value && value.trim().length > 0 ? value : "—";
}

/**
 * Display name for whoever an order belongs to: the saved customer when
 * attached, the walk-in guest snapshot otherwise.
 */
export function orderCustomerName(order: Pick<OrderBase, "customer">): string {
  return order.customer?.name ?? "Unknown";
}

export function orderCustomerPhone(order: Pick<OrderBase, "customer">): string | null {
  return order.customer?.phone ?? null;
}

/**
 * Client-side mirror of the backend `ORDER_STATUS_TRANSITIONS` table
 * (`apps/api/src/orders/orders.constants.ts`). The backend remains the
 * source of truth; this drives which actions the UI offers.
 */
export const ORDER_STATUS_TRANSITIONS: Record<
  OrderStatus,
  readonly OrderStatus[]
> = {
  PENDING: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["PROCESSING", "CANCELLED"],
  PROCESSING: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "CANCELLED"],
  DELIVERED: [],
  CANCELLED: [],
};

/** Client-side mirror of the backend `PAYMENT_STATUS_TRANSITIONS` table. */
export const PAYMENT_STATUS_TRANSITIONS: Record<
  OrderPaymentStatus,
  readonly OrderPaymentStatus[]
> = {
  PENDING: ["COMPLETED", "FAILED"],
  FAILED: ["PENDING", "COMPLETED"],
  COMPLETED: ["FAILED"],
};

/**
 * The next fulfilled status an order can advance to (i.e. the only
 * non-cancellation transition), or null when the status is terminal.
 */
export function nextOrderStatus(status: OrderStatus): OrderStatus | null {
  return (
    ORDER_STATUS_TRANSITIONS[status].find((value) => value !== "CANCELLED") ??
    null
  );
}

export function canCancelOrder(status: OrderStatus): boolean {
  return ORDER_STATUS_TRANSITIONS[status].includes("CANCELLED");
}

/** Only pending or cancelled orders may be deleted (payments checked by the backend). */
export function canDeleteOrder(status: OrderStatus): boolean {
  return status === "PENDING" || status === "CANCELLED";
}

export function allowedPaymentStatusTransitions(
  status: OrderPaymentStatus,
): readonly OrderPaymentStatus[] {
  return PAYMENT_STATUS_TRANSITIONS[status];
}

/** Parses a decimal string returned by the API into a finite number. */
export function parseAmount(value: string | number): number {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Rounds to the two decimal places the money columns are stored with. */
export function roundToTwoDecimals(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

/** Preview subtotal for a set of order lines. The backend recomputes it. */
export function sumLineTotals(
  items: { unitPrice: string; quantity: number }[],
): number {
  return roundToTwoDecimals(
    items.reduce(
      (sum, item) => sum + parseAmount(item.unitPrice) * item.quantity,
      0,
    ),
  );
}

/** Preview grand total: subtotal − discount + shipping + tax. */
export function computeTotal(
  subtotal: number,
  discountAmount: number,
  shippingFee: number,
  taxAmount: number,
): number {
  return roundToTwoDecimals(subtotal - discountAmount + shippingFee + taxAmount);
}

/** Amount still owed on an order, floored at zero. */
export function outstandingBalance(order: Pick<OrderBase, "totalAmount" | "amountPaid">): number {
  return roundToTwoDecimals(
    Math.max(0, parseAmount(order.totalAmount) - parseAmount(order.amountPaid)),
  );
}

/** `1250` → `"1250"` input representation for decimal form fields. */
export function toAmountInput(value: string | number): string {
  const parsed = parseAmount(value);
  return parsed === 0 ? "0" : String(parsed);
}

/** Returns up to two initials for a customer display name. */
export function getInitials(name: string): string {
  const parts = name.split(/\s+/).filter(Boolean);
  if (parts.length === 0) {
    return "?";
  }
  if (parts.length === 1) {
    return (parts[0] ?? "").slice(0, 2).toUpperCase();
  }
  return `${(parts[0] ?? "").charAt(0)}${(parts[parts.length - 1] ?? "").charAt(0)}`.toUpperCase();
}

/** Short item label used when summarizing an order ("3 items", "1 item"). */
export function formatItemCount(count: number): string {
  return `${count} ${count === 1 ? "item" : "items"}`;
}
