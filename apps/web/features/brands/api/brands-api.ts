import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

/** Brand shape returned by the NestJS brands endpoints. */
export interface Brand {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface BrandListResponse {
  data: Brand[];
  meta: PaginationMeta;
}

export interface BrandListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/** Payload accepted by the NestJS CreateBrandDto. */
export interface BrandCreateInput {
  name: string;
  slug?: string;
  isActive: boolean;
}

/** Payload accepted by the NestJS UpdateBrandDto (all fields optional). */
export type BrandUpdateInput = Partial<BrandCreateInput>;

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listBrands(
  params: BrandListParams = {},
  { signal }: RequestOptions = {},
): Promise<BrandListResponse> {
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
  if (params.isActive !== undefined) {
    searchParams.set("isActive", String(params.isActive));
  }

  const query = searchParams.toString();
  return apiFetch<BrandListResponse>(
    `/api/brands${query ? `?${query}` : ""}`,
    { signal },
  );
}

export async function getBrand(id: string): Promise<Brand> {
  return apiFetch<Brand>(`/api/brands/${id}`);
}

export async function createBrand(input: BrandCreateInput): Promise<Brand> {
  return apiFetch<Brand>("/api/brands", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateBrand(
  id: string,
  input: BrandUpdateInput,
): Promise<Brand> {
  return apiFetch<Brand>(`/api/brands/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteBrand(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/brands/${id}`, { method: "DELETE" });
}
