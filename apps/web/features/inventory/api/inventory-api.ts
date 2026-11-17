import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

export const INVENTORY_STATUSES = [
  "all",
  "in-stock",
  "low-stock",
  "out-of-stock",
  "untracked",
] as const;

export type InventoryStatusFilter = (typeof INVENTORY_STATUSES)[number];

export type StockStatus = Exclude<InventoryStatusFilter, "all">;

export const STOCK_MOVEMENT_TYPES = [
  "INITIAL",
  "MANUAL_INCREASE",
  "MANUAL_DECREASE",
  "SET",
  "ORDER_PLACED",
  "ORDER_UPDATED",
  "ORDER_CANCELLED",
  "ORDER_DELETED",
  "RETURN",
  "DAMAGE",
] as const;

export type StockMovementType = (typeof STOCK_MOVEMENT_TYPES)[number];

export const STOCK_MOVEMENT_REASONS = [
  "INITIAL_STOCK",
  "RESTOCK",
  "PURCHASE",
  "CUSTOMER_RETURN",
  "DAMAGED",
  "LOST",
  "CORRECTION",
  "SALE",
  "ORDER_CANCELLED",
  "ORDER_EDITED",
  "ORDER_DELETED",
  "OTHER",
] as const;

export type StockMovementReason = (typeof STOCK_MOVEMENT_REASONS)[number];

export type StockAdjustmentMode = "increase" | "decrease" | "set";

export type InventorySortField =
  | "name"
  | "sku"
  | "stockQuantity"
  | "lowStockThreshold"
  | "updatedAt";

export type SortOrder = "asc" | "desc";

export interface InventoryItem {
  id: string;
  name: string;
  slug: string;
  sku: string | null;
  category: { id: string; name: string; slug: string };
  image: { id: string; url: string; altText: string | null } | null;
  stockQuantity: number;
  availableQuantity: number;
  lowStockThreshold: number | null;
  trackInventory: boolean;
  status: StockStatus;
  isActive: boolean;
  unit: string | null;
  updatedAt: string;
}

export interface InventoryListResponse {
  data: InventoryItem[];
  meta: PaginationMeta;
}

export interface InventoryOverview {
  totalProducts: number;
  totalAvailableStock: number;
  lowStockProducts: number;
  outOfStockProducts: number;
  untrackedProducts: number;
}

export interface StockMovement {
  id: string;
  productId: string | null;
  productName: string;
  sku: string | null;
  type: StockMovementType;
  reason: StockMovementReason;
  previousQuantity: number;
  quantityChange: number;
  newQuantity: number;
  note: string | null;
  order: { id: string; orderNumber: string; status: string } | null;
  orderNumber: string | null;
  userId: string | null;
  userName: string | null;
  createdAt: string;
}

export interface StockMovementListResponse {
  data: StockMovement[];
  meta: PaginationMeta;
}

export interface InventoryListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: InventoryStatusFilter;
  sortBy?: InventorySortField;
  sortOrder?: SortOrder;
}

export interface StockMovementListParams {
  page?: number;
  limit?: number;
  search?: string;
  productId?: string;
  orderId?: string;
  type?: StockMovementType;
  reason?: StockMovementReason;
  dateFrom?: string;
  dateTo?: string;
  sortOrder?: SortOrder;
}

export interface StockAdjustmentInput {
  mode: StockAdjustmentMode;
  quantity: number;
  reason: StockMovementReason;
  note?: string;
  orderNumber?: string;
  idempotencyKey?: string;
}

export interface StockAdjustmentResult {
  item: InventoryItem;
  movement: StockMovement;
}

export interface InventorySettingsInput {
  trackInventory?: boolean;
  lowStockThreshold?: number | null;
}

interface RequestOptions {
  signal?: AbortSignal;
}

function buildListQuery(params: Record<string, string | number | undefined>): string {
  const searchParams = new URLSearchParams();

  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== "") {
      searchParams.set(key, String(value));
    }
  }

  const query = searchParams.toString();
  return query ? `?${query}` : "";
}

export async function listInventory(
  params: InventoryListParams = {},
  { signal }: RequestOptions = {},
): Promise<InventoryListResponse> {
  const query = buildListQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    status: params.status,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  });

  return apiFetch<InventoryListResponse>(`/api/inventory${query}`, { signal });
}

export async function getInventoryOverview({
  signal,
}: RequestOptions = {}): Promise<InventoryOverview> {
  return apiFetch<InventoryOverview>("/api/inventory/overview", { signal });
}

export async function getInventoryItem(
  productId: string,
  { signal }: RequestOptions = {},
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(`/api/inventory/products/${productId}`, {
    signal,
  });
}

export async function adjustStock(
  productId: string,
  input: StockAdjustmentInput,
): Promise<StockAdjustmentResult> {
  return apiFetch<StockAdjustmentResult>(
    `/api/inventory/products/${productId}/adjustments`,
    {
      method: "POST",
      body: JSON.stringify(input),
    },
  );
}

export async function updateInventorySettings(
  productId: string,
  input: InventorySettingsInput,
): Promise<InventoryItem> {
  return apiFetch<InventoryItem>(
    `/api/inventory/products/${productId}/settings`,
    {
      method: "PATCH",
      body: JSON.stringify(input),
    },
  );
}

export async function listStockMovements(
  params: StockMovementListParams = {},
  { signal }: RequestOptions = {},
): Promise<StockMovementListResponse> {
  const query = buildListQuery({
    page: params.page,
    limit: params.limit,
    search: params.search,
    productId: params.productId,
    orderId: params.orderId,
    type: params.type,
    reason: params.reason,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortOrder: params.sortOrder,
  });

  return apiFetch<StockMovementListResponse>(`/api/inventory/movements${query}`, {
    signal,
  });
}
