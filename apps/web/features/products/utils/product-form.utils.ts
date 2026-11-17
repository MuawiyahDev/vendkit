import type { PickedImage } from "@/features/images/api/images-api";

import type {
  Product,
  ProductCreateInput,
  ProductUpdateInput,
} from "../api/products-api";
import type {
  ProductFormPayload,
  ProductFormValues,
} from "../schemas/products.schemas";
import { getProductPickedImages } from "./products.utils";

/**
 * Maps an existing product (or a blank form) to form default values so
 * edit mode restores every stored value, including image associations.
 */
export function toProductFormValues(product?: Product | null): ProductFormValues {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    sku: product?.sku ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    sellingPrice: product ? Number(product.sellingPrice) : 0,
    compareAtPrice:
      product?.compareAtPrice !== null && product?.compareAtPrice !== undefined
        ? Number(product.compareAtPrice)
        : null,
    stockQuantity: product?.stockQuantity ?? null,
    lowStockThreshold: product?.lowStockThreshold ?? null,
    trackInventory: product?.trackInventory ?? true,
    weight: product?.weight !== null && product?.weight !== undefined ? Number(product.weight) : null,
    length: product?.length !== null && product?.length !== undefined ? Number(product.length) : null,
    width: product?.width !== null && product?.width !== undefined ? Number(product.width) : null,
    height: product?.height !== null && product?.height !== undefined ? Number(product.height) : null,
    categoryId: product?.category.id ?? "",
    brandId: product?.brand?.id ?? "",
    unit: product?.unit ?? "",
    isActive: product?.isActive ?? true,
    images: product ? getProductPickedImages(product) : [],
  };
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : undefined;
}

function emptyToNull(value: string | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed.length > 0 ? trimmed : null;
}

function orderedImageIds(images: PickedImage[]): string[] {
  return images.map((image) => image.id);
}

/** Builds the NestJS CreateProductDto payload from validated form values. */
export function toProductCreateInput(
  values: ProductFormPayload,
): ProductCreateInput {
  const imageIds = orderedImageIds(values.images);

  return {
    name: values.name,
    sellingPrice: values.sellingPrice,
    categoryId: values.categoryId,
    isActive: values.isActive,
    trackInventory: values.trackInventory,
    ...(emptyToUndefined(values.slug) ? { slug: values.slug } : {}),
    ...(emptyToUndefined(values.sku) ? { sku: values.sku } : {}),
    ...(emptyToUndefined(values.shortDescription)
      ? { shortDescription: values.shortDescription }
      : {}),
    ...(emptyToUndefined(values.description)
      ? { description: values.description }
      : {}),
    ...(values.brandId ? { brandId: values.brandId } : {}),
    ...(emptyToUndefined(values.unit) ? { unit: values.unit } : {}),
    ...(values.compareAtPrice !== null && values.compareAtPrice !== undefined
      ? { compareAtPrice: values.compareAtPrice }
      : {}),
    ...(values.stockQuantity !== null && values.stockQuantity !== undefined
      ? { stockQuantity: values.stockQuantity }
      : {}),
    ...(values.lowStockThreshold !== null &&
    values.lowStockThreshold !== undefined
      ? { lowStockThreshold: values.lowStockThreshold }
      : {}),
    ...(values.weight !== null && values.weight !== undefined
      ? { weight: values.weight }
      : {}),
    ...(values.length !== null && values.length !== undefined
      ? { length: values.length }
      : {}),
    ...(values.width !== null && values.width !== undefined
      ? { width: values.width }
      : {}),
    ...(values.height !== null && values.height !== undefined
      ? { height: values.height }
      : {}),
    ...(imageIds.length > 0 ? { imageIds } : {}),
  };
}

/**
 * Builds the NestJS UpdateProductDto payload from validated form values.
 * Cleared optional fields are sent as `null` so the backend resets them;
 * an omitted slug keeps the current one.
 */
export function toProductUpdateInput(
  values: ProductFormPayload,
): ProductUpdateInput {
  return {
    name: values.name,
    sellingPrice: values.sellingPrice,
    categoryId: values.categoryId,
    isActive: values.isActive,
    trackInventory: values.trackInventory,
    ...(emptyToUndefined(values.slug) ? { slug: values.slug } : {}),
    sku: emptyToNull(values.sku),
    description: emptyToNull(values.description),
    shortDescription: emptyToNull(values.shortDescription),
    brandId: emptyToNull(values.brandId),
    unit: emptyToNull(values.unit),
    compareAtPrice: values.compareAtPrice ?? null,
    stockQuantity: values.stockQuantity ?? 0,
    lowStockThreshold: values.lowStockThreshold ?? null,
    weight: values.weight ?? null,
    length: values.length ?? null,
    width: values.width ?? null,
    height: values.height ?? null,
  };
}
