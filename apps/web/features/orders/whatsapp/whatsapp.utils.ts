import { parsePhoneNumberFromString } from "libphonenumber-js";

import { guessBrowserCountry, toSupportedCountry } from "@/lib/phone";

import type {
  WhatsAppOrder,
  WhatsAppPhone,
  WhatsAppPhoneResult,
  WhatsAppSavedRecipient,
} from "./whatsapp.types";

export { guessBrowserCountry, toSupportedCountry };

const NON_DIGITS = /\D/g;
const INTERNATIONAL_DIALING_PREFIX = "00";
const WHATSAPP_URL = "https://wa.me";

/**
 * Strips spaces, brackets, hyphens and dots while preserving an
 * international prefix (`+` or `00`).
 */
export function sanitizePhoneInput(value: string): string {
  const digits = value.replace(NON_DIGITS, "");
  if (!digits) {
    return "";
  }

  const trimmed = value.trim();
  if (trimmed.startsWith("+")) {
    return `+${digits}`;
  }
  if (trimmed.startsWith(INTERNATIONAL_DIALING_PREFIX)) {
    return `+${digits.slice(INTERNATIONAL_DIALING_PREFIX.length)}`;
  }

  return digits;
}

/**
 * Parses and validates a recipient number. Numbers without an international
 * prefix are interpreted using the selected/default country, so local formats
 * such as `01712-345678` work without duplicating the calling code.
 */
export function parseWhatsAppPhone(
  value: string,
  defaultCountry?: string | null,
): WhatsAppPhoneResult {
  const sanitized = sanitizePhoneInput(value);
  if (!sanitized) {
    return { ok: false, error: "empty" };
  }

  const country = toSupportedCountry(defaultCountry);
  const isInternational = sanitized.startsWith("+");

  if (!isInternational && !country) {
    return { ok: false, error: "missing-country" };
  }

  const parsed = country
    ? parsePhoneNumberFromString(sanitized, country)
    : parsePhoneNumberFromString(sanitized);

  if (!parsed?.isValid()) {
    return { ok: false, error: "invalid" };
  }

  const phone: WhatsAppPhone = {
    e164: parsed.number,
    whatsappNumber: parsed.number.replace(NON_DIGITS, ""),
    formatted: parsed.formatInternational(),
    country: parsed.country ?? null,
  };

  return { ok: true, phone };
}

/**
 * Builds the official click-to-chat URL. The phone path never contains `+`
 * and the message is URL-encoded.
 */
export function buildWhatsAppUrl(
  phone: Pick<WhatsAppPhone, "whatsappNumber"> | string,
  message: string,
): string {
  const number =
    typeof phone === "string"
      ? phone.replace(NON_DIGITS, "")
      : phone.whatsappNumber;

  return `${WHATSAPP_URL}/${number}?text=${encodeURIComponent(message)}`;
}

export function getOrderGreetingName(order: WhatsAppOrder): string {
  return order.customer?.name.trim() || order.shippingName?.trim() || "there";
}

export function getOrderContactName(order: WhatsAppOrder): string {
  return (
    order.customer?.name.trim() ||
    order.shippingName?.trim() ||
    "Walk-in customer"
  );
}

/**
 * Saved numbers already present on the order: the customer's profile number
 * and, when distinct, the shipping contact number. Nothing is written back to
 * either record.
 */
export function getOrderSavedRecipients(
  order: WhatsAppOrder,
  defaultCountry?: string | null,
): WhatsAppSavedRecipient[] {
  const candidates: Omit<WhatsAppSavedRecipient, "result">[] = [];

  if (order.customer?.phone) {
    candidates.push({
      id: "customer",
      label: "Customer profile",
      name: order.customer.name,
      phone: order.customer.phone,
    });
  }

  if (order.shippingPhone) {
    candidates.push({
      id: "shipping",
      label: "Order contact",
      name:
        order.shippingName?.trim() ||
        order.customer?.name.trim() ||
        "Walk-in customer",
      phone: order.shippingPhone,
    });
  }

  const seen = new Set<string>();
  const recipients: WhatsAppSavedRecipient[] = [];

  for (const candidate of candidates) {
    const result = parseWhatsAppPhone(candidate.phone, defaultCountry);
    const dedupeKey = result.ok
      ? result.phone.e164
      : sanitizePhoneInput(candidate.phone) ||
        `${candidate.id}:${candidate.phone}`;

    if (seen.has(dedupeKey)) {
      continue;
    }

    seen.add(dedupeKey);
    recipients.push({ ...candidate, result });
  }

  return recipients;
}

/** True when at least one saved order number can open a valid chat. */
export function canMessageOrderOnWhatsApp(
  order: WhatsAppOrder,
  defaultCountry?: string | null,
): boolean {
  return getOrderSavedRecipients(order, defaultCountry).some(
    (recipient) => recipient.result.ok,
  );
}
