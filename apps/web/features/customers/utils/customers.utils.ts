/**
 * Client-side mirror of the NestJS phone normalization used by the customers
 * module (`apps/api/src/common/utils/phone.util.ts`): strips separators,
 * converts the `00` international prefix to `+`, and keeps an optional `+`.
 */
export const PHONE_PATTERN = /^\+?\d{6,15}$/;

export const PHONE_INVALID_MESSAGE =
  "Phone must contain between 6 and 15 digits, optionally prefixed with +";

export function normalizePhone(value: string): string {
  let phone = value.replace(/[\s\-().]/g, "");
  if (phone.startsWith("00")) {
    phone = `+${phone.slice(2)}`;
  }
  return phone;
}

export { formatDate, formatDateTime } from "@/lib/format";

export function formatCurrency(amount: string, currency: string): string {
  const value = Number(amount);
  if (!Number.isFinite(value)) {
    return `${currency} ${amount}`;
  }
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
    }).format(value);
  } catch {
    return `${currency} ${value.toFixed(2)}`;
  }
}

/** `PARTIALLY_PAID` → `Partially Paid`. */
export function formatStatusLabel(status: string): string {
  return status
    .toLowerCase()
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

export function formatOptionalValue(value: string | null): string {
  return value && value.trim().length > 0 ? value : "—";
}

/** Returns up to two initials for a customer or account display name. */
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

/** A customer counts as new during their first 30 days in the directory. */
export function isNewCustomer(createdAt: string, windowInDays = 30): boolean {
  const created = new Date(createdAt).getTime();
  if (Number.isNaN(created)) {
    return false;
  }
  const windowMs = windowInDays * 24 * 60 * 60 * 1000;
  return Date.now() - created <= windowMs;
}
