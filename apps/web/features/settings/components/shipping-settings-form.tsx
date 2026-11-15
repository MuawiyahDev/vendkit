"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatAmount } from "@/lib/format";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  shippingSettingsFormSchema,
  toShippingSettingsFormValues,
  toShippingUpdateInput,
  type ShippingSettingsFormPayload,
  type ShippingSettingsFormValues,
} from "../schemas/shipping.schema";
import type { ShippingSettings } from "../settings.types";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";

const FORM_ID = "settings-shipping-form";

interface ShippingSettingsFormProps {
  settings: ShippingSettings;
  readOnly: boolean;
  onSaved: (settings: ShippingSettings) => void;
}

export function ShippingSettingsForm({
  settings,
  readOnly,
  onSaved,
}: ShippingSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"shipping">({
    category: "shipping",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<ShippingSettingsFormValues, unknown, ShippingSettingsFormPayload>(
    {
      resolver: zodResolver(shippingSettingsFormSchema),
      defaultValues: toShippingSettingsFormValues(settings),
    },
  );

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toShippingSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as ShippingSettingsFormValues;
  const charge = Number.isFinite(values.defaultCharge)
    ? values.defaultCharge
    : 0;
  const threshold =
    values.freeShippingThreshold !== null &&
    Number.isFinite(values.freeShippingThreshold)
      ? values.freeShippingThreshold
      : null;

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toShippingUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toShippingSettingsFormValues(restored));
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
                  title="Shipping defaults"
                  description="Business-level defaults used when creating orders. This is not a courier or delivery management module."
                >
                  <SettingsSwitchField
                    id="shipping-enabled"
                    label="Enable shipping"
                    description="When disabled, new orders default to zero shipping unless a fee is entered explicitly."
                    checked={values.enabled}
                    onCheckedChange={(checked) =>
                      setValue("enabled", checked, { shouldDirty: true })
                    }
                    disabled={readOnly}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="shipping-default-charge"
                      label="Default shipping charge"
                      hint="Applied to new orders when no shipping fee is entered."
                      error={errors.defaultCharge?.message}
                    >
                      <Input
                        id="shipping-default-charge"
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        aria-invalid={Boolean(errors.defaultCharge)}
                        aria-describedby={
                          errors.defaultCharge
                            ? "shipping-default-charge-error"
                            : "shipping-default-charge-hint"
                        }
                        {...register("defaultCharge", {
                          valueAsNumber: true,
                        })}
                      />
                    </SettingsField>

                    <SettingsField
                      id="shipping-free-threshold"
                      label="Free shipping threshold"
                      optional
                      hint="Orders at or above this subtotal use free shipping. Leave blank to disable."
                      error={errors.freeShippingThreshold?.message}
                    >
                      <Input
                        id="shipping-free-threshold"
                        type="number"
                        min={0}
                        step="0.01"
                        inputMode="decimal"
                        aria-invalid={Boolean(errors.freeShippingThreshold)}
                        aria-describedby={
                          errors.freeShippingThreshold
                            ? "shipping-free-threshold-error"
                            : "shipping-free-threshold-hint"
                        }
                        {...register("freeShippingThreshold", {
                          setValueAs: (value: unknown) => {
                            if (value === "" || value === null) {
                              return null;
                            }
                            const parsed = Number(value);
                            return Number.isNaN(parsed) ? null : parsed;
                          },
                        })}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Delivery details"
                  description="Defaults shown on orders and used by the business when arranging delivery."
                >
                  <SettingsField
                    id="shipping-default-method"
                    label="Default delivery method"
                    optional
                    hint="A short label such as Standard, Express, or Pickup."
                    error={errors.defaultDeliveryMethod?.message}
                  >
                    <Input
                      id="shipping-default-method"
                      placeholder="Standard"
                      maxLength={100}
                      aria-invalid={Boolean(errors.defaultDeliveryMethod)}
                      aria-describedby={
                        errors.defaultDeliveryMethod
                          ? "shipping-default-method-error"
                          : "shipping-default-method-hint"
                      }
                      {...register("defaultDeliveryMethod")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="shipping-instructions"
                    label="Default delivery instructions"
                    optional
                    error={errors.deliveryInstructions?.message}
                  >
                    <Textarea
                      id="shipping-instructions"
                      rows={3}
                      maxLength={2000}
                      placeholder="e.g. Call the customer before delivery."
                      aria-invalid={Boolean(errors.deliveryInstructions)}
                      aria-describedby={
                        errors.deliveryInstructions
                          ? "shipping-instructions-error"
                          : undefined
                      }
                      {...register("deliveryInstructions")}
                    />
                  </SettingsField>
                </SettingsSection>
              </Card>
            </fieldset>

            <SettingsFormActions
              formId={FORM_ID}
              isDirty={isDirty}
              isSubmitting={isSubmitting || mutation.isSaving}
              isRestoring={mutation.isRestoring}
              readOnly={readOnly}
              onDiscard={() => reset(toShippingSettingsFormValues(settings))}
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
                  <Truck className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">At a glance</p>
              </div>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Shipping</span>
                  <span className="font-medium">
                    {values.enabled ? "Enabled" : "Disabled"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Default charge</span>
                  <span className="font-medium">
                    {values.enabled ? formatAmount(charge) : "0.00"}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Free over</span>
                  <span className="font-medium">
                    {threshold === null ? "Not set" : formatAmount(threshold)}
                  </span>
                </div>
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Method</span>
                  <span className="font-medium">
                    {values.defaultDeliveryMethod.trim() || "Not set"}
                  </span>
                </div>
              </div>
              <p className="text-muted-foreground border-border-subtle mt-4 border-t pt-3 text-xs leading-relaxed">
                These values apply to new orders. Existing orders keep the
                shipping fee stored when they were created.
              </p>
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore shipping defaults?"
        description="This resets shipping availability, charges, threshold, and delivery instructions. Existing orders are not modified."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
