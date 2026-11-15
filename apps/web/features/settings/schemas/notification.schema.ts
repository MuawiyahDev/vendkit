import { z } from "zod";

import type {
  NotificationSettings,
  NotificationUpdateInput,
} from "../settings.types";
import { optionalEmail, requiredText } from "./settings-schema.utils";

export const notificationSettingsFormSchema = z.object({
  businessNotificationEmail: optionalEmail(),
  orderConfirmationEnabled: z.boolean(),
  paymentEnabled: z.boolean(),
  invoiceEnabled: z.boolean(),
  senderName: requiredText(200, "Sender name must be at most 200 characters"),
  replyToEmail: optionalEmail(),
});

export type NotificationSettingsFormValues = z.input<
  typeof notificationSettingsFormSchema
>;
export type NotificationSettingsFormPayload = z.output<
  typeof notificationSettingsFormSchema
>;

export function toNotificationSettingsFormValues(
  settings: NotificationSettings,
): NotificationSettingsFormValues {
  return {
    businessNotificationEmail: settings.businessNotificationEmail ?? "",
    orderConfirmationEnabled: settings.orderConfirmationEnabled,
    paymentEnabled: settings.paymentEnabled,
    invoiceEnabled: settings.invoiceEnabled,
    senderName: settings.senderName,
    replyToEmail: settings.replyToEmail ?? "",
  };
}

export function toNotificationUpdateInput(
  values: NotificationSettingsFormPayload,
): NotificationUpdateInput {
  return {
    businessNotificationEmail: values.businessNotificationEmail,
    orderConfirmationEnabled: values.orderConfirmationEnabled,
    paymentEnabled: values.paymentEnabled,
    invoiceEnabled: values.invoiceEnabled,
    senderName: values.senderName,
    replyToEmail: values.replyToEmail,
  };
}
