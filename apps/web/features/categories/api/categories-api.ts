import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

/** Category shape returned by the NestJS categories endpoints. */
export interface Category {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CategoryListResponse {
  data: Category[];
  meta: PaginationMeta;
}

export interface CategoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

/** Payload accepted by the NestJS CreateCategoryDto. */
export interface CategoryCreateInput {
  name: string;
  slug?: string;
  isActive: boolean;
}

/** Payload accepted by the NestJS UpdateCategoryDto (all fields optional). */
export type CategoryUpdateInput = Partial<CategoryCreateInput>;

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listCategories(
  params: CategoryListParams = {},
  { signal }: RequestOptions = {},
): Promise<CategoryListResponse> {
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
  return apiFetch<CategoryListResponse>(
    `/api/categories${query ? `?${query}` : ""}`,
    { signal },
  );
}

export async function createCategory(
  input: CategoryCreateInput,
): Promise<Category> {
  return apiFetch<Category>("/api/categories", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCategory(
  id: string,
  input: CategoryUpdateInput,
): Promise<Category> {
  return apiFetch<Category>(`/api/categories/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCategory(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/categories/${id}`, { method: "DELETE" });
}
