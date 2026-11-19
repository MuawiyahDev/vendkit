import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

export interface Customer {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerListResponse {
  data: Customer[];
  meta: PaginationMeta;
}

export interface CustomerDuplicateMatch {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  city: string | null;
  ordersCount: number;
  lastOrderAt: string | null;
  createdAt: string;
}

export interface CustomerDuplicateResponse {
  matches: CustomerDuplicateMatch[];
}

export interface CsvExport {
  fileName: string;
  content: string;
}

export type CustomerSortField = "createdAt" | "updatedAt" | "name";
export type SortOrder = "asc" | "desc";

export interface CustomerListParams {
  page?: number;
  limit?: number;
  search?: string;
  sortBy?: CustomerSortField;
  sortOrder?: SortOrder;
}

/**
 * Payload accepted by the NestJS create/update customer DTOs.
 * Optional fields are `null` when cleared.
 */
export interface CustomerInput {
  name: string;
  phone: string;
  email: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  notes: string | null;
}

export type OrderStatus =
  | "PENDING"
  | "CONFIRMED"
  | "PROCESSING"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

export type PaymentStatus = "UNPAID" | "PARTIALLY_PAID" | "PAID";

export interface CustomerOrderSummary {
  id: string;
  orderNumber: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  currency: string;
  totalAmount: string;
  amountPaid: string;
  createdAt: string;
}

export interface CustomerOrderHistoryResponse {
  data: CustomerOrderSummary[];
  meta: PaginationMeta;
}

interface RequestOptions {
  signal?: AbortSignal;
}

export async function listCustomers(
  params: CustomerListParams = {},
  { signal }: RequestOptions = {},
): Promise<CustomerListResponse> {
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
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  return apiFetch<CustomerListResponse>(
    `/api/customers${query ? `?${query}` : ""}`,
    { signal },
  );
}

export async function getCustomer(
  id: string,
  { signal }: RequestOptions = {},
): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${id}`, { signal });
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  return apiFetch<Customer>("/api/customers", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateCustomer(
  id: string,
  input: CustomerInput,
): Promise<Customer> {
  return apiFetch<Customer>(`/api/customers/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteCustomer(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/customers/${id}`, { method: "DELETE" });
}

export async function findCustomerDuplicates(
  phone: string,
  excludeId?: string,
  { signal }: RequestOptions = {},
): Promise<CustomerDuplicateResponse> {
  const searchParams = new URLSearchParams({ phone });
  if (excludeId) {
    searchParams.set("excludeId", excludeId);
  }

  return apiFetch<CustomerDuplicateResponse>(
    `/api/customers/duplicates?${searchParams.toString()}`,
    { signal },
  );
}

export async function exportCustomersCsv(
  params: Omit<CustomerListParams, "page" | "limit"> = {},
): Promise<CsvExport> {
  const searchParams = new URLSearchParams();

  if (params.search) {
    searchParams.set("search", params.search);
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  const query = searchParams.toString();
  return apiFetch<CsvExport>(
    `/api/customers/export${query ? `?${query}` : ""}`,
  );
}

export async function getCustomerOrderHistory(
  id: string,
  page = 1,
  { signal }: RequestOptions = {},
): Promise<CustomerOrderHistoryResponse> {
  const searchParams = new URLSearchParams({ page: String(page) });
  return apiFetch<CustomerOrderHistoryResponse>(
    `/api/customers/${id}/orders?${searchParams.toString()}`,
    { signal },
  );
}
