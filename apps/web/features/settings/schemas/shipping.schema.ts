import { z } from "zod";

import type { ShippingSettings, ShippingUpdateInput } from "../settings.types";
import {
  decimalNumber,
  nullableDecimalNumber,
  optionalText,
} from "./settings-schema.utils";

export const shippingSettingsFormSchema = z.object({
  enabled: z.boolean(),
  defaultCharge: decimalNumber({ min: 0, max: 9_999_999_999.99 }),
  freeShippingThreshold: nullableDecimalNumber({
    min: 0,
    max: 9_999_999_999.99,
  }),
  deliveryInstructions: optionalText(
    2000,
    "Delivery instructions must be at most 2000 characters",
  ),
  defaultDeliveryMethod: optionalText(
    100,
    "Delivery method must be at most 100 characters",
  ),
});

export type ShippingSettingsFormValues = z.input<
  typeof shippingSettingsFormSchema
>;
export type ShippingSettingsFormPayload = z.output<
  typeof shippingSettingsFormSchema
>;

export function toShippingSettingsFormValues(
  settings: ShippingSettings,
): ShippingSettingsFormValues {
  return {
    enabled: settings.enabled,
    defaultCharge: Number(settings.defaultCharge),
    freeShippingThreshold:
      settings.freeShippingThreshold === null
        ? null
        : Number(settings.freeShippingThreshold),
    deliveryInstructions: settings.deliveryInstructions ?? "",
    defaultDeliveryMethod: settings.defaultDeliveryMethod ?? "",
  };
}

export function toShippingUpdateInput(
  values: ShippingSettingsFormPayload,
): ShippingUpdateInput {
  return {
    enabled: values.enabled,
    defaultCharge: values.defaultCharge,
    freeShippingThreshold: values.freeShippingThreshold,
    deliveryInstructions: values.deliveryInstructions,
    defaultDeliveryMethod: values.defaultDeliveryMethod,
  };
}
