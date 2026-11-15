"use client";

import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PhoneInput } from "@/components/ui/phone-input";
import { Textarea } from "@/components/ui/textarea";
import { useDefaultPhoneCountry } from "@/hooks/use-default-phone-country";
import { toPhoneInputValue } from "@/lib/phone";

import type { OrderShippingFieldName } from "./order-form.types";

interface OrderShippingSectionProps {
  register: (
    name: OrderShippingFieldName,
  ) => UseFormRegisterReturn;
  /** Phone control rendered by the owning form through `Controller`. */
  phoneField: ReactNode;
  shippingNameError?: string;
  shippingAddressError?: string;
  shippingCityError?: string;
  shippingPostalCodeError?: string;
  isSubmitting: boolean;
}

interface OrderShippingPhoneFieldProps {
  value: string;
  onChange: (value: string) => void;
  onBlur: () => void;
  error?: string;
  disabled?: boolean;
}

const NAME_ERROR_ID = "order-form-shipping-name-error";
const PHONE_ERROR_ID = "order-form-shipping-phone-error";
const ADDRESS_ERROR_ID = "order-form-shipping-address-error";
const CITY_ERROR_ID = "order-form-shipping-city-error";
const POSTAL_CODE_ERROR_ID = "order-form-shipping-postal-code-error";

export function OrderShippingPhoneField({
  value,
  onChange,
  onBlur,
  error,
  disabled,
}: OrderShippingPhoneFieldProps) {
  const defaultCountry = useDefaultPhoneCountry();

  return (
    <>
      <PhoneInput
        id="order-shipping-phone"
        value={toPhoneInputValue(value, defaultCountry)}
        onChange={onChange}
        onBlur={onBlur}
        defaultCountry={defaultCountry}
        placeholder="Phone number"
        autoComplete="shipping tel"
        aria-invalid={Boolean(error)}
        aria-describedby={error ? PHONE_ERROR_ID : undefined}
        disabled={disabled}
      />
      <FieldError id={PHONE_ERROR_ID} message={error} />
    </>
  );
}

/**
 * Shipping destination for the order. Prefilled from the selected customer
 * when one is picked; leaving the fields empty also falls back to the
 * customer's details on the backend.
 */
export function OrderShippingSection({
  register,
  phoneField,
  shippingNameError,
  shippingAddressError,
  shippingCityError,
  shippingPostalCodeError,
  isSubmitting,
}: OrderShippingSectionProps) {
  return (
    <>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="order-shipping-name">
            Recipient name{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="order-shipping-name"
            placeholder="Who receives the delivery"
            autoComplete="shipping name"
            aria-invalid={Boolean(shippingNameError)}
            aria-describedby={
              shippingNameError ? NAME_ERROR_ID : undefined
            }
            disabled={isSubmitting}
            {...register("shippingName")}
          />
          <FieldError id={NAME_ERROR_ID} message={shippingNameError} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="order-shipping-phone">
            Recipient phone{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          {phoneField}
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-shipping-address">
          Address{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="order-shipping-address"
          placeholder="Street address, house or apartment number"
          autoComplete="shipping street-address"
          rows={2}
          aria-invalid={Boolean(shippingAddressError)}
          aria-describedby={
            shippingAddressError ? ADDRESS_ERROR_ID : undefined
          }
          disabled={isSubmitting}
          {...register("shippingAddress")}
        />
        <FieldError id={ADDRESS_ERROR_ID} message={shippingAddressError} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="order-shipping-city">
            City{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="order-shipping-city"
            placeholder="e.g. Dhaka"
            autoComplete="shipping address-level2"
            aria-invalid={Boolean(shippingCityError)}
            aria-describedby={shippingCityError ? CITY_ERROR_ID : undefined}
            disabled={isSubmitting}
            {...register("shippingCity")}
          />
          <FieldError id={CITY_ERROR_ID} message={shippingCityError} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="order-shipping-postal-code">
            Postal code{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="order-shipping-postal-code"
            placeholder="e.g. 1207"
            autoComplete="shipping postal-code"
            aria-invalid={Boolean(shippingPostalCodeError)}
            aria-describedby={
              shippingPostalCodeError ? POSTAL_CODE_ERROR_ID : undefined
            }
            disabled={isSubmitting}
            {...register("shippingPostalCode")}
          />
          <FieldError
            id={POSTAL_CODE_ERROR_ID}
            message={shippingPostalCodeError}
          />
        </div>
      </div>
    </>
  );
}
