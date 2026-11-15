"use client";

import type { ReactNode } from "react";

import { FieldError } from "@/components/shared/field-error";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

import { WHATSAPP_COUNTRY_OPTIONS } from "../whatsapp.constants";
import type {
  WhatsAppPhoneResult,
  WhatsAppRecipientSelection,
  WhatsAppSavedRecipient,
} from "../whatsapp.types";

const COUNTRY_SELECT_ID = "whatsapp-custom-country";
const CUSTOM_PHONE_ID = "whatsapp-custom-phone";
const CUSTOM_PHONE_HINT_ID = "whatsapp-custom-phone-hint";
const CUSTOM_PHONE_ERROR_ID = "whatsapp-custom-phone-error";

interface RecipientOptionProps {
  id: string;
  title: string;
  description: ReactNode;
  checked: boolean;
  disabled?: boolean;
  onSelect: () => void;
}

function RecipientOption({
  id,
  title,
  description,
  checked,
  disabled = false,
  onSelect,
}: RecipientOptionProps) {
  const inputId = `whatsapp-recipient-${id}`;

  return (
    <label
      htmlFor={inputId}
      aria-disabled={disabled}
      className={cn(
        "focus-within:ring-ring/40 flex gap-3 rounded-lg border p-3 transition-[color,background-color,border-color,box-shadow] focus-within:ring-[3px]",
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-border-strong hover:bg-surface-hover/50 cursor-pointer",
        checked
          ? "border-primary/40 bg-primary-soft/30"
          : "border-border-subtle bg-surface",
      )}
    >
      <input
        id={inputId}
        type="radio"
        name="whatsapp-recipient"
        value={id}
        checked={checked}
        disabled={disabled}
        onChange={onSelect}
        className="sr-only"
      />
      <span
        aria-hidden="true"
        className={cn(
          "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border",
          checked
            ? "border-primary bg-primary"
            : "border-border-strong bg-surface",
        )}
      >
        {checked ? (
          <span className="bg-primary-foreground size-1.5 rounded-full" />
        ) : null}
      </span>
      <span className="min-w-0 flex-1">
        <span className="text-foreground block text-sm font-medium">
          {title}
        </span>
        <span className="text-muted-foreground mt-0.5 block text-xs leading-relaxed">
          {description}
        </span>
      </span>
    </label>
  );
}

function getCustomPhoneError(result: WhatsAppPhoneResult): string | null {
  if (result.ok) {
    return null;
  }
  if (result.error === "empty") {
    return null;
  }
  if (result.error === "missing-country") {
    return "Choose a country code or enter the number with an international prefix (+).";
  }
  return "Enter a valid phone number for the selected country.";
}

interface RecipientSelectorProps {
  savedRecipients: WhatsAppSavedRecipient[];
  selection: WhatsAppRecipientSelection;
  onSelectionChange: (selection: WhatsAppRecipientSelection) => void;
  customCountry: string;
  onCustomCountryChange: (country: string) => void;
  customPhone: string;
  onCustomPhoneChange: (phone: string) => void;
  customResult: WhatsAppPhoneResult;
}

export function RecipientSelector({
  savedRecipients,
  selection,
  onSelectionChange,
  customCountry,
  onCustomCountryChange,
  customPhone,
  onCustomPhoneChange,
  customResult,
}: RecipientSelectorProps) {
  const isCustom = selection === "custom";
  const customError = customPhone.trim()
    ? getCustomPhoneError(customResult)
    : null;

  return (
    <section
      aria-labelledby="whatsapp-recipient-heading"
      className="flex flex-col gap-3"
    >
      <div>
        <h3 id="whatsapp-recipient-heading" className="text-sm font-semibold">
          Recipient
        </h3>
        <p className="text-muted-foreground mt-0.5 text-xs leading-relaxed">
          Use the saved customer number or send to another WhatsApp number.
        </p>
      </div>

      <div
        className="flex flex-col gap-2"
        role="radiogroup"
        aria-labelledby="whatsapp-recipient-heading"
      >
        {savedRecipients.length === 0 ? (
          <RecipientOption
            id="customer"
            title="Customer profile"
            description="No saved phone number is available on this order."
            checked={false}
            disabled
            onSelect={() => undefined}
          />
        ) : (
          savedRecipients.map((recipient) => {
            const formatted = recipient.result.ok
              ? recipient.result.phone.formatted
              : recipient.phone;
            const error = recipient.result.ok
              ? null
              : "This number is not valid for WhatsApp.";

            return (
              <RecipientOption
                key={recipient.id}
                id={recipient.id}
                title={recipient.label}
                checked={selection === recipient.id}
                disabled={!recipient.result.ok}
                onSelect={() => onSelectionChange(recipient.id)}
                description={
                  <>
                    <span className="text-foreground font-medium">
                      {recipient.name}
                    </span>
                    <span> · </span>
                    <span className="tabular-nums">{formatted}</span>
                    <span className="mt-0.5 block">
                      {recipient.id === "customer"
                        ? "From the customer's saved profile"
                        : "From this order's shipping details"}
                    </span>
                    {error ? (
                      <span className="text-destructive-soft-foreground mt-0.5 block">
                        {error}
                      </span>
                    ) : null}
                  </>
                }
              />
            );
          })
        )}

        <RecipientOption
          id="custom"
          title="Another number"
          description="Send to a different number without changing the customer's saved phone."
          checked={isCustom}
          onSelect={() => onSelectionChange("custom")}
        />
      </div>

      {isCustom ? (
        <div className="ml-7 flex flex-col gap-2">
          <div className="grid gap-2 sm:grid-cols-[minmax(0,13rem)_minmax(0,1fr)]">
            <SearchableSelect
              id={COUNTRY_SELECT_ID}
              ariaLabel="Country calling code"
              value={customCountry}
              onValueChange={onCustomCountryChange}
              options={WHATSAPP_COUNTRY_OPTIONS}
              placeholder="Select country"
              searchPlaceholder="Search countries…"
              emptyMessage="No matching country."
            />
            <Input
              id={CUSTOM_PHONE_ID}
              type="tel"
              inputMode="tel"
              autoComplete="tel"
              placeholder="e.g. 1712 345678"
              value={customPhone}
              onChange={(event) => onCustomPhoneChange(event.target.value)}
              aria-label="Alternative WhatsApp number"
              aria-invalid={Boolean(customError)}
              aria-describedby={
                customError
                  ? `${CUSTOM_PHONE_HINT_ID} ${CUSTOM_PHONE_ERROR_ID}`
                  : CUSTOM_PHONE_HINT_ID
              }
            />
          </div>

          <p
            id={CUSTOM_PHONE_HINT_ID}
            className="text-muted-foreground text-xs leading-relaxed"
          >
            {customResult.ok
              ? `Will open WhatsApp for ${customResult.phone.formatted}.`
              : "Enter the number with its area code. International numbers starting with + are also accepted."}
          </p>
          <FieldError
            id={CUSTOM_PHONE_ERROR_ID}
            message={customError ?? undefined}
          />
        </div>
      ) : null}
    </section>
  );
}
