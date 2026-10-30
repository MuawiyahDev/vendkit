"use client";

import { Controller } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { OPTIONAL_NUMBER_OPTIONS } from "../../schemas/products.schemas";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

const DIMENSION_FIELDS = ["length", "width", "height"] as const;

/**
 * Optional package details plus the active status, where supported by the
 * backend product DTO.
 */
export function AdditionalDetailsSection({
  form,
}: {
  form: ProductFormApi;
}) {
  const { control, register, errors, isSubmitting } = form;

  return (
    <FormSection
      title="Additional details"
      description="Optional package dimensions and whether the product is available in your catalog."
    >
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-weight">
            Weight{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-weight"
            type="number"
            inputMode="decimal"
            step="0.001"
            min="0"
            placeholder="0.000"
            aria-invalid={Boolean(errors.weight)}
            aria-describedby={
              errors.weight ? "product-weight-error" : "product-weight-help"
            }
            disabled={isSubmitting}
            {...register("weight", OPTIONAL_NUMBER_OPTIONS)}
          />
          <p id="product-weight-help" className="text-muted-foreground text-xs">
            Stored as a decimal value.
          </p>
          <FieldError
            id="product-weight-error"
            message={errors.weight?.message}
          />
        </div>

        {DIMENSION_FIELDS.map((field) => (
          <div key={field} className="flex flex-col gap-2">
            <Label htmlFor={`product-${field}`}>
              {field.charAt(0).toUpperCase() + field.slice(1)}{" "}
              <span className="text-muted-foreground font-normal">
                (optional)
              </span>
            </Label>
            <Input
              id={`product-${field}`}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              placeholder="0.00"
              aria-invalid={Boolean(errors[field])}
              aria-describedby={
                errors[field]
                  ? `product-${field}-error`
                  : `product-${field}-help`
              }
              disabled={isSubmitting}
              {...register(field, OPTIONAL_NUMBER_OPTIONS)}
            />
            <p
              id={`product-${field}-help`}
              className="text-muted-foreground text-xs"
            >
              Stored as a decimal value.
            </p>
            <FieldError
              id={`product-${field}-error`}
              message={errors[field]?.message}
            />
          </div>
        ))}
      </div>

      <div className="border-border-subtle bg-surface-muted/50 flex items-start gap-3 rounded-lg border p-3.5">
        <Controller
          control={control}
          name="isActive"
          render={({ field }) => (
            <Checkbox
              id="product-is-active"
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
              onBlur={field.onBlur}
              disabled={isSubmitting}
              aria-describedby="product-is-active-description"
              className="mt-0.5"
            />
          )}
        />
        <div className="flex flex-col gap-1">
          <Label htmlFor="product-is-active" className="cursor-pointer leading-snug">
            Active
          </Label>
          <p
            id="product-is-active-description"
            className="text-muted-foreground text-xs leading-relaxed"
          >
            Inactive products stay in your catalog but are marked as
            unavailable.
          </p>
        </div>
      </div>
    </FormSection>
  );
}
