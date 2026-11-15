import { z } from "zod";

import type { RegionalSettings, RegionalUpdateInput } from "../settings.types";
import { requiredText } from "./settings-schema.utils";

const DATE_FORMATS = [
  "DD/MM/YYYY",
  "MM/DD/YYYY",
  "YYYY-MM-DD",
  "DD MMM YYYY",
  "D MMMM YYYY",
] as const;

const TIME_FORMATS = ["HH:mm", "HH:mm:ss", "hh:mm A", "hh:mm:ss A"] as const;

export const regionalSettingsFormSchema = z
  .object({
    currency: z
      .string()
      .trim()
      .length(3, "Use a 3-letter ISO currency code")
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z]{3}$/.test(value), "Enter a valid currency code"),
    currencySymbol: requiredText(8, "Symbol must be at most 8 characters"),
    currencyPosition: z.enum(["BEFORE", "AFTER"]),
    decimalPrecision: z
      .number("Enter a valid number")
      .int("Must be a whole number")
      .min(0, "Must be 0 or more")
      .max(6, "Must be 6 or less"),
    thousandSeparator: z
      .string()
      .max(3, "Use at most 3 characters")
      .refine(
        (value) => value === "" || !/[\dA-Za-z]/.test(value),
        "Use punctuation characters only",
      ),
    decimalSeparator: z
      .string()
      .max(3, "Use at most 3 characters")
      .refine(
        (value) => value === "" || !/[\dA-Za-z]/.test(value),
        "Use punctuation characters only",
      ),
    defaultCountry: z
      .string()
      .trim()
      .length(2, "Use a 2-letter country code")
      .transform((value) => value.toUpperCase())
      .refine((value) => /^[A-Z]{2}$/.test(value), "Enter a valid country code"),
    timezone: requiredText(100, "Timezone must be at most 100 characters"),
    dateFormat: z
      .string()
      .refine(
        (value) => (DATE_FORMATS as readonly string[]).includes(value),
        "Choose a supported date format",
      ),
    timeFormat: z
      .string()
      .refine(
        (value) => (TIME_FORMATS as readonly string[]).includes(value),
        "Choose a supported time format",
      ),
    language: requiredText(10, "Language must be at most 10 characters"),
  })
  .superRefine((values, context) => {
    if (values.decimalSeparator === values.thousandSeparator) {
      context.addIssue({
        code: "custom",
        path: ["decimalSeparator"],
        message: "Decimal and thousand separators must be different",
      });
    }

    if (values.decimalPrecision > 0 && values.decimalSeparator === "") {
      context.addIssue({
        code: "custom",
        path: ["decimalSeparator"],
        message: "A decimal separator is required when precision is above zero",
      });
    }
  });

export type RegionalSettingsFormValues = z.input<
  typeof regionalSettingsFormSchema
>;
export type RegionalSettingsFormPayload = z.output<
  typeof regionalSettingsFormSchema
>;

export function toRegionalSettingsFormValues(
  settings: RegionalSettings,
): RegionalSettingsFormValues {
  return {
    currency: settings.currency,
    currencySymbol: settings.currencySymbol,
    currencyPosition: settings.currencyPosition,
    decimalPrecision: settings.decimalPrecision,
    thousandSeparator: settings.thousandSeparator,
    decimalSeparator: settings.decimalSeparator,
    defaultCountry: settings.defaultCountry,
    timezone: settings.timezone,
    dateFormat: settings.dateFormat,
    timeFormat: settings.timeFormat,
    language: settings.language,
  };
}

export function toRegionalUpdateInput(
  values: RegionalSettingsFormPayload,
): RegionalUpdateInput {
  return {
    currency: values.currency,
    currencySymbol: values.currencySymbol,
    currencyPosition: values.currencyPosition,
    decimalPrecision: values.decimalPrecision,
    thousandSeparator: values.thousandSeparator,
    decimalSeparator: values.decimalSeparator,
    defaultCountry: values.defaultCountry,
    timezone: values.timezone,
    dateFormat: values.dateFormat,
    timeFormat: values.timeFormat,
    language: values.language,
  };
}
