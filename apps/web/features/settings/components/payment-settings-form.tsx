"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { CreditCard, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

import { NativeSelect } from "@/components/shared/native-select";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { PAYMENT_METHOD_OPTIONS } from "../constants/settings-options";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  paymentSettingsFormSchema,
  toPaymentSettingsFormValues,
  toPaymentUpdateInput,
  type PaymentSettingsFormPayload,
  type PaymentSettingsFormValues,
} from "../schemas/payment.schema";
import type { PaymentMethod, PaymentSettings } from "../settings.types";
import { SettingsField } from "./settings-field";
import { SettingsFormActions } from "./settings-form-actions";
import { SettingsFormFeedback } from "./settings-form-feedback";
import { SettingsRestoreDialog } from "./settings-restore-dialog";
import { SettingsSection } from "./settings-section";
import { SettingsSwitchField } from "./settings-switch-field";

const FORM_ID = "settings-payment-form";

interface PaymentSettingsFormProps {
  settings: PaymentSettings;
  readOnly: boolean;
  onSaved: (settings: PaymentSettings) => void;
}

export function PaymentSettingsForm({
  settings,
  readOnly,
  onSaved,
}: PaymentSettingsFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const mutation = useSettingsMutation<"payment">({
    category: "payment",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<PaymentSettingsFormValues, unknown, PaymentSettingsFormPayload>({
    resolver: zodResolver(paymentSettingsFormSchema),
    defaultValues: toPaymentSettingsFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toPaymentSettingsFormValues(settings));
  }, [settings, reset]);

  const values = useWatch({ control }) as PaymentSettingsFormValues;
  const enabledOptions = PAYMENT_METHOD_OPTIONS.filter((method) =>
    values.enabledMethods.includes(method.value),
  );

  function setMethodEnabled(method: PaymentMethod, enabled: boolean) {
    const next = enabled
      ? [...values.enabledMethods, method]
      : values.enabledMethods.filter((value) => value !== method);

    setValue("enabledMethods", next, {
      shouldDirty: true,
      shouldValidate: true,
    });

    if (!next.includes(values.defaultMethod) && next[0]) {
      setValue("defaultMethod", next[0], {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }

  const onSubmit = handleSubmit(async (payload) => {
    await mutation.save(toPaymentUpdateInput(payload));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toPaymentSettingsFormValues(restored));
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
                  title="Payment methods"
                  description="Methods that can be selected when recording payments against orders."
                >
                  <div className="flex flex-col gap-3">
                    {PAYMENT_METHOD_OPTIONS.map((method) => {
                      const isEnabled = values.enabledMethods.includes(
                        method.value,
                      );
                      const isLastEnabled =
                        isEnabled && values.enabledMethods.length === 1;

                      return (
                        <SettingsSwitchField
                          key={method.value}
                          id={`payment-method-${method.value.toLowerCase()}`}
                          label={method.label}
                          description={method.description}
                          checked={isEnabled}
                          onCheckedChange={(checked) =>
                            setMethodEnabled(method.value, checked)
                          }
                          disabled={readOnly || isLastEnabled}
                        />
                      );
                    })}
                  </div>

                  <p className="text-muted-foreground text-xs">
                    At least one payment method must remain enabled.
                  </p>

                  <SettingsField
                    id="payment-default-method"
                    label="Default payment method"
                    hint="Preselected when recording a new payment."
                    error={errors.defaultMethod?.message}
                  >
                    <NativeSelect
                      id="payment-default-method"
                      ariaLabel="Default payment method"
                      options={enabledOptions.map((method) => ({
                        value: method.value,
                        label: method.label,
                      }))}
                      {...register("defaultMethod")}
                    />
                  </SettingsField>
                </SettingsSection>

                <SettingsSection
                  title="Bank transfer details"
                  description="Displayed to the business when bank transfer details are needed. Do not enter card numbers, CVVs, or provider secrets."
                >
                  <div className="grid gap-4 sm:grid-cols-2">
                    <SettingsField
                      id="payment-bank-account-name"
                      label="Account name"
                      optional
                      error={errors.bankAccountName?.message}
                    >
                      <Input
                        id="payment-bank-account-name"
                        placeholder="Name on the bank account"
                        maxLength={200}
                        aria-invalid={Boolean(errors.bankAccountName)}
                        aria-describedby={
                          errors.bankAccountName
                            ? "payment-bank-account-name-error"
                            : undefined
                        }
                        {...register("bankAccountName")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="payment-bank-name"
                      label="Bank name"
                      optional
                      error={errors.bankName?.message}
                    >
                      <Input
                        id="payment-bank-name"
                        placeholder="Bank name"
                        maxLength={200}
                        aria-invalid={Boolean(errors.bankName)}
                        aria-describedby={
                          errors.bankName ? "payment-bank-name-error" : undefined
                        }
                        {...register("bankName")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="payment-account-number"
                      label="Account number"
                      optional
                      error={errors.accountNumber?.message}
                    >
                      <Input
                        id="payment-account-number"
                        placeholder="Bank account number"
                        maxLength={100}
                        aria-invalid={Boolean(errors.accountNumber)}
                        aria-describedby={
                          errors.accountNumber
                            ? "payment-account-number-error"
                            : undefined
                        }
                        {...register("accountNumber")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="payment-branch-name"
                      label="Branch name"
                      optional
                      error={errors.branchName?.message}
                    >
                      <Input
                        id="payment-branch-name"
                        placeholder="Bank branch"
                        maxLength={200}
                        aria-invalid={Boolean(errors.branchName)}
                        aria-describedby={
                          errors.branchName
                            ? "payment-branch-name-error"
                            : undefined
                        }
                        {...register("branchName")}
                      />
                    </SettingsField>

                    <SettingsField
                      id="payment-routing-number"
                      label="Routing number"
                      optional
                      error={errors.routingNumber?.message}
                    >
                      <Input
                        id="payment-routing-number"
                        placeholder="Routing, sort, or equivalent code"
                        maxLength={100}
                        aria-invalid={Boolean(errors.routingNumber)}
                        aria-describedby={
                          errors.routingNumber
                            ? "payment-routing-number-error"
                            : undefined
                        }
                        {...register("routingNumber")}
                      />
                    </SettingsField>
                  </div>

                  <SettingsField
                    id="payment-instructions"
                    label="Payment instructions"
                    optional
                    error={errors.paymentInstructions?.message}
                  >
                    <Textarea
                      id="payment-instructions"
                      rows={3}
                      maxLength={2000}
                      placeholder="Instructions shown for bank transfers or other manual payments."
                      aria-invalid={Boolean(errors.paymentInstructions)}
                      aria-describedby={
                        errors.paymentInstructions
                          ? "payment-instructions-error"
                          : undefined
                      }
                      {...register("paymentInstructions")}
                    />
                  </SettingsField>
                </SettingsSection>

                <SettingsSection
                  title="Payment terms"
                  description="Default terms used for invoices and payment communication."
                >
                  <SettingsField
                    id="payment-default-terms"
                    label="Default payment terms"
                    optional
                    error={errors.defaultPaymentTerms?.message}
                  >
                    <Textarea
                      id="payment-default-terms"
                      rows={2}
                      maxLength={1000}
                      placeholder="e.g. Payment before dispatch."
                      aria-invalid={Boolean(errors.defaultPaymentTerms)}
                      aria-describedby={
                        errors.defaultPaymentTerms
                          ? "payment-default-terms-error"
                          : undefined
                      }
                      {...register("defaultPaymentTerms")}
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
              onDiscard={() => reset(toPaymentSettingsFormValues(settings))}
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
                  <CreditCard className="size-4" aria-hidden="true" />
                </span>
                <p className="text-sm font-semibold">Enabled methods</p>
              </div>
              <ul className="space-y-1.5 text-sm">
                {enabledOptions.map((method) => (
                  <li key={method.value} className="flex items-center gap-2">
                    <span className="bg-success size-1.5 rounded-full" />
                    {method.label}
                    {values.defaultMethod === method.value ? (
                      <span className="bg-primary-soft text-primary-soft-foreground ml-auto rounded-full px-2 py-0.5 text-[0.625rem] font-medium">
                        Default
                      </span>
                    ) : null}
                  </li>
                ))}
              </ul>
              <div className="border-border-subtle mt-4 flex items-start gap-2 border-t pt-3">
                <ShieldCheck
                  className="text-muted-foreground mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                <p className="text-muted-foreground text-xs leading-relaxed">
                  Card numbers, CVVs, passwords, and provider secrets are never
                  stored in ordinary payment settings.
                </p>
              </div>
            </div>
          </aside>
        </div>
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore payment defaults?"
        description="This resets enabled methods, the default method, bank details, and payment terms. Existing order payments are not modified."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
