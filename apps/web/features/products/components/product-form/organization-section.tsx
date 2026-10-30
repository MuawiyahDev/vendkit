"use client";

import { AlertCircle, RotateCcw } from "lucide-react";

import { FieldError } from "@/components/shared/field-error";
import { NativeSelect, type SelectOption } from "@/components/shared/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";

import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

interface OrganizationSectionProps {
  form: ProductFormApi;
  categoryOptions: SelectOption[];
  brandOptions: SelectOption[];
  optionsLoading: boolean;
  optionsError: string | null;
  onRetryOptions: () => void;
}

/** Catalog placement: category (required) and brand (optional). */
export function OrganizationSection({
  form,
  categoryOptions,
  brandOptions,
  optionsLoading,
  optionsError,
  onRetryOptions,
}: OrganizationSectionProps) {
  const { register, errors, isSubmitting } = form;

  return (
    <FormSection
      title="Product organization"
      description="Place the product in your catalog. Category is required; brand is optional."
    >
      {optionsError ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            <span>{optionsError}</span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={onRetryOptions}
            >
              <RotateCcw aria-hidden="true" />
              Retry
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-category">
            Category
            <span className="text-destructive" aria-hidden="true">
              *
            </span>
          </Label>
          <NativeSelect
            id="product-category"
            ariaLabel="Category"
            placeholder={
              optionsLoading ? "Loading categories…" : "Select a category"
            }
            disabled={isSubmitting || optionsLoading}
            aria-invalid={Boolean(errors.categoryId)}
            aria-describedby={
              errors.categoryId ? "product-category-error" : undefined
            }
            options={categoryOptions}
            {...register("categoryId")}
          />
          <FieldError
            id="product-category-error"
            message={errors.categoryId?.message}
          />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-brand">
            Brand{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <NativeSelect
            id="product-brand"
            ariaLabel="Brand"
            placeholder={optionsLoading ? "Loading brands…" : "No brand"}
            disabled={isSubmitting || optionsLoading}
            aria-invalid={Boolean(errors.brandId)}
            aria-describedby={
              errors.brandId ? "product-brand-error" : undefined
            }
            options={brandOptions}
            {...register("brandId")}
          />
          <FieldError
            id="product-brand-error"
            message={errors.brandId?.message}
          />
        </div>
      </div>
    </FormSection>
  );
}
