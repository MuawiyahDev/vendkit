import { z } from "zod";

import { isPickedImage, type PickedImage } from "@/features/images/api/images-api";

/** Mirrors the length limits defined by the NestJS product DTOs. */
export const PRODUCT_NAME_MAX_LENGTH = 200;
export const PRODUCT_SLUG_MAX_LENGTH = 120;
export const PRODUCT_DESCRIPTION_MAX_LENGTH = 5000;
export const PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH = 300;
export const PRODUCT_SKU_MAX_LENGTH = 64;
export const PRODUCT_UNIT_MAX_LENGTH = 50;
export const MAX_PRICE_DECIMAL_PLACES = 2;
export const MAX_WEIGHT_DECIMAL_PLACES = 3;

/**
 * Rejects numbers written in exponent notation and counts the decimal
 * places of the significant digits the user actually typed.
 */
function hasAtMostDecimalPlaces(value: number, max: number): boolean {
  const text = String(value);
  if (text.includes("e") || text.includes("E")) {
    return false;
  }
  const decimals = text.split(".")[1] ?? "";
  return decimals.length <= max;
}

function decimalConstraint(maxDecimalPlaces: number) {
  return (value: number) =>
    hasAtMostDecimalPlaces(value, maxDecimalPlaces);
}

const priceMessage = `Use at most ${MAX_PRICE_DECIMAL_PLACES} decimal places`;
const weightMessage = `Use at most ${MAX_WEIGHT_DECIMAL_PLACES} decimal places`;

/**
 * Optional decimal field. Empty inputs are stored as `null` by the form
 * (see `OPTIONAL_NUMBER_OPTIONS`) and mapped to null/undefined payloads.
 */
function optionalDecimal(
  maxDecimalPlaces: number,
  decimalMessage: string,
  requiredMessage = "Enter a valid number",
) {
  return z
    .number(requiredMessage)
    .min(0, "Must be 0 or more")
    .refine(decimalConstraint(maxDecimalPlaces), decimalMessage)
    .nullable()
    .optional();
}

function optionalInteger(requiredMessage = "Enter a valid number") {
  return z
    .number(requiredMessage)
    .int("Must be a whole number")
    .min(0, "Must be 0 or more")
    .nullable()
    .optional();
}

/**
 * RHF register options that convert empty number inputs to `null` instead
 * of `NaN`, keeping optional numeric fields easy to validate.
 */
export const OPTIONAL_NUMBER_OPTIONS = {
  setValueAs: (value: unknown): number | null => {
    if (value === null || value === undefined) {
      return null;
    }
    if (typeof value === "number") {
      return Number.isNaN(value) ? null : value;
    }
    const text = String(value).trim();
    return text === "" ? null : Number(text);
  },
} as const;

/**
 * Mirrors the NestJS CreateProductDto/UpdateProductDto validation rules.
 * The brand is optional, the category is required, and `imageIds` carries
 * the ordered library image selections (first image becomes primary).
 */
export const productFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Name is required")
    .max(
      PRODUCT_NAME_MAX_LENGTH,
      `Name must be at most ${PRODUCT_NAME_MAX_LENGTH} characters`,
    ),
  slug: z
    .string()
    .trim()
    .max(
      PRODUCT_SLUG_MAX_LENGTH,
      `Slug must be at most ${PRODUCT_SLUG_MAX_LENGTH} characters`,
    ),
  sku: z
    .string()
    .trim()
    .max(
      PRODUCT_SKU_MAX_LENGTH,
      `SKU must be at most ${PRODUCT_SKU_MAX_LENGTH} characters`,
    )
    .transform((value) => value.toUpperCase()),
  shortDescription: z
    .string()
    .trim()
    .max(
      PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH,
      `Short description must be at most ${PRODUCT_SHORT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
  description: z
    .string()
    .trim()
    .max(
      PRODUCT_DESCRIPTION_MAX_LENGTH,
      `Description must be at most ${PRODUCT_DESCRIPTION_MAX_LENGTH} characters`,
    ),
  sellingPrice: z
    .number("Selling price is required")
    .min(0, "Must be 0 or more")
    .refine(
      decimalConstraint(MAX_PRICE_DECIMAL_PLACES),
      priceMessage,
    ),
  compareAtPrice: optionalDecimal(MAX_PRICE_DECIMAL_PLACES, priceMessage),
  stockQuantity: optionalInteger("Enter a valid whole number"),
  lowStockThreshold: optionalInteger("Enter a valid whole number"),
  trackInventory: z.boolean(),
  weight: optionalDecimal(MAX_WEIGHT_DECIMAL_PLACES, weightMessage),
  length: optionalDecimal(MAX_PRICE_DECIMAL_PLACES, priceMessage),
  width: optionalDecimal(MAX_PRICE_DECIMAL_PLACES, priceMessage),
  height: optionalDecimal(MAX_PRICE_DECIMAL_PLACES, priceMessage),
  categoryId: z.string().min(1, "Select a category"),
  brandId: z.string().optional(),
  unit: z
    .string()
    .trim()
    .max(
      PRODUCT_UNIT_MAX_LENGTH,
      `Unit must be at most ${PRODUCT_UNIT_MAX_LENGTH} characters`,
    ),
  isActive: z.boolean(),
  /**
   * Ordered library image selections; the first image becomes primary.
   * Stored with full metadata so thumbnails survive reopening the form.
   */
  images: z.custom<PickedImage[]>(
    (value) =>
      Array.isArray(value) && value.every((item) => isPickedImage(item)),
    { message: "Invalid image selection" },
  ),
});

export type ProductFormValues = z.input<typeof productFormSchema>;
export type ProductFormPayload = z.output<typeof productFormSchema>;
