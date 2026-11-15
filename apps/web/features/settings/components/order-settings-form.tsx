"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Info, ReceiptText } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { NativeSelect } from "@/components/shared/native-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ORDER_STATUS_OPTIONS } from "../constants/settings-options";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  orderSettingsFormSchema,
  toOrderSettingsFormValues,
  toOrderUpdateInput,
  type OrderSettingsFormPayload,
  type OrderSettingsFormValues,
} from "../schemas/order.schema";
import type { OrderSettings } from "../settings.types";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";

const FORM_ID = "settings-order-form";

interface OrderSettingsFormProps {
  settings: OrderSettings;
  readOnly: boolean;
  onSaved: (settings: OrderSettings) => void;
}

export function OrderSettingsForm({
  settings,
  readOnly,
  onSaved,
}: OrderSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"order">({
    category: "order",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<OrderSettingsFormValues, unknown, OrderSettingsFormPayload>({
    resolver: zodResolver(orderSettingsFormSchema),
    defaultValues: toOrderSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toOrderSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as OrderSettingsFormValues;
  const exampleNumber = `${values.orderNumberPrefix || "ORD"}-20261110-ABC123`;

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toOrderUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toOrderSettingsFormValues(restored));
    }
  }

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
                  title="Order numbering"
                  description="How new order numbers are created. Existing order numbers are never changed."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="order-number-prefix"
                      label="Order number prefix"
                      error={errors.orderNumberPrefix?.message}
                    >
                      <Input
                        id="order-number-prefix"
                        placeholder="ORD"
                        maxLength={20}
                        className="uppercase"
                        aria-invalid={Boolean(errors.orderNumberPrefix)}
                        aria-describedby={
                          errors.orderNumberPrefix
                            ? "order-number-prefix-error"
                            : undefined
                        }
                        {...register("orderNumberPrefix")}
                      />
                    </SettingsField>

                    <div className="border-border-subtle bg-surface-muted/50 flex items-center justify-between gap-3 rounded-lg border px-3.5 py-3">
                      <span className="text-muted-foreground text-xs">
                        Example number
                      </span>
                      <span className="font-mono text-sm font-semibold">
                        {exampleNumber}
                      </span>
                    </div>
                  </div>

                  <SettingsSwitchField
                    id="order-automatic-numbering"
                    label="Automatic order numbering"
                    description="Generate an order number for every new order. Turning this off requires a manual order number."
                    checked={values.automaticNumbering}
                    onCheckedChange={(checked) =>
                      setValue("automaticNumbering", checked, {
                        shouldDirty: true,
                      })
                    }
                    disabled={readOnly}
                  />

                  {!values.automaticNumbering ? (
                    <Alert className="border-warning/25 bg-warning-soft text-warning-soft-foreground [&>svg]:text-warning-soft-foreground">
                      <Info aria-hidden="true" />
                      <AlertDescription className="text-warning-soft-foreground">
                        Manual order numbers are supported by the API, but the
                        current order creation screen does not expose a manual
                        number field. New orders will fail until that field is
                        added, so keep automatic numbering enabled for now.
                      </AlertDescription>
                    </Alert>
                  ) : null}
                </SettingsSection>

                <SettingsSection
                  title="Order defaults"
                  description="Applied to new orders only. Changing these defaults does not modify existing orders."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="order-default-status"
                      label="Default order status"
                      hint="New orders start in this status."
                      error={errors.defaultStatus?.message}
                    >
                      <NativeSelect
                        id="order-default-status"
                        ariaLabel="Default order status"
                        options={ORDER_STATUS_OPTIONS}
                        {...register("defaultStatus")}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="order-default-notes"
                    label="Default order notes"
                    optional
                    hint="Added to the customer note when a new order does not include one."
                    error={errors.defaultNotes?.message}
                  >
                    <Textarea
                      id="order-default-notes"
                      rows={3}
                      maxLength={2000}
                      placeholder="e.g. Please confirm the delivery address before dispatch."
                      aria-invalid={Boolean(errors.defaultNotes)}
                      aria-describedby={
                        errors.defaultNotes
                          ? "order-default-notes-error"
                          : "order-default-notes-hint"
                      }
                      {...register("defaultNotes")}
                    />
                  </SettingsField>
                </SettingsSection>

                <SettingsSection
                  title="Order rules"
                  description="Control how order records can be edited after they are created."
                >
                  <div className="flex flex-col gap-3">
                    <SettingsSwitchField
                      id="order-allow-editing"
                      label="Allow order editing"
                      description="When disabled, existing order details cannot be edited from the dashboard."
                      checked={values.allowEditing}
                      onCheckedChange={(checked) =>
                        setValue("allowEditing", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="order-require-customer"
                      label="Require customer information"
                      description="Require a saved customer when creating a new order."
                      checked={values.requireCustomerInformation}
                      onCheckedChange={(checked) =>
                        setValue("requireCustomerInformation", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>

                  <p className="text-muted-foreground text-xs leading-relaxed">
                    Payment status is derived from recorded payments and cannot
                    be set as a default.
                  </p>
                </SettingsSection>
              </Card>
            </fieldset>

            <SettingsFormActions
              formId={FORM_ID}
              isDirty={isDirty}
              isSubmitting={isSubmitting || mutation.isSaving}
              isRestoring={mutation.isRestoring}
              readOnly={readOnly}
              onDiscard={() => reset(toOrderSettingsFormValues(settings))}
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
                  <ReceiptText className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Future orders only</p>
              </div>
              <p className="text-muted-foreground text-xs leading-relaxed">
                Numbering, default status, default notes, and customer rules
                apply when an order is created. Existing orders keep their
                current status, notes, and numbers.
              </p>
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore order defaults?"
        description="This resets order numbering, default status, notes, and editing rules. Existing orders are not modified."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
