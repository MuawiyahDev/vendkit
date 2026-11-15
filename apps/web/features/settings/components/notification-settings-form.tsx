"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Bell, Mail } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  notificationSettingsFormSchema,
  toNotificationSettingsFormValues,
  toNotificationUpdateInput,
  type NotificationSettingsFormPayload,
  type NotificationSettingsFormValues,
} from "../schemas/notification.schema";
import type { NotificationSettings } from "../settings.types";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";

const FORM_ID = "settings-notification-form";

interface NotificationSettingsFormProps {
  settings: NotificationSettings;
  readOnly: boolean;
  onSaved: (settings: NotificationSettings) => void;
}

export function NotificationSettingsForm({
  settings,
  readOnly,
  onSaved,
}: NotificationSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"notification">({
    category: "notification",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<
    NotificationSettingsFormValues,
    unknown,
    NotificationSettingsFormPayload
  >({
    resolver: zodResolver(notificationSettingsFormSchema),
    defaultValues: toNotificationSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toNotificationSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as NotificationSettingsFormValues;

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toNotificationUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toNotificationSettingsFormValues(restored));
    }
  }

  const enabledCount = [
    values.orderConfirmationEnabled,
    values.paymentEnabled,
    values.invoiceEnabled,
  ].filter(Boolean).length;

  return (
    <>
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <SettingsFormFeedback
              successMessage={mutation.successMessage}
              error={mutation.error}
              onDismissSuccess={mutation.clearSuccess}
            />

            <fieldset disabled={readOnly} className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0">
                <SettingsSection
                  title="Business notification contact"
                  description="The inbox that should receive operational notifications."
                >
                  <SettingsField
                    id="notification-business-email"
                    label="Business notification email"
                    optional
                    hint="Used as the destination for business notifications when delivery is available."
                    error={errors.businessNotificationEmail?.message}
                  >
                    <Input
                      id="notification-business-email"
                      type="email"
                      placeholder="orders@example.com"
                      autoComplete="email"
                      maxLength={254}
                      aria-invalid={Boolean(errors.businessNotificationEmail)}
                      aria-describedby={
                        errors.businessNotificationEmail
                          ? "notification-business-email-error"
                          : "notification-business-email-hint"
                      }
                      {...register("businessNotificationEmail")}
                    />
                  </SettingsField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="notification-sender-name"
                      label="Default email sender name"
                      error={errors.senderName?.message}
                    >
                      <Input
                        id="notification-sender-name"
                        placeholder="VendKit"
                        maxLength={200}
                        aria-invalid={Boolean(errors.senderName)}
                        aria-describedby={
                          errors.senderName
                            ? "notification-sender-name-error"
                            : undefined
                        }
                        {...register("senderName")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="notification-reply-to"
                      label="Reply-to email"
                      optional
                      error={errors.replyToEmail?.message}
                    >
                      <Input
                        id="notification-reply-to"
                        type="email"
                        placeholder="support@example.com"
                        maxLength={254}
                        aria-invalid={Boolean(errors.replyToEmail)}
                        aria-describedby={
                          errors.replyToEmail
                            ? "notification-reply-to-error"
                            : undefined
                        }
                        {...register("replyToEmail")}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Notification preferences"
                  description="Choose which business events should generate notifications. Delivery integrations are managed separately."
                >
                  <div className="flex flex-col gap-3">
                    <SettingsSwitchField
                      id="notification-order-confirmation"
                      label="Order confirmation"
                      description="Notify the business when a new order is created."
                      checked={values.orderConfirmationEnabled}
                      onCheckedChange={(checked) =>
                        setValue("orderConfirmationEnabled", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="notification-payment"
                      label="Payment received"
                      description="Notify the business when an order payment is recorded."
                      checked={values.paymentEnabled}
                      onCheckedChange={(checked) =>
                        setValue("paymentEnabled", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="notification-invoice"
                      label="Invoice activity"
                      description="Notify the business when an invoice is issued or updated."
                      checked={values.invoiceEnabled}
                      onCheckedChange={(checked) =>
                        setValue("invoiceEnabled", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </SettingsSection>
              </Card>
            </fieldset>

            <SettingsFormActions
              formId={FORM_ID}
              isDirty={isDirty}
              isSubmitting={isSubmitting || mutation.isSaving}
              isRestoring={mutation.isRestoring}
              readOnly={readOnly}
              onDiscard={() =>
                reset(toNotificationSettingsFormValues(settings))
              }
              onRestoreDefaults={() => {
                mutation.clearRestoreError();
                setRestoreOpen(true);
              }}
            />
          </div>

          <aside className="xl:sticky xl:top-20">
            <div className="bg-card rounded-xl border border-border-subtle p-5 shadow-xs">
              <div className="mb-3 flex items-center gap-2">
                <span className="bg-primary-soft text-primary-soft-foreground flex size-8 items-center justify-center rounded-lg">
                  <Bell className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Preferences</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Destination</span>
                  <span className="max-w-40 truncate font-medium">
                    {values.businessNotificationEmail.trim() || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Sender</span>
                  <span className="max-w-40 truncate font-medium">
                    {values.senderName.trim() || "Not set"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Events enabled</span>
                  <span className="font-medium">{enabledCount} of 3</span>
                </div>
              </div>
              <p className="text-muted-foreground border-border-subtle mt-4 flex items-start gap-2 border-t pt-3 text-xs leading-relaxed">
                <Mail
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                These preferences do not create an email or messaging
                integration. They only record the business configuration.
              </p>
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore notification defaults?"
        description="This resets the notification email, event preferences, sender name, and reply-to address."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
