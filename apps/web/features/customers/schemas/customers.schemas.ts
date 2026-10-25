import { z } from "zod";

import {
  normalizePhone,
  PHONE_INVALID_MESSAGE,
  PHONE_PATTERN,
} from "@/features/customers/utils/customers.utils";

export const CUSTOMER_NAME_MAX_LENGTH = 200;
export const CUSTOMER_EMAIL_MAX_LENGTH = 254;
export const CUSTOMER_ADDRESS_MAX_LENGTH = 500;
export const CUSTOMER_CITY_MAX_LENGTH = 100;
export const CUSTOMER_POSTAL_CODE_MAX_LENGTH = 20;
export const CUSTOMER_NOTES_MAX_LENGTH = 2000;

function emptyToNull(value: string): string | null {
  return value === "" ? null : value;
}

/**
 * Mirrors the NestJS CreateCustomerDto/UpdateCustomerDto rules:
 * required trimmed name (max 200), normalized phone matching
 * `/^\+?\d{6,15}$/`, and optional fields where empty strings clear the value.
 */
export const customerFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      CUSTOMER_NAME_MAX_LENGTH,
      `Name must be at most ${CUSTOMER_NAME_MAX_LENGTH} characters`,
    ),
  phone: z
    .string()
    .trim()
    .min(1, "Phone number is required")
    .transform(normalizePhone)
    .refine((phone) => PHONE_PATTERN.test(phone), PHONE_INVALID_MESSAGE),
  email: z
    .union([
      z.literal(""),
      z.email("Enter a valid email address").max(
        CUSTOMER_EMAIL_MAX_LENGTH,
        `Email must be at most ${CUSTOMER_EMAIL_MAX_LENGTH} characters`,
      ),
    ])
    .transform(emptyToNull),
  address: z
    .string()
    .trim()
    .max(
      CUSTOMER_ADDRESS_MAX_LENGTH,
      `Address must be at most ${CUSTOMER_ADDRESS_MAX_LENGTH} characters`,
    )
    .transform(emptyToNull),
  city: z
    .string()
    .trim()
    .max(
      CUSTOMER_CITY_MAX_LENGTH,
      `City must be at most ${CUSTOMER_CITY_MAX_LENGTH} characters`,
    )
    .transform(emptyToNull),
  postalCode: z
    .string()
    .trim()
    .max(
      CUSTOMER_POSTAL_CODE_MAX_LENGTH,
      `Postal code must be at most ${CUSTOMER_POSTAL_CODE_MAX_LENGTH} characters`,
    )
    .transform(emptyToNull),
  notes: z
    .string()
    .trim()
    .max(
      CUSTOMER_NOTES_MAX_LENGTH,
      `Notes must be at most ${CUSTOMER_NOTES_MAX_LENGTH} characters`,
    )
    .transform(emptyToNull),
});

export type CustomerFormValues = z.input<typeof customerFormSchema>;
export type CustomerFormPayload = z.output<typeof customerFormSchema>;
