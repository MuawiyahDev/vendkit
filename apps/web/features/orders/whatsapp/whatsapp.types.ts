import type { OrderBase } from "../api/orders-api";

/** A saved number the order already carries, or a manually entered one. */
export type WhatsAppRecipientSelection = "customer" | "shipping" | "custom";

export type WhatsAppTemplateId =
  "order-confirmation" | "status-update" | "payment-reminder" | "order-ready";

export type WhatsAppPhoneError = "empty" | "missing-country" | "invalid";

export interface WhatsAppPhone {
  /** E.164 representation, e.g. `+8801712345678`. */
  e164: string;
  /** Digits only, ready for the `wa.me` path. */
  whatsappNumber: string;
  /** Human-friendly international formatting. */
  formatted: string;
  /** ISO region detected by libphonenumber, when known. */
  country: string | null;
}

export type WhatsAppPhoneResult =
  { ok: true; phone: WhatsAppPhone } | { ok: false; error: WhatsAppPhoneError };

export interface WhatsAppSavedRecipient {
  id: Exclude<WhatsAppRecipientSelection, "custom">;
  /** Short source label shown above the number. */
  label: string;
  /** Customer or shipping recipient name. */
  name: string;
  /** Number exactly as stored on the order/customer. */
  phone: string;
  result: WhatsAppPhoneResult;
}

export interface WhatsAppTemplate {
  id: WhatsAppTemplateId;
  label: string;
  description: string;
}

/** Fields every WhatsApp flow needs; both list and detail orders satisfy it. */
export type WhatsAppOrder = Pick<
  OrderBase,
  | "orderNumber"
  | "customer"
  | "status"
  | "currency"
  | "totalAmount"
  | "amountPaid"
  | "shippingName"
  | "shippingPhone"
>;
