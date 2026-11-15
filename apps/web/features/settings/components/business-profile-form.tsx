"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";

import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { useDefaultPhoneCountry } from "@/hooks/use-default-phone-country";
import { toPhoneInputValue } from "@/lib/phone";
import { SettingsField } from "../components/settings-field";
import { SettingsFormActions } from "../components/settings-form-actions";
import { SettingsFormFeedback } from "../components/settings-form-feedback";
import { SettingsLogoField } from "../components/settings-logo-field";
import { SettingsRestoreDialog } from "../components/settings-restore-dialog";
import { SettingsSection } from "../components/settings-section";
import { useSettingsDirty } from "../hooks/use-settings-dirty";
import { useSettingsMutation } from "../hooks/use-settings-mutation";
import {
  businessProfileFormSchema,
  toBusinessProfileFormValues,
  toBusinessProfileUpdateInput,
  type BusinessProfileFormPayload,
  type BusinessProfileFormValues,
} from "../schemas/business-profile.schema";
import type {
  BusinessProfileSettings,
  RegionalSettings,
} from "../settings.types";

const FORM_ID = "settings-business-profile-form";

interface BusinessProfileFormProps {
  settings: BusinessProfileSettings;
  regional: RegionalSettings;
  readOnly: boolean;
  onSaved: (settings: BusinessProfileSettings) => void;
}

export function BusinessProfileForm({
  settings,
  regional,
  readOnly,
  onSaved,
}: BusinessProfileFormProps) {
  const [restoreOpen, setRestoreOpen] = useState(false);
  const defaultCountry = useDefaultPhoneCountry(regional.defaultCountry);
  const mutation = useSettingsMutation<"business-profile">({
    category: "business-profile",
    onSaved,
  });

  const {
    control,
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isDirty, isSubmitting },
  } = useForm<BusinessProfileFormValues, unknown, BusinessProfileFormPayload>({
    resolver: zodResolver(businessProfileFormSchema),
    defaultValues: toBusinessProfileFormValues(settings),
  });

  useSettingsDirty(isDirty);

  useEffect(() => {
    reset(toBusinessProfileFormValues(settings));
  }, [settings, reset]);

  const logoImageId = useWatch({ control, name: "logoImageId" });
  const logoUrl = useWatch({ control, name: "logoUrl" });

  const onSubmit = handleSubmit(async (values) => {
    await mutation.save(toBusinessProfileUpdateInput(values));
  });

  async function handleRestore() {
    const restored = await mutation.restore();
    if (restored) {
      setRestoreOpen(false);
      reset(toBusinessProfileFormValues(restored));
    }
  }

  return (
    <>
      <form id={FORM_ID} onSubmit={onSubmit} className="flex flex-col gap-5">
        <SettingsFormFeedback
          successMessage={mutation.successMessage}
          error={mutation.error}
          onDismissSuccess={mutation.clearSuccess}
        />

        <fieldset disabled={readOnly} className="min-w-0">
          <Card className="gap-0 overflow-hidden py-0">
            <SettingsSection
              title="Business identity"
              description="The name and logo customers will recognise on documents."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField
                  id="business-name"
                  label="Business name"
                  error={errors.businessName?.message}
                >
                  <Input
                    id="business-name"
                    placeholder="e.g. VendKit"
                    autoComplete="organization"
                    maxLength={200}
                    aria-invalid={Boolean(errors.businessName)}
                    aria-describedby={
                      errors.businessName ? "business-name-error" : undefined
                    }
                    {...register("businessName")}
                  />
                </SettingsField>

                <SettingsField
                  id="business-legal-name"
                  label="Legal business name"
                  optional
                  error={errors.legalName?.message}
                >
                  <Input
                    id="business-legal-name"
                    placeholder="Registered legal name"
                    maxLength={200}
                    aria-invalid={Boolean(errors.legalName)}
                    aria-describedby={
                      errors.legalName ? "business-legal-name-error" : undefined
                    }
                    {...register("legalName")}
                  />
                </SettingsField>
              </div>

              <SettingsLogoField
                id="business-logo"
                label="Business logo"
                logo={
                  logoImageId && logoUrl
                    ? { id: logoImageId, url: logoUrl }
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
            </SettingsSection>

            <SettingsSection
              title="Contact details"
              description="Used on invoices, documents, and business communication."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField
                  id="business-email"
                  label="Business email"
                  optional
                  error={errors.email?.message}
                >
                  <Input
                    id="business-email"
                    type="email"
                    placeholder="billing@example.com"
                    autoComplete="email"
                    maxLength={254}
                    aria-invalid={Boolean(errors.email)}
                    aria-describedby={
                      errors.email ? "business-email-error" : undefined
                    }
                    {...register("email")}
                  />
                </SettingsField>

                <SettingsField
                  id="business-phone"
                  label="Business phone"
                  optional
                  error={errors.phone?.message}
                >
                  <Controller
                    control={control}
                    name="phone"
                    render={({ field }) => (
                      <PhoneInput
                        id="business-phone"
                        name={field.name}
                        value={toPhoneInputValue(field.value, defaultCountry)}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        defaultCountry={defaultCountry}
                        placeholder="Phone number"
                        autoComplete="tel"
                        disabled={readOnly}
                        aria-invalid={Boolean(errors.phone)}
                        aria-describedby={
                          errors.phone ? "business-phone-error" : undefined
                        }
                      />
                    )}
                  />
                </SettingsField>

                <SettingsField
                  id="business-alternative-phone"
                  label="Alternative phone"
                  optional
                  error={errors.alternativePhone?.message}
                >
                  <Controller
                    control={control}
                    name="alternativePhone"
                    render={({ field }) => (
                      <PhoneInput
                        id="business-alternative-phone"
                        name={field.name}
                        value={toPhoneInputValue(field.value, defaultCountry)}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        defaultCountry={defaultCountry}
                        placeholder="Another contact number"
                        autoComplete="tel"
                        disabled={readOnly}
                        aria-invalid={Boolean(errors.alternativePhone)}
                        aria-describedby={
                          errors.alternativePhone
                            ? "business-alternative-phone-error"
                            : undefined
                        }
                      />
                    )}
                  />
                </SettingsField>

                <SettingsField
                  id="business-website"
                  label="Website"
                  optional
                  error={errors.website?.message}
                >
                  <Input
                    id="business-website"
                    type="url"
                    placeholder="https://example.com"
                    autoComplete="url"
                    maxLength={500}
                    aria-invalid={Boolean(errors.website)}
                    aria-describedby={
                      errors.website ? "business-website-error" : undefined
                    }
                    {...register("website")}
                  />
                </SettingsField>
              </div>
            </SettingsSection>

            <SettingsSection
              title="Registration and description"
              description="Optional registration details and a short business description."
            >
              <div className="grid gap-4 sm:grid-cols-2">
                <SettingsField
                  id="business-registration-number"
                  label="Business registration number"
                  optional
                  error={errors.registrationNumber?.message}
                >
                  <Input
                    id="business-registration-number"
                    placeholder="Registration or company number"
                    maxLength={100}
                    aria-invalid={Boolean(errors.registrationNumber)}
                    aria-describedby={
                      errors.registrationNumber
                        ? "business-registration-number-error"
                        : undefined
                    }
                    {...register("registrationNumber")}
                  />
                </SettingsField>

                <SettingsField
                  id="business-tax-id"
                  label="Tax identification number"
                  optional
                  error={errors.taxIdentificationNumber?.message}
                >
                  <Input
                    id="business-tax-id"
                    placeholder="Tax or VAT registration number"
                    maxLength={100}
                    aria-invalid={Boolean(errors.taxIdentificationNumber)}
                    aria-describedby={
                      errors.taxIdentificationNumber
                        ? "business-tax-id-error"
                        : undefined
                    }
                    {...register("taxIdentificationNumber")}
                  />
                </SettingsField>
              </div>

              <SettingsField
                id="business-description"
                label="Business description"
                optional
                error={errors.description?.message}
              >
                <Textarea
                  id="business-description"
                  rows={3}
                  maxLength={2000}
                  placeholder="A short description of what your business does."
                  aria-invalid={Boolean(errors.description)}
                  aria-describedby={
                    errors.description ? "business-description-error" : undefined
                  }
                  {...register("description")}
                />
              </SettingsField>
            </SettingsSection>

            <SettingsSection
              title="Business address"
              description="The primary business address. Invoices can use a different address when configured."
            >
              <div className="grid gap-4">
                <SettingsField
                  id="business-address-line-1"
                  label="Address line 1"
                  optional
                  error={errors.addressLine1?.message}
                >
                  <Input
                    id="business-address-line-1"
                    placeholder="Street address, building, or area"
                    maxLength={500}
                    aria-invalid={Boolean(errors.addressLine1)}
                    aria-describedby={
                      errors.addressLine1
                        ? "business-address-line-1-error"
                        : undefined
                    }
                    {...register("addressLine1")}
                  />
                </SettingsField>

                <SettingsField
                  id="business-address-line-2"
                  label="Address line 2"
                  optional
                  error={errors.addressLine2?.message}
                >
                  <Input
                    id="business-address-line-2"
                    placeholder="Apartment, suite, floor, or landmark"
                    maxLength={500}
                    aria-invalid={Boolean(errors.addressLine2)}
                    aria-describedby={
                      errors.addressLine2
                        ? "business-address-line-2-error"
                        : undefined
                    }
                    {...register("addressLine2")}
                  />
                </SettingsField>

                <div className="grid gap-4 sm:grid-cols-2">
                  <SettingsField
                    id="business-city"
                    label="City"
                    optional
                    error={errors.city?.message}
                  >
                    <Input
                      id="business-city"
                      placeholder="City"
                      maxLength={100}
                      aria-invalid={Boolean(errors.city)}
                      aria-describedby={
                        errors.city ? "business-city-error" : undefined
                      }
                      {...register("city")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="business-state"
                    label="State or province"
                    optional
                    error={errors.state?.message}
                  >
                    <Input
                      id="business-state"
                      placeholder="State or province"
                      maxLength={100}
                      aria-invalid={Boolean(errors.state)}
                      aria-describedby={
                        errors.state ? "business-state-error" : undefined
                      }
                      {...register("state")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="business-postal-code"
                    label="Postal code"
                    optional
                    error={errors.postalCode?.message}
                  >
                    <Input
                      id="business-postal-code"
                      placeholder="Postal or ZIP code"
                      maxLength={20}
                      aria-invalid={Boolean(errors.postalCode)}
                      aria-describedby={
                        errors.postalCode
                          ? "business-postal-code-error"
                          : undefined
                      }
                      {...register("postalCode")}
                    />
                  </SettingsField>

                  <SettingsField
                    id="business-country"
                    label="Country"
                    optional
                    error={errors.country?.message}
                  >
                    <Input
                      id="business-country"
                      placeholder="Country"
                      maxLength={100}
                      aria-invalid={Boolean(errors.country)}
                      aria-describedby={
                        errors.country ? "business-country-error" : undefined
                      }
                      {...register("country")}
                    />
                  </SettingsField>
                </div>
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
          onDiscard={() => reset(toBusinessProfileFormValues(settings))}
          onRestoreDefaults={() => {
            mutation.clearRestoreError();
            setRestoreOpen(true);
          }}
        />
      </form>

      <SettingsRestoreDialog
        open={restoreOpen}
        onOpenChange={setRestoreOpen}
        title="Restore business profile defaults?"
        description="This replaces your business name, contact details, logo, and address with the backend defaults. Existing orders and invoices keep their saved information."
        isRestoring={mutation.isRestoring}
        error={mutation.restoreError}
        onConfirm={() => {
          void handleRestore();
        }}
      />
    </>
  );
}
