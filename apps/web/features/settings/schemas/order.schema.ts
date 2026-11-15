import { z } from "zod";

import type { OrderSettings, OrderUpdateInput } from "../settings.types";
import { optionalText, requiredText } from "./settings-schema.utils";

const DOCUMENT_PREFIX_PATTERN = /^[A-Z0-9][A-Z0-9._/-]*$/;

export const orderSettingsFormSchema = z.object({
  orderNumberPrefix: requiredText(20, "Prefix must be at most 20 characters")
    .transform((value) => value.toUpperCase())
    .refine(
      (value) => DOCUMENT_PREFIX_PATTERN.test(value),
      "Use letters, numbers, dots, underscores, slashes, or hyphens",
    ),
  automaticNumbering: z.boolean(),
  defaultStatus: z.enum(["PENDING", "CONFIRMED"]),
  defaultNotes: optionalText(2000, "Notes must be at most 2000 characters"),
  allowEditing: z.boolean(),
  requireCustomerInformation: z.boolean(),
});

export type OrderSettingsFormValues = z.input<typeof orderSettingsFormSchema>;
export type OrderSettingsFormPayload = z.output<typeof orderSettingsFormSchema>;

export function toOrderSettingsFormValues(
  settings: OrderSettings,
): OrderSettingsFormValues {
  return {
    orderNumberPrefix: settings.orderNumberPrefix,
    automaticNumbering: settings.automaticNumbering,
    defaultStatus: settings.defaultStatus,
    defaultNotes: settings.defaultNotes ?? "",
    allowEditing: settings.allowEditing,
    requireCustomerInformation: settings.requireCustomerInformation,
  };
}

export function toOrderUpdateInput(
  values: OrderSettingsFormPayload,
): OrderUpdateInput {
  return {
    orderNumberPrefix: values.orderNumberPrefix,
    automaticNumbering: values.automaticNumbering,
    defaultStatus: values.defaultStatus,
    defaultNotes: values.defaultNotes,
    allowEditing: values.allowEditing,
    requireCustomerInformation: values.requireCustomerInformation,
  };
}
