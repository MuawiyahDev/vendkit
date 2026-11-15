import { z } from "zod";

import type { TaxSettings, TaxUpdateInput } from "../settings.types";
import {
  decimalNumber,
  optionalText,
  requiredText,
} from "./settings-schema.utils";

export const taxSettingsFormSchema = z.object({
  enabled: z.boolean(),
  defaultName: requiredText(100, "Tax name must be at most 100 characters"),
  defaultRate: decimalNumber({ min: 0, max: 100, maxDecimalPlaces: 2 }),
  taxIdentificationNumber: optionalText(
    100,
    "Tax identification number must be at most 100 characters",
  ),
  pricingMode: z.enum(["INCLUSIVE", "EXCLUSIVE"]),
  showBreakdownOnInvoice: z.boolean(),
});

export type TaxSettingsFormValues = z.input<typeof taxSettingsFormSchema>;
export type TaxSettingsFormPayload = z.output<typeof taxSettingsFormSchema>;

export function toTaxSettingsFormValues(
  settings: TaxSettings,
): TaxSettingsFormValues {
  return {
    enabled: settings.enabled,
    defaultName: settings.defaultName,
    defaultRate: Number(settings.defaultRate),
    taxIdentificationNumber: settings.taxIdentificationNumber ?? "",
    pricingMode: settings.pricingMode,
    showBreakdownOnInvoice: settings.showBreakdownOnInvoice,
  };
}

export function toTaxUpdateInput(
  values: TaxSettingsFormPayload,
): TaxUpdateInput {
  return {
    enabled: values.enabled,
    defaultName: values.defaultName,
    defaultRate: values.defaultRate,
    taxIdentificationNumber: values.taxIdentificationNumber,
    pricingMode: values.pricingMode,
    showBreakdownOnInvoice: values.showBreakdownOnInvoice,
  };
}
