"use client";

import type { ReactNode } from "react";
import type { UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { OrderShippingFieldName } from "./order-form.types";

interface OrderChannelSectionProps {
  sourceField: ReactNode;
  register: (
    name: Extract<
      OrderShippingFieldName,
      "shippingCarrier" | "trackingNumber"
    >,
  ) => UseFormRegisterReturn;
  shippingCarrierError?: string;
  trackingNumberError?: string;
  isSubmitting: boolean;
}

const CARRIER_ERROR_ID = "order-form-shipping-carrier-error";
const TRACKING_ERROR_ID = "order-form-tracking-number-error";

/**
 * Where the order came from and how it is being delivered. Carrier and
 * tracking stay optional because many sellers deliver in person.
 */
export function OrderChannelSection({
  sourceField,
  register,
  shippingCarrierError,
  trackingNumberError,
  isSubmitting,
}: OrderChannelSectionProps) {
  return (
    <>
      <div className="flex flex-col gap-2 sm:max-w-xs">
        <Label htmlFor="order-source">Order channel</Label>
        {sourceField}
        <p className="text-muted-foreground text-xs">
          Used to see which channels bring in the most sales.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="order-shipping-carrier">
            Carrier{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="order-shipping-carrier"
            placeholder="e.g. Sundarban Courier"
            aria-invalid={Boolean(shippingCarrierError)}
            aria-describedby={
              shippingCarrierError ? CARRIER_ERROR_ID : undefined
            }
            disabled={isSubmitting}
            {...register("shippingCarrier")}
          />
          <FieldError id={CARRIER_ERROR_ID} message={shippingCarrierError} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="order-tracking-number">
            Tracking number{" "}
            <span className="text-muted-foreground font-normal">
              (optional)
            </span>
          </Label>
          <Input
            id="order-tracking-number"
            placeholder="Consignment or parcel ID"
            aria-invalid={Boolean(trackingNumberError)}
            aria-describedby={
              trackingNumberError ? TRACKING_ERROR_ID : undefined
            }
            disabled={isSubmitting}
            {...register("trackingNumber")}
          />
          <FieldError id={TRACKING_ERROR_ID} message={trackingNumberError} />
        </div>
      </div>
    </>
  );
}
