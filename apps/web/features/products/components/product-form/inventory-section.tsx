"use client";

import Link from "next/link";
import { Controller, useWatch } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

import {
  OPTIONAL_NUMBER_OPTIONS,
  PRODUCT_UNIT_MAX_LENGTH,
} from "../../schemas/products.schemas";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

/** Stock on hand, the low-stock warning threshold, and the selling unit. */
export function InventorySection({ form }: { form: ProductFormApi }) {
  const { control, register, errors, isSubmitting } = form;
  const trackInventory =
    useWatch({ control, name: "trackInventory" }) ?? true;

  return (
    <FormSection
      title="Inventory"
      description="Track stock on hand and get a low-stock warning when the quantity reaches your threshold."
    >
      <div className="flex items-center justify-between gap-4 rounded-lg border border-border-subtle bg-surface-muted/40 px-3.5 py-3">
        <div className="flex flex-col gap-0.5">
          <Label htmlFor="product-track-inventory">Track inventory</Label>
          <p className="text-muted-foreground text-xs leading-relaxed">
            Check stock before accepting orders and record every change.
          </p>
        </div>
        <Controller
          control={control}
          name="trackInventory"
          render={({ field }) => (
            <Switch
              id="product-track-inventory"
              checked={field.value}
              onCheckedChange={field.onChange}
              disabled={isSubmitting}
            />
          )}
        />
      </div>

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
            disabled={isSubmitting || !trackInventory}
            {...register("stockQuantity", OPTIONAL_NUMBER_OPTIONS)}
          />
          <p
            id="product-stock-quantity-help"
            className="text-muted-foreground text-xs"
          >
            {trackInventory
              ? "Whole number. Blank counts as 0. Changes are recorded in stock history."
              : "Inventory tracking is off. The quantity is kept but not checked."}
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
            disabled={isSubmitting || !trackInventory}
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

      <p className="text-muted-foreground text-xs leading-relaxed">
        Manual adjustments and the full stock movement history live in{" "}
        <Link
          href="/inventory"
          className="text-primary hover:text-primary/80 font-medium underline underline-offset-4"
        >
          Inventory
        </Link>
        .
      </p>
    </FormSection>
  );
}
