import type { PickedImage } from "@/features/images/api/images-api";

import type {
  Product,
  ProductImageAssociation,
  ProductSortField,
  SortOrder,
} from "../api/products-api";

/**
 * Low-stock rule for raw values: a product is low on stock when it has a
 * threshold and its quantity has fallen to or below it — mirroring the
 * backend `lowStock` query rule.
 */
export function isLowStockValue(
  stockQuantity: number,
  lowStockThreshold: number | null,
): boolean {
  return (
    lowStockThreshold !== null &&
    Number.isFinite(stockQuantity) &&
    stockQuantity <= lowStockThreshold
  );
}

/**
 * A product is low on stock when it has a threshold and its quantity has
 * fallen to or below it — mirroring the backend `lowStock` query rule.
 */
export function isLowStock(product: Product): boolean {
  return isLowStockValue(product.stockQuantity, product.lowStockThreshold);
}

/**
 * Returns the product's leading image: the one flagged as primary, falling
 * back to the association with the lowest sort order.
 */
export function getPrimaryImage(
  product: Product,
): ProductImageAssociation | null {
  if (product.images.length === 0) {
    return null;
  }
  return (
    product.images.find((association) => association.isPrimary) ??
    product.images[0] ??
    null
  );
}

/** Ordered image ids of a product as stored by the backend. */
export function getProductImageIds(product: Product): string[] {
  return [...product.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((association) => association.image.id);
}

/** Ordered image selections (with metadata) of an existing product. */
export function getProductPickedImages(product: Product): PickedImage[] {
  return [...product.images]
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((association) => ({ ...association.image }));
}

/** True when two ordered image-id lists are identical. */
export function isSameImageOrder(
  a: readonly string[],
  b: readonly string[],
): boolean {
  return a.length === b.length && a.every((id, index) => id === b[index]);
}

/** Column ids whose header click maps to a backend sort field. */
export const SORTABLE_COLUMN_IDS = [
  "createdAt",
  "name",
  "sellingPrice",
  "stockQuantity",
] as const;

/** Maps the server sort state into table sorting state. */
export function toSortingEntry(
  sortBy: ProductSortField,
  sortOrder: SortOrder,
): { id: SortableColumnId; desc: boolean } | null {
  const match = SORTABLE_COLUMN_IDS.find((id) => id === sortBy);
  return match ? { id: match, desc: sortOrder === "desc" } : null;
}

/** Maps a table header toggle back into the server sort parameters. */
export function fromTableSorting(
  sorting: readonly { id: string; desc?: boolean }[],
): { sortBy: ProductSortField; sortOrder: SortOrder } | null {
  const entry = sorting[0];
  if (!entry) {
    return null;
  }
  const match = SORTABLE_COLUMN_IDS.find((id) => id === entry.id);
  return match
    ? { sortBy: match, sortOrder: entry.desc ? "desc" : "asc" }
    : null;
}

export type SortableColumnId = (typeof SORTABLE_COLUMN_IDS)[number];
