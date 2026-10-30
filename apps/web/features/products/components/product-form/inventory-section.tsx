"use client";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  OPTIONAL_NUMBER_OPTIONS,
  PRODUCT_UNIT_MAX_LENGTH,
} from "../../schemas/products.schemas";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

/** Stock on hand, the low-stock warning threshold, and the selling unit. */
export function InventorySection({ form }: { form: ProductFormApi }) {
  const { register, errors, isSubmitting } = form;

  return (
    <FormSection
      title="Inventory"
      description="Track stock on hand and get a low-stock warning when the quantity reaches your threshold."
    >
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-stock-quantity">Stock quantity</Label>
          <Input
            id="product-stock-quantity"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            placeholder="0"
            aria-invalid={Boolean(errors.stockQuantity)}
            aria-describedby={
              errors.stockQuantity
                ? "product-stock-quantity-error"
                : "product-stock-quantity-help"
            }
            disabled={isSubmitting}
            {...register("stockQuantity", OPTIONAL_NUMBER_OPTIONS)}
          />
          <p
            id="product-stock-quantity-help"
            className="text-muted-foreground text-xs"
          >
            Whole number. Blank counts as 0.
          </p>
          <FieldError
            id="product-stock-quantity-error"
            message={errors.stockQuantity?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-low-stock-threshold">
            Low stock threshold{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-low-stock-threshold"
            type="number"
            inputMode="numeric"
            step="1"
            min="0"
            placeholder="5"
            aria-invalid={Boolean(errors.lowStockThreshold)}
            aria-describedby={
              errors.lowStockThreshold
                ? "product-low-stock-threshold-error"
                : "product-low-stock-threshold-help"
            }
            disabled={isSubmitting}
            {...register("lowStockThreshold", OPTIONAL_NUMBER_OPTIONS)}
          />
          <p
            id="product-low-stock-threshold-help"
            className="text-muted-foreground text-xs"
          >
            Warn when stock falls to or below this number.
          </p>
          <FieldError
            id="product-low-stock-threshold-error"
            message={errors.lowStockThreshold?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-unit">
            Unit{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-unit"
            placeholder="e.g. pcs, kg, box"
            autoComplete="off"
            maxLength={PRODUCT_UNIT_MAX_LENGTH}
            aria-invalid={Boolean(errors.unit)}
            aria-describedby={errors.unit ? "product-unit-error" : undefined}
            disabled={isSubmitting}
            {...register("unit")}
          />
          <p className="text-muted-foreground text-xs">
            How the product is sold.
          </p>
          <FieldError id="product-unit-error" message={errors.unit?.message} />
        </div>
      </div>
    </FormSection>
  );
}
