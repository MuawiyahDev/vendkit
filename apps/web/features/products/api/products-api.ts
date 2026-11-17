import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

/** Relation summary returned for a product's category and brand. */
export interface ProductRelationSummary {
  id: string;
  name: string;
  slug: string;
}

/** The image payload attached to each product-image association. */
export interface ProductImageDetails {
  id: string;
  originalName: string;
  mimeType: string;
  size: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  url: string;
}

/**
 * A product-image association. `sortOrder` defines the display order and
 * `isPrimary` marks the first image of the product.
 */
export interface ProductImageAssociation {
  id: string;
  sortOrder: number;
  isPrimary: boolean;
  image: ProductImageDetails;
}

/** Product shape returned by the NestJS products endpoints. */
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  sku: string | null;
  category: ProductRelationSummary;
  brand: ProductRelationSummary | null;
  unit: string | null;
  sellingPrice: string;
  compareAtPrice: string | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
  trackInventory: boolean;
  weight: string | null;
  length: string | null;
  width: string | null;
  height: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  images: ProductImageAssociation[];
}

export interface ProductListResponse {
  data: Product[];
  meta: PaginationMeta;
}

export type ProductSortField =
  | "createdAt"
  | "updatedAt"
  | "name"
  | "sellingPrice"
  | "stockQuantity";

export type SortOrder = "asc" | "desc";

export interface ProductListParams {
  page?: number;
  limit?: number;
  search?: string;
  categoryId?: string;
  brandId?: string;
  /** Batch product lookup used by the order editor. */
  ids?: string[];
  isActive?: boolean;
  lowStock?: boolean;
  minPrice?: number;
  maxPrice?: number;
  sortBy?: ProductSortField;
  sortOrder?: SortOrder;
}

/**
 * Payload accepted by the NestJS CreateProductDto. Optional fields are
 * omitted rather than sent as null.
 */
export interface ProductCreateInput {
  name: string;
  slug?: string;
  description?: string;
  shortDescription?: string;
  sku?: string;
  categoryId: string;
  brandId?: string;
  unit?: string;
  sellingPrice: number;
  compareAtPrice?: number;
  stockQuantity?: number;
  lowStockThreshold?: number;
  trackInventory?: boolean;
  weight?: number;
  length?: number;
  width?: number;
  height?: number;
  isActive?: boolean;
  /** Ordered image ids; the first one becomes the primary image. */
  imageIds?: string[];
}

/** Payload accepted by the NestJS UpdateProductDto. `null` clears a field. */
export interface ProductUpdateInput {
  name?: string;
  slug?: string;
  description?: string | null;
  shortDescription?: string | null;
  sku?: string | null;
  categoryId?: string;
  brandId?: string | null;
  unit?: string | null;
  sellingPrice?: number;
  compareAtPrice?: number | null;
  stockQuantity?: number;
  lowStockThreshold?: number | null;
  trackInventory?: boolean;
  weight?: number | null;
  length?: number | null;
  width?: number | null;
  height?: number | null;
  isActive?: boolean;
}

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listProducts(
  params: ProductListParams = {},
  { signal }: RequestOptions = {},
): Promise<ProductListResponse> {
  const searchParams = new URLSearchParams();

  if (params.page !== undefined) {
    searchParams.set("page", String(params.page));
  }
  if (params.limit !== undefined) {
    searchParams.set("limit", String(params.limit));
  }
  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.categoryId) {
    searchParams.set("categoryId", params.categoryId);
  }
  if (params.brandId) {
    searchParams.set("brandId", params.brandId);
  }
  if (params.ids && params.ids.length > 0) {
    searchParams.set("ids", params.ids.join(","));
  }
  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }
  if (params.lowStock !== undefined) {
    searchParams.set("lowStock", String(params.lowStock));
  }
  if (params.minPrice !== undefined) {
    searchParams.set("minPrice", String(params.minPrice));
  }
  if (params.maxPrice !== undefined) {
    searchParams.set("maxPrice", String(params.maxPrice));
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  return apiFetch<ProductListResponse>(
    `/api/products${query ? `?${query}` : ""}`,
    { signal },
  );
}

export async function getProduct(
  id: string,
  { signal }: RequestOptions = {},
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, { signal });
}

export async function createProduct(
  input: ProductCreateInput,
): Promise<Product> {
  return apiFetch<Product>("/api/products", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateProduct(
  id: string,
  input: ProductUpdateInput,
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteProduct(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/products/${id}`, { method: "DELETE" });
}

/**
 * Replaces the entire ordered image list of a product. This only changes
 * associations — the underlying library images are never deleted.
 */
export async function replaceProductImages(
  id: string,
  imageIds: string[],
): Promise<Product> {
  return apiFetch<Product>(`/api/products/${id}/images`, {
    method: "PUT",
    body: JSON.stringify({ imageIds }),
  });
}

/**
 * Detaches a single image from a product. The library image itself is
 * never deleted by this operation.
 */
export async function deleteProductImage(
  id: string,
  imageId: string,
): Promise<void> {
  await apiFetch<undefined>(`/api/products/${id}/images/${imageId}`, {
    method: "DELETE",
  });
}
