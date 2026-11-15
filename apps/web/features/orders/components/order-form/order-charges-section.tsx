"use client";

import type { FieldErrors, UseFormRegisterReturn } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import type { OrderCreateFormValues } from "../../schemas/orders.schemas";
import type { OrderChargeFieldName } from "./order-form.types";

interface OrderChargesSectionProps {
  register: (name: OrderChargeFieldName) => UseFormRegisterReturn;
  errors: FieldErrors<OrderCreateFormValues>;
  /** Live preview subtotal, used for the discount hint. */
  subtotal: string;
  isSubmitting: boolean;
}

const DISCOUNT_ERROR_ID = "order-form-discount-error";
const SHIPPING_ERROR_ID = "order-form-shipping-error";
const TAX_ERROR_ID = "order-form-tax-error";

/**
 * Order-level charges. The backend validates that the discount does not
 * exceed the subtotal and recomputes the grand total itself.
 */
export function OrderChargesSection({
  register,
  errors,
  subtotal,
  isSubmitting,
}: OrderChargesSectionProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-3">
      <div className="flex flex-col gap-2">
        <Label htmlFor="order-discount-amount">Discount</Label>
        <Input
          id="order-discount-amount"
          inputMode="decimal"
          placeholder="0"
          aria-invalid={Boolean(errors.discountAmount)}
          aria-describedby={
            errors.discountAmount ? DISCOUNT_ERROR_ID : "order-discount-hint"
          }
          disabled={isSubmitting}
          {...register("discountAmount")}
        />
        <p id="order-discount-hint" className="text-muted-foreground text-xs">
          Enter 0 for no discount. Cannot exceed the subtotal ({subtotal}).
        </p>
        <FieldError
          id={DISCOUNT_ERROR_ID}
          message={errors.discountAmount?.message}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-shipping-fee">Shipping fee</Label>
        <Input
          id="order-shipping-fee"
          inputMode="decimal"
          placeholder="0"
          aria-invalid={Boolean(errors.shippingFee)}
          aria-describedby={
            errors.shippingFee ? SHIPPING_ERROR_ID : undefined
          }
          disabled={isSubmitting}
          {...register("shippingFee")}
        />
        <FieldError id={SHIPPING_ERROR_ID} message={errors.shippingFee?.message} />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="order-tax-amount">Tax</Label>
        <Input
          id="order-tax-amount"
          inputMode="decimal"
          placeholder="0"
          aria-invalid={Boolean(errors.taxAmount)}
          aria-describedby={errors.taxAmount ? TAX_ERROR_ID : undefined}
          disabled={isSubmitting}
          {...register("taxAmount")}
        />
        <FieldError id={TAX_ERROR_ID} message={errors.taxAmount?.message} />
      </div>
    </div>
  );
}
