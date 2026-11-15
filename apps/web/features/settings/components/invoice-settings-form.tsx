"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect } from "@/components/shared/native-select";
import { Textarea } from "@/components/ui/textarea";
import {
  CURRENCY_DISPLAY_OPTIONS,
  INVOICE_STATUS_OPTIONS,
} from "../constants/settings-options";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  invoiceSettingsFormSchema,
  toInvoiceSettingsFormValues,
  toInvoiceUpdateInput,
  type InvoiceSettingsFormPayload,
  type InvoiceSettingsFormValues,
} from "../schemas/invoice.schema";
import type {
  BusinessProfileSettings,
  InvoiceSettings,
  RegionalSettings,
} from "../settings.types";
import { formatInvoiceNumberExample } from "../utils/settings-format.utils";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsLogoField } from "./settings-logo-field";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";
import { InvoicePreview } from "./invoice-preview";

const FORM_ID = "settings-invoice-form";
const NUMBER_EXAMPLE_DATE = new Date("2026-11-10T10:30:00.000Z");

interface InvoiceSettingsFormProps {
  settings: InvoiceSettings;
  businessProfile: BusinessProfileSettings;
  regional: RegionalSettings;
  readOnly: boolean;
  onSaved: (settings: InvoiceSettings) => void;
}

export function InvoiceSettingsForm({
  settings,
  businessProfile,
  regional,
  readOnly,
  onSaved,
}: InvoiceSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"invoice">({
    category: "invoice",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    resetField,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<InvoiceSettingsFormValues, unknown, InvoiceSettingsFormPayload>({
    resolver: zodResolver(invoiceSettingsFormSchema),
    defaultValues: toInvoiceSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toInvoiceSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as InvoiceSettingsFormValues;
  const defaults = toInvoiceSettingsFormValues(settings);

  const numberExample = formatInvoiceNumberExample({
    numberPrefix: values.numberPrefix,
    numberFormat: values.numberFormat,
    yearBasedNumbering: values.yearBasedNumbering,
    sequence: values.startingSequence,
    date: NUMBER_EXAMPLE_DATE,
  });

  const savedOverrideCount = [
    settings.email,
    settings.phone,
    settings.addressLine1,
    settings.addressLine2,
    settings.city,
    settings.state,
    settings.postalCode,
    settings.country,
    settings.taxRegistrationNumber,
    settings.additionalInfo,
    settings.logo,
  ].filter(Boolean).length;

  function handleUseBusinessProfileChange(checked: boolean) {
    setValue("useBusinessProfile", checked, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (checked) {
      // Hidden custom fields should not carry unsaved edits into business
      // profile mode. Restore them to their last saved values.
      resetField("logoImageId", { defaultValue: defaults.logoImageId });
      resetField("logoUrl", { defaultValue: defaults.logoUrl });
      resetField("email", { defaultValue: defaults.email });
      resetField("phone", { defaultValue: defaults.phone });
      resetField("addressLine1", { defaultValue: defaults.addressLine1 });
      resetField("addressLine2", { defaultValue: defaults.addressLine2 });
      resetField("city", { defaultValue: defaults.city });
      resetField("state", { defaultValue: defaults.state });
      resetField("postalCode", { defaultValue: defaults.postalCode });
      resetField("country", { defaultValue: defaults.country });
      resetField("taxRegistrationNumber", {
        defaultValue: defaults.taxRegistrationNumber,
      });
      resetField("additionalInfo", { defaultValue: defaults.additionalInfo });
    }
  }

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toInvoiceUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toInvoiceSettingsFormValues(restored));
    }
  }

  return (
    <>
      <form id={FORM_ID} onSubmit={onSubmit}>
        <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_23rem] xl:items-start">
          <div className="flex min-w-0 flex-col gap-5">
            <SettingsFormFeedback
              successMessage={mutation.successMessage}
              error={mutation.error}
              onDismissSuccess={mutation.clearSuccess}
            />

            <fieldset disabled={readOnly} className="min-w-0">
              <Card className="gap-0 overflow-hidden py-0">
                <SettingsSection
                  title="Invoice business information"
                  description="Choose whether invoice details come from your business profile or from invoice-specific values."
                >
                  <SettingsField
                    id="invoice-display-name"
                    label="Invoice display name"
                    optional
                    hint="Leave blank to use your business name."
                    error={errors.displayName?.message}
                  >
                    <Input
                      id="invoice-display-name"
                      placeholder={businessProfile.businessName}
                      maxLength={200}
                      aria-invalid={Boolean(errors.displayName)}
                      aria-describedby={
                        errors.displayName
                          ? "invoice-display-name-error"
                          : "invoice-display-name-hint"
                      }
                      {...register("displayName")}
                    />
                  </SettingsField>

                  <SettingsSwitchField
                    id="invoice-use-business-profile"
                    label="Use business profile information"
                    description="Blank invoice contact and address fields fall back to your business profile. Saved invoice-specific values still take precedence."
                    checked={values.useBusinessProfile}
                    onCheckedChange={handleUseBusinessProfileChange}
                    disabled={readOnly}
                  />

                  {values.useBusinessProfile ? (
                    <div className="border-border-subtle bg-surface-muted/40 rounded-lg border p-4">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-sm font-medium">
                            {businessProfile.businessName}
                          </p>
                          <p className="text-muted-foreground text-xs">
                            {[
                              businessProfile.email,
                              businessProfile.phone,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No contact details saved"}
                          </p>
                          <p className="text-muted-foreground mt-1 text-xs leading-relaxed">
                            {[
                              businessProfile.addressLine1,
                              businessProfile.addressLine2,
                              [businessProfile.city, businessProfile.state]
                                .filter(Boolean)
                                .join(", "),
                              businessProfile.country,
                            ]
                              .filter(Boolean)
                              .join(" · ") || "No address saved"}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleUseBusinessProfileChange(false)}
                        >
                          Use custom details
                        </Button>
                      </div>

                      {savedOverrideCount > 0 ? (
                        <p className="text-warning-soft-foreground bg-warning-soft mt-3 rounded-md px-3 py-2 text-xs leading-relaxed">
                          {savedOverrideCount} saved invoice-specific{" "}
                          {savedOverrideCount === 1 ? "value" : "values"} will
                          still override the business profile. Switch to custom
                          details to review or clear them.
                        </p>
                      ) : null}
                    </div>
                  ) : (
                    <>
                      <SettingsLogoField
                        id="invoice-logo"
                        label="Invoice logo"
                        description="Used on invoice documents instead of the business profile logo."
                        logo={
                          values.logoImageId && values.logoUrl
                            ? {
                                id: values.logoImageId,
                                url: values.logoUrl,
                              }
                            : null
                        }
                        disabled={readOnly}
                        onChange={(logo) => {
                          setValue("logoImageId", logo?.id ?? "", {
                            shouldDirty: true,
                          });
                          setValue("logoUrl", logo?.url ?? "", {
                            shouldDirty: true,
                          });
                        }}
                      />

                      <div className="grid gap-4 sm:grid-cols-2">
                        <SettingsField
                          id="invoice-email"
                          label="Invoice email"
                          optional
                          error={errors.email?.message}
                        >
                          <Input
                            id="invoice-email"
                            type="email"
                            placeholder="invoices@example.com"
                            maxLength={254}
                            aria-invalid={Boolean(errors.email)}
                            aria-describedby={
                              errors.email ? "invoice-email-error" : undefined
                            }
                            {...register("email")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-phone"
                          label="Invoice phone"
                          optional
                          error={errors.phone?.message}
                        >
                          <Input
                            id="invoice-phone"
                            type="tel"
                            placeholder="+880 1712 345678"
                            maxLength={30}
                            aria-invalid={Boolean(errors.phone)}
                            aria-describedby={
                              errors.phone ? "invoice-phone-error" : undefined
                            }
                            {...register("phone")}
                          />
                        </SettingsField>
                      </div>

                      <div className="grid gap-4">
                        <SettingsField
                          id="invoice-address-line-1"
                          label="Address line 1"
                          optional
                          error={errors.addressLine1?.message}
                        >
                          <Input
                            id="invoice-address-line-1"
                            placeholder="Street address, building, or area"
                            maxLength={500}
                            aria-invalid={Boolean(errors.addressLine1)}
                            aria-describedby={
                              errors.addressLine1
                                ? "invoice-address-line-1-error"
                                : undefined
                            }
                            {...register("addressLine1")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-address-line-2"
                          label="Address line 2"
                          optional
                          error={errors.addressLine2?.message}
                        >
                          <Input
                            id="invoice-address-line-2"
                            placeholder="Apartment, suite, floor, or landmark"
                            maxLength={500}
                            aria-invalid={Boolean(errors.addressLine2)}
                            aria-describedby={
                              errors.addressLine2
                                ? "invoice-address-line-2-error"
                                : undefined
                            }
                            {...register("addressLine2")}
                          />
                        </SettingsField>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <SettingsField
                          id="invoice-city"
                          label="City"
                          optional
                          error={errors.city?.message}
                        >
                          <Input
                            id="invoice-city"
                            placeholder="City"
                            maxLength={100}
                            aria-invalid={Boolean(errors.city)}
                            aria-describedby={
                              errors.city ? "invoice-city-error" : undefined
                            }
                            {...register("city")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-state"
                          label="State or province"
                          optional
                          error={errors.state?.message}
                        >
                          <Input
                            id="invoice-state"
                            placeholder="State or province"
                            maxLength={100}
                            aria-invalid={Boolean(errors.state)}
                            aria-describedby={
                              errors.state ? "invoice-state-error" : undefined
                            }
                            {...register("state")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-postal-code"
                          label="Postal code"
                          optional
                          error={errors.postalCode?.message}
                        >
                          <Input
                            id="invoice-postal-code"
                            placeholder="Postal or ZIP code"
                            maxLength={20}
                            aria-invalid={Boolean(errors.postalCode)}
                            aria-describedby={
                              errors.postalCode
                                ? "invoice-postal-code-error"
                                : undefined
                            }
                            {...register("postalCode")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-country"
                          label="Country"
                          optional
                          error={errors.country?.message}
                        >
                          <Input
                            id="invoice-country"
                            placeholder="Country"
                            maxLength={100}
                            aria-invalid={Boolean(errors.country)}
                            aria-describedby={
                              errors.country
                                ? "invoice-country-error"
                                : undefined
                            }
                            {...register("country")}
                          />
                        </SettingsField>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <SettingsField
                          id="invoice-tax-registration"
                          label="Tax registration number"
                          optional
                          error={errors.taxRegistrationNumber?.message}
                        >
                          <Input
                            id="invoice-tax-registration"
                            placeholder="Tax or VAT registration number"
                            maxLength={100}
                            aria-invalid={Boolean(errors.taxRegistrationNumber)}
                            aria-describedby={
                              errors.taxRegistrationNumber
                                ? "invoice-tax-registration-error"
                                : undefined
                            }
                            {...register("taxRegistrationNumber")}
                          />
                        </SettingsField>

                        <SettingsField
                          id="invoice-additional-info"
                          label="Additional business information"
                          optional
                          error={errors.additionalInfo?.message}
                        >
                          <Input
                            id="invoice-additional-info"
                            placeholder="e.g. Trade licence or bank details"
                            maxLength={2000}
                            aria-invalid={Boolean(errors.additionalInfo)}
                            aria-describedby={
                              errors.additionalInfo
                                ? "invoice-additional-info-error"
                                : undefined
                            }
                            {...register("additionalInfo")}
                          />
                        </SettingsField>
                      </div>
                    </>
                  )}
                </SettingsSection>

                <SettingsSection
                  title="Invoice numbering"
                  description="Configure how unique invoice numbers are generated. Existing invoice numbers are never rewritten by changing these settings."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="invoice-number-prefix"
                      label="Number prefix"
                      error={errors.numberPrefix?.message}
                    >
                      <Input
                        id="invoice-number-prefix"
                        placeholder="INV"
                        maxLength={20}
                        className="uppercase"
                        aria-invalid={Boolean(errors.numberPrefix)}
                        aria-describedby={
                          errors.numberPrefix
                            ? "invoice-number-prefix-error"
                            : undefined
                        }
                        {...register("numberPrefix")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="invoice-starting-sequence"
                      label="Starting sequence"
                      hint="The next number is always greater than any number already allocated."
                      error={errors.startingSequence?.message}
                    >
                      <Input
                        id="invoice-starting-sequence"
                        type="number"
                        min={1}
                        step={1}
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.startingSequence)}
                        aria-describedby={
                          errors.startingSequence
                            ? "invoice-starting-sequence-error"
                            : "invoice-starting-sequence-hint"
                        }
                        {...register("startingSequence", { valueAsNumber: true })}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="invoice-number-format"
                    label="Number format"
                    hint="Available tokens: {prefix}, {year}, {month}, {sequence}. {sequence} is required."
                    error={errors.numberFormat?.message}
                  >
                    <Input
                      id="invoice-number-format"
                      placeholder="{prefix}-{year}-{sequence}"
                      maxLength={100}
                      spellCheck={false}
                      className="font-mono"
                      aria-invalid={Boolean(errors.numberFormat)}
                      aria-describedby={
                        errors.numberFormat
                          ? "invoice-number-format-error"
                          : "invoice-number-format-hint"
                      }
                      {...register("numberFormat")}
                    />
                  </SettingsField>

                  <div className="border-border-subtle bg-surface-muted/50 flex flex-wrap items-center justify-between gap-2 rounded-lg border px-3.5 py-2.5">
                    <span className="text-muted-foreground text-xs">
                      Example next number
                    </span>
                    <span className="font-mono text-sm font-semibold">
                      {numberExample || "—"}
                    </span>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SettingsSwitchField
                      id="invoice-year-based-numbering"
                      label="Year-based numbering"
                      description="The sequence counter resets when the calendar year changes. The {year} token can only be used while this is enabled."
                      checked={values.yearBasedNumbering}
                      onCheckedChange={(checked) =>
                        setValue("yearBasedNumbering", checked, {
                          shouldDirty: true,
                          shouldValidate: true,
                        })
                      }
                      disabled={readOnly}
                    />

                    <SettingsSwitchField
                      id="invoice-automatic-numbering"
                      label="Automatic numbering"
                      description="Allocate invoice numbers automatically. Turning this off requires invoice numbers to be entered manually."
                      checked={values.automaticNumbering}
                      onCheckedChange={(checked) =>
                        setValue("automaticNumbering", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Invoice defaults"
                  description="Values applied to new invoices unless they are changed individually."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="invoice-due-period"
                      label="Due period (days)"
                      hint="Number of days from the issue date until payment is due."
                      error={errors.duePeriodDays?.message}
                    >
                      <Input
                        id="invoice-due-period"
                        type="number"
                        min={0}
                        step={1}
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.duePeriodDays)}
                        aria-describedby={
                          errors.duePeriodDays
                            ? "invoice-due-period-error"
                            : "invoice-due-period-hint"
                        }
                        {...register("duePeriodDays", { valueAsNumber: true })}
                      />
                    </SettingsField>

                    <SettingsField
                      id="invoice-currency-display"
                      label="Currency display"
                      hint="Used on invoice documents."
                      error={errors.currencyDisplayFormat?.message}
                    >
                      <NativeSelect
                        id="invoice-currency-display"
                        ariaLabel="Invoice currency display"
                        options={CURRENCY_DISPLAY_OPTIONS}
                        {...register("currencyDisplayFormat")}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="invoice-payment-terms"
                    label="Payment terms"
                    optional
                    error={errors.paymentTerms?.message}
                  >
                    <Textarea
                      id="invoice-payment-terms"
                      rows={2}
                      maxLength={1000}
                      placeholder="e.g. Payment is due within 15 days."
                      aria-invalid={Boolean(errors.paymentTerms)}
                      aria-describedby={
                        errors.paymentTerms
                          ? "invoice-payment-terms-error"
                          : undefined
                      }
                      {...register("paymentTerms")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="invoice-notes"
                    label="Default invoice notes"
                    optional
                    error={errors.notes?.message}
                  >
                    <Textarea
                      id="invoice-notes"
                      rows={2}
                      maxLength={2000}
                      placeholder="Notes shown on invoice documents."
                      aria-invalid={Boolean(errors.notes)}
                      aria-describedby={
                        errors.notes ? "invoice-notes-error" : undefined
                      }
                      {...register("notes")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="invoice-footer"
                    label="Footer text"
                    optional
                    error={errors.footerText?.message}
                  >
                    <Input
                      id="invoice-footer"
                      placeholder="Thank you for your business."
                      maxLength={1000}
                      aria-invalid={Boolean(errors.footerText)}
                      aria-describedby={
                        errors.footerText ? "invoice-footer-error" : undefined
                      }
                      {...register("footerText")}
                    />
                  </SettingsField>

                  <div className="grid gap-3 sm:grid-cols-1">
                    <SettingsSwitchField
                      id="invoice-show-sku"
                      label="Show SKU on invoices"
                      checked={values.showSku}
                      onCheckedChange={(checked) =>
                        setValue("showSku", checked, { shouldDirty: true })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="invoice-show-tax-breakdown"
                      label="Show tax breakdown"
                      checked={values.showTaxBreakdown}
                      onCheckedChange={(checked) =>
                        setValue("showTaxBreakdown", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="invoice-show-discount-breakdown"
                      label="Show discount breakdown"
                      checked={values.showDiscountBreakdown}
                      onCheckedChange={(checked) =>
                        setValue("showDiscountBreakdown", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Invoice behavior"
                  description="Rules applied when invoices are created and managed."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="invoice-default-status"
                      label="Default status"
                      hint="Status assigned to a newly created invoice."
                      error={errors.defaultStatus?.message}
                    >
                      <NativeSelect
                        id="invoice-default-status"
                        ariaLabel="Default invoice status"
                        options={INVOICE_STATUS_OPTIONS}
                        {...register("defaultStatus")}
                      />
                    </SettingsField>
                  </div>

                  <div className="flex flex-col gap-3">
                    <SettingsSwitchField
                      id="invoice-allow-editing"
                      label="Allow editing after issuing"
                      description="When disabled, issued invoices become read-only."
                      checked={values.allowEditingAfterIssue}
                      onCheckedChange={(checked) =>
                        setValue("allowEditingAfterIssue", checked, {
                          shouldDirty: true,
                        })
                      }
                      disabled={readOnly}
                    />
                    <SettingsSwitchField
                      id="invoice-allow-cancellation"
                      label="Allow invoice cancellation"
                      description="When disabled, invoices cannot be cancelled after they are created."
                      checked={values.allowCancellation}
                      onCheckedChange={(checked) =>
                        setValue("allowCancellation", checked, {
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
              onDiscard={() => reset(toInvoiceSettingsFormValues(settings))}
              onRestoreDefaults={() => {
                mutation.clearRestoreError();
                setRestoreOpen(true);
              }}
            />
          </div>

          <aside className="xl:sticky xl:top-20">
            <InvoicePreview
              businessProfile={businessProfile}
              invoice={values}
              regional={regional}
            />
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore invoice defaults?"
        description="This resets invoice branding, numbering, defaults, and behavior to the backend defaults. Existing invoice numbers already allocated are preserved."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
