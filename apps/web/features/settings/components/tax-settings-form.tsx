"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Calculator, Percent } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { NativeSelect } from "@/components/shared/native-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { formatAmount } from "@/lib/format";
import { TAX_PRICING_OPTIONS } from "../constants/settings-options";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  taxSettingsFormSchema,
  toTaxSettingsFormValues,
  toTaxUpdateInput,
  type TaxSettingsFormPayload,
  type TaxSettingsFormValues,
} from "../schemas/tax.schema";
import type { TaxSettings } from "../settings.types";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";

const FORM_ID = "settings-tax-form";
const EXAMPLE_BASE = 1000;

interface TaxSettingsFormProps {
  settings: TaxSettings;
  readOnly: boolean;
  onSaved: (settings: TaxSettings) => void;
}

export function TaxSettingsForm({
  settings,
  readOnly,
  onSaved,
}: TaxSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"tax">({
    category: "tax",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<TaxSettingsFormValues, unknown, TaxSettingsFormPayload>({
    resolver: zodResolver(taxSettingsFormSchema),
    defaultValues: toTaxSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toTaxSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as TaxSettingsFormValues;
  const rate = Number.isFinite(values.defaultRate) ? values.defaultRate : 0;

  const exclusiveTax = (EXAMPLE_BASE * rate) / 100;
  const inclusiveTax =
    rate > 0 ? EXAMPLE_BASE - EXAMPLE_BASE / (1 + rate / 100) : 0;
  const taxAmount =
    values.pricingMode === "INCLUSIVE" ? inclusiveTax : exclusiveTax;
  const netAmount =
    values.pricingMode === "INCLUSIVE"
      ? EXAMPLE_BASE - inclusiveTax
      : EXAMPLE_BASE;

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toTaxUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toTaxSettingsFormValues(restored));
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
                  title="Tax calculation"
                  description="Default tax behavior for new orders and invoices. Historical records keep their original tax values."
                >
                  <SettingsSwitchField
                    id="tax-enabled"
                    label="Enable tax calculation"
                    description="When disabled, tax is treated as zero by default. Existing records are unaffected."
                    checked={values.enabled}
                    onCheckedChange={(checked) =>
                      setValue("enabled", checked, { shouldDirty: true })
                    }
                    disabled={readOnly}
                  />

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="tax-default-name"
                      label="Default tax name"
                      error={errors.defaultName?.message}
                    >
                      <Input
                        id="tax-default-name"
                        placeholder="VAT"
                        maxLength={100}
                        aria-invalid={Boolean(errors.defaultName)}
                        aria-describedby={
                          errors.defaultName
                            ? "tax-default-name-error"
                            : undefined
                        }
                        {...register("defaultName")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="tax-default-rate"
                      label="Default tax rate (%)"
                      hint="Enter a value between 0 and 100 with up to two decimal places."
                      error={errors.defaultRate?.message}
                    >
                      <Input
                        id="tax-default-rate"
                        type="number"
                        min={0}
                        max={100}
                        step="0.01"
                        inputMode="decimal"
                        aria-invalid={Boolean(errors.defaultRate)}
                        aria-describedby={
                          errors.defaultRate
                            ? "tax-default-rate-error"
                            : "tax-default-rate-hint"
                        }
                        {...register("defaultRate", { valueAsNumber: true })}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="tax-identification-number"
                    label="Tax identification number"
                    optional
                    error={errors.taxIdentificationNumber?.message}
                  >
                    <Input
                      id="tax-identification-number"
                      placeholder="VAT, GST, or tax registration number"
                      maxLength={100}
                      aria-invalid={Boolean(errors.taxIdentificationNumber)}
                      aria-describedby={
                        errors.taxIdentificationNumber
                          ? "tax-identification-number-error"
                          : undefined
                      }
                      {...register("taxIdentificationNumber")}
                    />
                  </SettingsField>
                </SettingsSection>

                <SettingsSection
                  title="Pricing mode"
                  description="Choose whether listed prices include tax or tax is added at the end."
                >
                  <SettingsField
                    id="tax-pricing-mode"
                    label="Tax pricing"
                    hint="Exclusive: tax is added to the price. Inclusive: the price already contains tax."
                    error={errors.pricingMode?.message}
                  >
                    <NativeSelect
                      id="tax-pricing-mode"
                      ariaLabel="Tax pricing mode"
                      options={TAX_PRICING_OPTIONS}
                      {...register("pricingMode")}
                    />
                  </SettingsField>

                  <SettingsSwitchField
                    id="tax-show-breakdown"
                    label="Show tax breakdown on invoices"
                    description="When enabled, invoice documents display the calculated tax separately."
                    checked={values.showBreakdownOnInvoice}
                    onCheckedChange={(checked) =>
                      setValue("showBreakdownOnInvoice", checked, {
                        shouldDirty: true,
                      })
                    }
                    disabled={readOnly}
                  />
                </SettingsSection>
              </Card>
            </fieldset>

            <SettingsFormActions
              formId={FORM_ID}
              isDirty={isDirty}
              isSubmitting={isSubmitting || mutation.isSaving}
              isRestoring={mutation.isRestoring}
              readOnly={readOnly}
              onDiscard={() => reset(toTaxSettingsFormValues(settings))}
              onRestoreDefaults={() => {
                mutation.clearRestoreError();
                setRestoreOpen(true);
              }}
            />
          </div>

          <aside className="xl:sticky xl:top-20">
            <div className="bg-card rounded-xl border border-border-subtle p-5 shadow-xs">
              <div className="mb-4 flex items-center gap-2">
                <span className="bg-primary-soft text-primary-soft-foreground flex size-8 items-center justify-center rounded-lg">
                  <Percent className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Calculation example</p>
                  <p className="text-muted-foreground text-xs">
                    {values.defaultName || "Tax"} at{" "}
                    {Number.isFinite(rate) ? rate : 0}%
                  </p>
                </div>
              </div>

              {!values.enabled ? (
                <p className="text-muted-foreground rounded-lg border border-dashed p-4 text-xs leading-relaxed">
                  Tax calculation is disabled. Enable it to apply the default
                  rate to new orders and invoices.
                </p>
              ) : (
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {values.pricingMode === "INCLUSIVE"
                        ? "Price including tax"
                        : "Price before tax"}
                    </span>
                    <span className="font-medium">
                      {formatAmount(EXAMPLE_BASE)}
                    </span>
                  </div>
                  <div className="flex justify-between gap-4">
                    <span className="text-muted-foreground">
                      {values.defaultName || "Tax"}
                    </span>
                    <span className="font-medium">
                      {formatAmount(taxAmount)}
                    </span>
                  </div>
                  <div className="border-border-subtle flex justify-between gap-4 border-t pt-2 font-semibold">
                    <span>
                      {values.pricingMode === "INCLUSIVE"
                        ? "Net before tax"
                        : "Total with tax"}
                    </span>
                    <span>
                      {formatAmount(
                        values.pricingMode === "INCLUSIVE"
                          ? netAmount
                          : EXAMPLE_BASE + exclusiveTax,
                      )}
                    </span>
                  </div>
                  <p className="text-muted-foreground flex items-start gap-1.5 pt-2 text-xs leading-relaxed">
                    <Calculator
                      className="mt-0.5 size-3.5 shrink-0"
                      aria-hidden="true"
                    />
                    {values.pricingMode === "INCLUSIVE"
                      ? "The price already contains tax; the tax amount is extracted from it."
                      : "Tax is calculated on top of the price and added to the total."}
                  </p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore tax defaults?"
        description="This resets tax name, rate, pricing mode, and invoice presentation. Existing orders and invoices keep their original tax amounts."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
