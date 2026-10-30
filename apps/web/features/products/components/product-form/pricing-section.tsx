"use client";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import {
  OPTIONAL_NUMBER_OPTIONS,
  MAX_PRICE_DECIMAL_PLACES,
} from "../../schemas/products.schemas";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

const PRICE_HINT = `Up to ${MAX_PRICE_DECIMAL_PLACES} decimal places.`;

/** Selling price and optional compare-at (original) price. */
export function PricingSection({ form }: { form: ProductFormApi }) {
  const { register, errors, isSubmitting } = form;

  return (
    <FormSection
      title="Pricing"
      description="Set what customers pay and optionally show a crossed-out original price."
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-selling-price">
            Selling price
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <Input
            id="product-selling-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            aria-required="true"
            aria-invalid={Boolean(errors.sellingPrice)}
            aria-describedby={
              errors.sellingPrice
                ? "product-selling-price-error"
                : "product-selling-price-help"
            }
            disabled={isSubmitting}
            {...register("sellingPrice", { valueAsNumber: true })}
          />
          <p id="product-selling-price-help" className="text-muted-foreground text-xs">
            Required. {PRICE_HINT}
          </p>
          <FieldError
            id="product-selling-price-error"
            message={errors.sellingPrice?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-compare-at-price">
            Compare-at price{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-compare-at-price"
            type="number"
            inputMode="decimal"
            step="0.01"
            min="0"
            placeholder="0.00"
            aria-invalid={Boolean(errors.compareAtPrice)}
            aria-describedby={
              errors.compareAtPrice
                ? "product-compare-at-price-error"
                : "product-compare-at-price-help"
            }
            disabled={isSubmitting}
            {...register("compareAtPrice", OPTIONAL_NUMBER_OPTIONS)}
          />
          <p
            id="product-compare-at-price-help"
            className="text-muted-foreground text-xs"
          >
            Shown crossed out next to the selling price. {PRICE_HINT}
          </p>
          <FieldError
            id="product-compare-at-price-error"
            message={errors.compareAtPrice?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
