import { z } from "zod";

import type { PaymentSettings, PaymentUpdateInput } from "../settings.types";
import { optionalText } from "./settings-schema.utils";

const PAYMENT_METHOD_VALUES = [
  "CASH",
  "BANK_TRANSFER",
  "MOBILE_FINANCIAL_SERVICE",
  "CARD",
  "OTHER",
] as const;

export const paymentSettingsFormSchema = z
  .object({
    enabledMethods: z
      .array(z.enum(PAYMENT_METHOD_VALUES))
      .min(1, "Enable at least one payment method"),
    defaultMethod: z.enum(PAYMENT_METHOD_VALUES),
    bankAccountName: optionalText(
      200,
      "Account name must be at most 200 characters",
    ),
    bankName: optionalText(200, "Bank name must be at most 200 characters"),
    accountNumber: optionalText(
      100,
      "Account number must be at most 100 characters",
    ),
    branchName: optionalText(200, "Branch name must be at most 200 characters"),
    routingNumber: optionalText(
      100,
      "Routing number must be at most 100 characters",
    ),
    paymentInstructions: optionalText(
      2000,
      "Payment instructions must be at most 2000 characters",
    ),
    defaultPaymentTerms: optionalText(
      1000,
      "Payment terms must be at most 1000 characters",
    ),
  })
  .superRefine((values, context) => {
    if (!values.enabledMethods.includes(values.defaultMethod)) {
      context.addIssue({
        code: "custom",
        path: ["defaultMethod"],
        message: "Choose an enabled payment method as the default",
      });
    }
  });

export type PaymentSettingsFormValues = z.input<
  typeof paymentSettingsFormSchema
>;
export type PaymentSettingsFormPayload = z.output<
  typeof paymentSettingsFormSchema
>;

export function toPaymentSettingsFormValues(
  settings: PaymentSettings,
): PaymentSettingsFormValues {
  return {
    enabledMethods: [...settings.enabledMethods],
    defaultMethod: settings.defaultMethod,
    bankAccountName: settings.bankAccountName ?? "",
    bankName: settings.bankName ?? "",
    accountNumber: settings.accountNumber ?? "",
    branchName: settings.branchName ?? "",
    routingNumber: settings.routingNumber ?? "",
    paymentInstructions: settings.paymentInstructions ?? "",
    defaultPaymentTerms: settings.defaultPaymentTerms ?? "",
  };
}

export function toPaymentUpdateInput(
  values: PaymentSettingsFormPayload,
): PaymentUpdateInput {
  return {
    enabledMethods: values.enabledMethods,
    defaultMethod: values.defaultMethod,
    bankAccountName: values.bankAccountName,
    bankName: values.bankName,
    accountNumber: values.accountNumber,
    branchName: values.branchName,
    routingNumber: values.routingNumber,
    paymentInstructions: values.paymentInstructions,
    defaultPaymentTerms: values.defaultPaymentTerms,
  };
}
