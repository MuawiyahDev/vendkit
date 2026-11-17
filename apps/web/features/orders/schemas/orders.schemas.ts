import { z } from "zod";

import {
  normalizePhone,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from "@/features/customers/utils/customers.utils";

import {
  CREATABLE_PAYMENT_STATUSES,
  PAYMENT_METHODS,
} from "../api/orders-api";

export const ORDER_NOTE_MAX_LENGTH = 2000;
export const CANCELLATION_REASON_MAX_LENGTH = 500;
export const PAYMENT_REFERENCE_MAX_LENGTH = 100;
export const MAX_ORDER_ITEM_LINES = 100;
export const MAX_ORDER_ITEM_QUANTITY = 100000;
export const MAX_ORDER_AMOUNT_DECIMAL_PLACES = 2;
export const SHIPPING_NAME_MAX_LENGTH = 200;

const AMOUNT_PATTERN = new RegExp(
  `^\\d{1,12}(\\.\\d{1,${MAX_ORDER_AMOUNT_DECIMAL_PLACES}})?$`,
);

const AMOUNT_INVALID_MESSAGE = "Enter an amount with at most 2 decimals";

function amountField() {
  return z
    .string()
    .trim()
    .refine(
      (value) => value === "" || AMOUNT_PATTERN.test(value),
      AMOUNT_INVALID_MESSAGE,
    )
    .transform((value) => (value === "" ? 0 : Number(value)));
}

function optionalText(maxLength: number, requiredMessage?: string) {
  const field = z.string().trim();
  const withMax =
    requiredMessage !== undefined
      ? field.min(1, requiredMessage).max(
          maxLength,
          `Must be at most ${maxLength} characters`,
        )
      : field.max(
          maxLength,
          `Must be at most ${maxLength} characters`,
        );
  return withMax.transform((value) => (value === "" ? null : value));
}

function optionalPhone() {
  return z
    .string()
    .trim()
    .max(
      SHIPPING_NAME_MAX_LENGTH,
      `Phone must be at most ${SHIPPING_NAME_MAX_LENGTH} characters`,
    )
    .transform((value) => (value === "" ? null : normalizePhone(value)))
    .refine(
      (value) => value === null || PHONE_PATTERN.test(value),
      PHONE_INVALID_MESSAGE,
    );
}

const orderItemFieldSchema = z.object({
  productId: z.string().min(1, "Select a product"),
  quantity: z
    .number("Enter a quantity")
    .int("Quantity must be a whole number")
    .min(1, "Quantity must be at least 1")
    .max(
      MAX_ORDER_ITEM_QUANTITY,
      `Quantity cannot exceed ${MAX_ORDER_ITEM_QUANTITY}`,
    ),
});

export const orderCreateSchema = z.object({
  customerId: z.string().optional(),
  items: z
    .array(orderItemFieldSchema)
    .min(1, "Add at least one product to the order")
    .max(
      MAX_ORDER_ITEM_LINES,
      `An order can contain at most ${MAX_ORDER_ITEM_LINES} lines`,
    ),
  discountAmount: amountField(),
  shippingFee: amountField(),
  taxAmount: amountField(),
  shippingName: optionalText(SHIPPING_NAME_MAX_LENGTH),
  shippingPhone: optionalPhone(),
  shippingAddress: optionalText(500),
  shippingCity: optionalText(100),
  shippingPostalCode: optionalText(20),
  customerNote: optionalText(ORDER_NOTE_MAX_LENGTH),
  internalNote: optionalText(ORDER_NOTE_MAX_LENGTH),
});

export const orderUpdateSchema = z.object({
  customerId: z.string().optional(),
  items: z
    .array(orderItemFieldSchema)
    .min(1, "Add at least one product to the order")
    .max(
      MAX_ORDER_ITEM_LINES,
      `An order can contain at most ${MAX_ORDER_ITEM_LINES} lines`,
    ),
  shippingName: optionalText(SHIPPING_NAME_MAX_LENGTH),
  shippingPhone: optionalPhone(),
  shippingAddress: optionalText(500),
  shippingCity: optionalText(100),
  shippingPostalCode: optionalText(20),
  customerNote: optionalText(ORDER_NOTE_MAX_LENGTH),
  internalNote: optionalText(ORDER_NOTE_MAX_LENGTH),
});

export const orderCancelSchema = z.object({
  cancellationReason: optionalText(CANCELLATION_REASON_MAX_LENGTH),
});

export const orderPaymentFormSchema = z.object({
  amount: z
    .string()
    .trim()
    .min(1, "Enter the payment amount")
    .refine((value) => AMOUNT_PATTERN.test(value), AMOUNT_INVALID_MESSAGE)
    .transform(Number)
    .refine((value) => value > 0, "Payment amount must be greater than zero"),
  method: z.enum(PAYMENT_METHODS, "Select a payment method"),
  status: z.enum(CREATABLE_PAYMENT_STATUSES, "Select a payment status"),
  reference: optionalText(PAYMENT_REFERENCE_MAX_LENGTH),
  note: optionalText(ORDER_NOTE_MAX_LENGTH),
  paidAt: z
    .string()
    .trim()
    .refine(
      (value) => value === "" || !Number.isNaN(Date.parse(value)),
      "Enter a valid date",
    )
    .transform((value) =>
      value === "" ? null : new Date(value).toISOString(),
    ),
});

export type OrderItemFieldValue = z.infer<typeof orderItemFieldSchema>;

export type OrderCreateFormValues = z.input<typeof orderCreateSchema>;
export type OrderCreateFormPayload = z.output<typeof orderCreateSchema>;

export type OrderUpdateFormValues = z.input<typeof orderUpdateSchema>;
export type OrderUpdateFormPayload = z.output<typeof orderUpdateSchema>;

export type OrderCancelFormValues = z.input<typeof orderCancelSchema>;
export type OrderCancelFormPayload = z.output<typeof orderCancelSchema>;

export type OrderPaymentFormValues = z.input<typeof orderPaymentFormSchema>;
export type OrderPaymentFormPayload = z.output<typeof orderPaymentFormSchema>;
