"use client";

import { FieldError } from "@/components/shared/field-error";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

import {
  PRODUCT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_NAME_MAX_LENGTH,
  PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH,
  PRODUCT_SKU_MAX_LENGTH,
  PRODUCT_SLUG_MAX_LENGTH,
} from "../../schemas/products.schemas";
import type { ProductFormApi } from "./product-form.types";
import { FormSection } from "./form-section";

/** Name, slug, SKU, and descriptions — how the product is identified. */
export function BasicInformationSection({ form }: { form: ProductFormApi }) {
  const { register, errors, isSubmitting, mode } = form;

  return (
    <FormSection
      title="Basic information"
      description="How the product is identified and described in your catalog."
    >
      <div className="flex flex-col gap-2">
        <Label htmlFor="product-name">
          Name
          <span className="text-destructive" aria-hidden="true">
            *
          </span>
        </Label>
        <Input
          id="product-name"
          placeholder="e.g. Cotton Crew T-Shirt"
          autoComplete="off"
          required
          aria-required="true"
          maxLength={PRODUCT_NAME_MAX_LENGTH}
          aria-invalid={Boolean(errors.name)}
          aria-describedby={errors.name ? "product-name-error" : undefined}
          disabled={isSubmitting}
          {...register("name")}
        />
        <FieldError id="product-name-error" message={errors.name?.message} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="product-slug">
            Slug{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-slug"
            placeholder="cotton-crew-t-shirt"
            autoComplete="off"
            spellCheck={false}
            maxLength={PRODUCT_SLUG_MAX_LENGTH}
            aria-invalid={Boolean(errors.slug)}
            aria-describedby={
              errors.slug ? "product-slug-error" : "product-slug-help"
            }
            disabled={isSubmitting}
            {...register("slug")}
          />
          <p id="product-slug-help" className="text-muted-foreground text-xs">
            {mode === "create"
              ? "Leave blank to generate one from the name."
              : "Leave blank to keep the current slug."}
          </p>
          <FieldError id="product-slug-error" message={errors.slug?.message} />
        </div>

        <div className="flex flex-col gap-2">
          <Label htmlFor="product-sku">
            SKU{" "}
            <span className="text-muted-foreground font-normal">(optional)</span>
          </Label>
          <Input
            id="product-sku"
            placeholder="TS-CREW-001"
            autoComplete="off"
            spellCheck={false}
            maxLength={PRODUCT_SKU_MAX_LENGTH}
            className="uppercase"
            aria-invalid={Boolean(errors.sku)}
            aria-describedby={
              errors.sku ? "product-sku-error" : "product-sku-help"
            }
            disabled={isSubmitting}
            {...register("sku")}
          />
          <p id="product-sku-help" className="text-muted-foreground text-xs">
            Must be unique. Stored in uppercase.
          </p>
          <FieldError id="product-sku-error" message={errors.sku?.message} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-short-description">
          Short description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="product-short-description"
          rows={2}
          maxLength={PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH}
          placeholder="One-line summary shown alongside the product."
          aria-invalid={Boolean(errors.shortDescription)}
          aria-describedby={
            errors.shortDescription
              ? "product-short-description-error"
              : undefined
          }
          disabled={isSubmitting}
          {...register("shortDescription")}
        />
        <FieldError
          id="product-short-description-error"
          message={errors.shortDescription?.message}
        />
      </div>

      <div className="flex flex-col gap-2">
        <Label htmlFor="product-description">
          Description{" "}
          <span className="text-muted-foreground font-normal">(optional)</span>
        </Label>
        <Textarea
          id="product-description"
          rows={4}
          maxLength={PRODUCT_DESCRIPTION_MAX_LENGTH}
          placeholder="Full product description, materials, care instructions…"
          aria-invalid={Boolean(errors.description)}
          aria-describedby={
            errors.description ? "product-description-error" : undefined
          }
          disabled={isSubmitting}
          {...register("description")}
        />
        <FieldError
          id="product-description-error"
          message={errors.description?.message}
        />
      </div>
    </FormSection>
  );
}
