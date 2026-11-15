"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CalendarClock, Coins, Globe2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { SearchableSelect } from "@/components/shared/searchable-select";
import { NativeSelect } from "@/components/shared/native-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  COUNTRY_OPTIONS,
  CURRENCY_OPTIONS,
  CURRENCY_POSITION_OPTIONS,
  DATE_FORMAT_OPTIONS,
  LANGUAGE_OPTIONS,
  TIMEZONE_OPTIONS,
  TIME_FORMAT_OPTIONS,
} from "../constants/settings-options";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  regionalSettingsFormSchema,
  toRegionalSettingsFormValues,
  toRegionalUpdateInput,
  type RegionalSettingsFormPayload,
  type RegionalSettingsFormValues,
} from "../schemas/regional.schema";
import type { RegionalSettings } from "../settings.types";
import {
  formatDatePattern,
  formatMoney,
  formatTimePattern,
} from "../utils/settings-format.utils";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";

const FORM_ID = "settings-regional-form";
const PREVIEW_DATE = new Date("2026-12-31T14:30:45.000Z");

interface RegionalSettingsFormProps {
  settings: RegionalSettings;
  readOnly: boolean;
  onSaved: (settings: RegionalSettings) => void;
}

export function RegionalSettingsForm({
  settings,
  readOnly,
  onSaved,
}: RegionalSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"regional">({
    category: "regional",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<RegionalSettingsFormValues, unknown, RegionalSettingsFormPayload>({
    resolver: zodResolver(regionalSettingsFormSchema),
    defaultValues: toRegionalSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toRegionalSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as RegionalSettingsFormValues;

  const previewPrecision = Number.isFinite(values.decimalPrecision)
    ? Math.min(6, Math.max(0, values.decimalPrecision))
    : 2;

  const previewAmount = formatMoney(1234567.89, {
    currencySymbol: values.currencySymbol,
    currencyPosition: values.currencyPosition,
    decimalPrecision: previewPrecision,
    thousandSeparator: values.thousandSeparator,
    decimalSeparator: values.decimalSeparator,
  });

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toRegionalUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toRegionalSettingsFormValues(restored));
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
                  title="Currency"
                  description="How monetary values are displayed across the dashboard and documents. Existing orders and invoices are never recalculated."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="regional-currency"
                      label="Default currency"
                      error={errors.currency?.message}
                    >
                      <Controller
                        control={control}
                        name="currency"
                        render={({ field }) => (
                          <SearchableSelect
                            id="regional-currency"
                            ariaLabel="Default currency"
                            value={field.value}
                            onValueChange={field.onChange}
                            options={CURRENCY_OPTIONS}
                            placeholder="Select a currency"
                            searchPlaceholder="Search currencies…"
                            disabled={readOnly}
                          />
                        )}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-currency-symbol"
                      label="Currency symbol"
                      hint="Used when the display format shows a symbol."
                      error={errors.currencySymbol?.message}
                    >
                      <Input
                        id="regional-currency-symbol"
                        placeholder="৳"
                        maxLength={8}
                        aria-invalid={Boolean(errors.currencySymbol)}
                        aria-describedby={
                          errors.currencySymbol
                            ? "regional-currency-symbol-error"
                            : "regional-currency-symbol-hint"
                        }
                        {...register("currencySymbol")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-currency-position"
                      label="Symbol position"
                      error={errors.currencyPosition?.message}
                    >
                      <NativeSelect
                        id="regional-currency-position"
                        ariaLabel="Currency symbol position"
                        options={CURRENCY_POSITION_OPTIONS}
                        {...register("currencyPosition")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-decimal-precision"
                      label="Decimal precision"
                      hint="Number of decimal places shown for amounts."
                      error={errors.decimalPrecision?.message}
                    >
                      <Input
                        id="regional-decimal-precision"
                        type="number"
                        min={0}
                        max={6}
                        step={1}
                        inputMode="numeric"
                        aria-invalid={Boolean(errors.decimalPrecision)}
                        aria-describedby={
                          errors.decimalPrecision
                            ? "regional-decimal-precision-error"
                            : "regional-decimal-precision-hint"
                        }
                        {...register("decimalPrecision", {
                          valueAsNumber: true,
                        })}
                      />
                    </SettingsField>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="regional-thousand-separator"
                      label="Thousand separator"
                      optional
                      error={errors.thousandSeparator?.message}
                    >
                      <Input
                        id="regional-thousand-separator"
                        placeholder=","
                        maxLength={3}
                        className="font-mono"
                        aria-invalid={Boolean(errors.thousandSeparator)}
                        aria-describedby={
                          errors.thousandSeparator
                            ? "regional-thousand-separator-error"
                            : undefined
                        }
                        {...register("thousandSeparator")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-decimal-separator"
                      label="Decimal separator"
                      optional
                      error={errors.decimalSeparator?.message}
                    >
                      <Input
                        id="regional-decimal-separator"
                        placeholder="."
                        maxLength={3}
                        className="font-mono"
                        aria-invalid={Boolean(errors.decimalSeparator)}
                        aria-describedby={
                          errors.decimalSeparator
                            ? "regional-decimal-separator-error"
                            : undefined
                        }
                        {...register("decimalSeparator")}
                      />
                    </SettingsField>
                  </div>
                </SettingsSection>

                <SettingsSection
                  title="Location and locale"
                  description="Default country, timezone, language, and date/time presentation."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="regional-country"
                      label="Default country"
                      error={errors.defaultCountry?.message}
                    >
                      <Controller
                        control={control}
                        name="defaultCountry"
                        render={({ field }) => (
                          <SearchableSelect
                            id="regional-country"
                            ariaLabel="Default country"
                            value={field.value}
                            onValueChange={field.onChange}
                            options={COUNTRY_OPTIONS}
                            placeholder="Select a country"
                            searchPlaceholder="Search countries…"
                            disabled={readOnly}
                          />
                        )}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-language"
                      label="Default language"
                      error={errors.language?.message}
                    >
                      <Controller
                        control={control}
                        name="language"
                        render={({ field }) => (
                          <SearchableSelect
                            id="regional-language"
                            ariaLabel="Default language"
                            value={field.value}
                            onValueChange={field.onChange}
                            options={LANGUAGE_OPTIONS}
                            placeholder="Select a language"
                            searchPlaceholder="Search languages…"
                            disabled={readOnly}
                          />
                        )}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="regional-timezone"
                    label="Timezone"
                    error={errors.timezone?.message}
                  >
                    <Controller
                      control={control}
                      name="timezone"
                      render={({ field }) => (
                        <SearchableSelect
                          id="regional-timezone"
                          ariaLabel="Timezone"
                          value={field.value}
                          onValueChange={field.onChange}
                          options={TIMEZONE_OPTIONS}
                          placeholder="Select a timezone"
                          searchPlaceholder="Search timezones…"
                          disabled={readOnly}
                        />
                      )}
                    />
                  </SettingsField>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="regional-date-format"
                      label="Date format"
                      error={errors.dateFormat?.message}
                    >
                      <NativeSelect
                        id="regional-date-format"
                        ariaLabel="Date format"
                        options={DATE_FORMAT_OPTIONS}
                        {...register("dateFormat")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="regional-time-format"
                      label="Time format"
                      error={errors.timeFormat?.message}
                    >
                      <NativeSelect
                        id="regional-time-format"
                        ariaLabel="Time format"
                        options={TIME_FORMAT_OPTIONS}
                        {...register("timeFormat")}
                      />
                    </SettingsField>
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
              onDiscard={() => reset(toRegionalSettingsFormValues(settings))}
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
                  <Globe2 className="size-4" aria-hidden="true" />
                </span>
                <div>
                  <p className="text-sm font-semibold">Live preview</p>
                  <p className="text-muted-foreground text-xs">
                    Based on the values in this form
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4">
                <div className="border-border-subtle rounded-lg border p-3.5">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <Coins className="size-3.5" aria-hidden="true" />
                    Currency
                  </p>
                  <p className="mt-1.5 text-lg font-semibold tracking-tight">
                    {previewAmount}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-xs">
                    {values.currency} · {values.decimalPrecision} decimal
                    {values.decimalPrecision === 1 ? "" : "s"}
                  </p>
                </div>

                <div className="border-border-subtle rounded-lg border p-3.5">
                  <p className="text-muted-foreground flex items-center gap-1.5 text-xs font-medium">
                    <CalendarClock className="size-3.5" aria-hidden="true" />
                    Date and time
                  </p>
                  <p className="mt-1.5 text-sm font-semibold">
                    {formatDatePattern(PREVIEW_DATE, values.dateFormat)}
                  </p>
                  <p className="text-muted-foreground mt-0.5 text-sm">
                    {formatTimePattern(PREVIEW_DATE, values.timeFormat)}
                  </p>
                  <p className="text-muted-foreground mt-1 text-xs">
                    {values.timezone} · {values.language}
                  </p>
                </div>

                <p className="text-muted-foreground text-xs leading-relaxed">
                  These defaults apply to future display. Historical order and
                  invoice amounts keep the values stored when they were created.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore regional defaults?"
        description="This resets currency, country, timezone, language, and formatting to the backend defaults. Existing financial records are not recalculated."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
