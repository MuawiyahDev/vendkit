import { z } from "zod";

import type { InvoiceSettings, InvoiceUpdateInput } from "../settings.types";
import {
  integerNumber,
  optionalText,
  requiredText,
} from "./settings-schema.utils";

const INVOICE_NUMBER_FORMAT_PATTERN =
  /^(?=.*\{sequence\})(?!.*\{(?!prefix\}|year\}|month\}|sequence\})).{1,100}$/;
const DOCUMENT_PREFIX_PATTERN = /^[A-Z0-9][A-Z0-9._/-]*$/;
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[\d\s\-().]{6,30}$/;

export const invoiceSettingsFormSchema = z
  .object({
    useBusinessProfile: z.boolean(),
    displayName: optionalText(
      200,
      "Display name must be at most 200 characters",
    ),
    logoImageId: z.string(),
    logoUrl: z.string(),
    email: optionalText(254, "Email must be at most 254 characters"),
    phone: optionalText(30, "Phone must be at most 30 characters"),
    addressLine1: optionalText(500, "Address must be at most 500 characters"),
    addressLine2: optionalText(500, "Address must be at most 500 characters"),
    city: optionalText(100, "City must be at most 100 characters"),
    state: optionalText(100, "State must be at most 100 characters"),
    postalCode: optionalText(20, "Postal code must be at most 20 characters"),
    country: optionalText(100, "Country must be at most 100 characters"),
    taxRegistrationNumber: optionalText(
      100,
      "Tax registration number must be at most 100 characters",
    ),
    additionalInfo: optionalText(
      2000,
      "Additional information must be at most 2000 characters",
    ),
    numberPrefix: requiredText(20, "Prefix must be at most 20 characters")
      .transform((value) => value.toUpperCase())
      .refine(
        (value) => DOCUMENT_PREFIX_PATTERN.test(value),
        "Use letters, numbers, dots, underscores, slashes, or hyphens",
      ),
    numberFormat: requiredText(
      100,
      "Number format must be at most 100 characters",
    ).refine(
      (value) => INVOICE_NUMBER_FORMAT_PATTERN.test(value),
      "Use {sequence} and only the tokens {prefix}, {year}, {month}, and {sequence}",
    ),
    yearBasedNumbering: z.boolean(),
    automaticNumbering: z.boolean(),
    startingSequence: integerNumber({ min: 1, max: 999_999_999 }),
    duePeriodDays: integerNumber({ min: 0, max: 3650 }),
    paymentTerms: optionalText(
      1000,
      "Payment terms must be at most 1000 characters",
    ),
    notes: optionalText(2000, "Notes must be at most 2000 characters"),
    footerText: optionalText(
      1000,
      "Footer text must be at most 1000 characters",
    ),
    currencyDisplayFormat: z.enum(["SYMBOL", "CODE", "SYMBOL_AND_CODE"]),
    showSku: z.boolean(),
    showTaxBreakdown: z.boolean(),
    showDiscountBreakdown: z.boolean(),
    defaultStatus: z.enum(["DRAFT", "ISSUED"]),
    allowEditingAfterIssue: z.boolean(),
    allowCancellation: z.boolean(),
  })
  .superRefine((values, context) => {
    if (
      values.yearBasedNumbering === false &&
      values.numberFormat.includes("{year}")
    ) {
      context.addIssue({
        code: "custom",
        path: ["numberFormat"],
        message:
          "Remove {year} or enable year-based numbering before using this format",
      });
    }

    if (!values.useBusinessProfile) {
      if (values.email !== null && !EMAIL_PATTERN.test(values.email)) {
        context.addIssue({
          code: "custom",
          path: ["email"],
          message: "Enter a valid email address",
        });
      }
      if (values.phone !== null && !PHONE_PATTERN.test(values.phone)) {
        context.addIssue({
          code: "custom",
          path: ["phone"],
          message: "Enter a valid phone number",
        });
      }
    }
  });

export type InvoiceSettingsFormValues = z.input<typeof invoiceSettingsFormSchema>;
export type InvoiceSettingsFormPayload = z.output<
  typeof invoiceSettingsFormSchema
>;

export function toInvoiceSettingsFormValues(
  invoice: InvoiceSettings,
): InvoiceSettingsFormValues {
  return {
    useBusinessProfile: invoice.useBusinessProfile,
    displayName: invoice.displayName ?? "",
    logoImageId: invoice.logo?.id ?? "",
    logoUrl: invoice.logo?.url ?? "",
    email: invoice.email ?? "",
    phone: invoice.phone ?? "",
    addressLine1: invoice.addressLine1 ?? "",
    addressLine2: invoice.addressLine2 ?? "",
    city: invoice.city ?? "",
    state: invoice.state ?? "",
    postalCode: invoice.postalCode ?? "",
    country: invoice.country ?? "",
    taxRegistrationNumber: invoice.taxRegistrationNumber ?? "",
    additionalInfo: invoice.additionalInfo ?? "",
    numberPrefix: invoice.numberPrefix,
    numberFormat: invoice.numberFormat,
    yearBasedNumbering: invoice.yearBasedNumbering,
    automaticNumbering: invoice.automaticNumbering,
    startingSequence: invoice.startingSequence,
    duePeriodDays: invoice.duePeriodDays,
    paymentTerms: invoice.paymentTerms ?? "",
    notes: invoice.notes ?? "",
    footerText: invoice.footerText ?? "",
    currencyDisplayFormat: invoice.currencyDisplayFormat,
    showSku: invoice.showSku,
    showTaxBreakdown: invoice.showTaxBreakdown,
    showDiscountBreakdown: invoice.showDiscountBreakdown,
    defaultStatus: invoice.defaultStatus,
    allowEditingAfterIssue: invoice.allowEditingAfterIssue,
    allowCancellation: invoice.allowCancellation,
  };
}

export function toInvoiceUpdateInput(
  values: InvoiceSettingsFormPayload,
): InvoiceUpdateInput {
  const input: InvoiceUpdateInput = {
    useBusinessProfile: values.useBusinessProfile,
    displayName: values.displayName,
    numberPrefix: values.numberPrefix,
    numberFormat: values.numberFormat,
    yearBasedNumbering: values.yearBasedNumbering,
    automaticNumbering: values.automaticNumbering,
    startingSequence: values.startingSequence,
    duePeriodDays: values.duePeriodDays,
    paymentTerms: values.paymentTerms,
    notes: values.notes,
    footerText: values.footerText,
    currencyDisplayFormat: values.currencyDisplayFormat,
    showSku: values.showSku,
    showTaxBreakdown: values.showTaxBreakdown,
    showDiscountBreakdown: values.showDiscountBreakdown,
    defaultStatus: values.defaultStatus,
    allowEditingAfterIssue: values.allowEditingAfterIssue,
    allowCancellation: values.allowCancellation,
  };

  if (!values.useBusinessProfile) {
    input.logoImageId = values.logoImageId || null;
    input.email = values.email;
    input.phone = values.phone;
    input.addressLine1 = values.addressLine1;
    input.addressLine2 = values.addressLine2;
    input.city = values.city;
    input.state = values.state;
    input.postalCode = values.postalCode;
    input.country = values.country;
    input.taxRegistrationNumber = values.taxRegistrationNumber;
    input.additionalInfo = values.additionalInfo;
  }

  return input;
}
