import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

/** Order lifecycle values accepted by the NestJS orders module. */
export const ORDER_STATUSES = [
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];

/** Aggregated payment state derived by the backend from recorded payments. */
export const PAYMENT_STATUSES = [
  "UNPAID",
  "PARTIALLY_PAID",
  "PAID",
] as const;

export type PaymentStatus = (typeof PAYMENT_STATUSES)[number];

export const PAYMENT_METHODS = [
  "CASH",
  "BANK_TRANSFER",
  "MOBILE_FINANCIAL_SERVICE",
  "CARD",
  "OTHER",
] as const;

export type PaymentMethod = (typeof PAYMENT_METHODS)[number];

/** Lifecycle of a single recorded payment against an order. */
export const ORDER_PAYMENT_STATUSES = ["PENDING", "COMPLETED", "FAILED"] as const;

export type OrderPaymentStatus = (typeof ORDER_PAYMENT_STATUSES)[number];

/** Channels an order can originate from. */
export const ORDER_SOURCES = [
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "TIKTOK",
  "WEBSITE",
  "PHONE",
  "WALK_IN",
  "OTHER",
] as const;

export type OrderSource = (typeof ORDER_SOURCES)[number];

/** Timeline milestones returned with the order detail response. */
export const ORDER_EVENT_TYPES = [
  "ORDER_CREATED",
  "DETAILS_UPDATED",
  "ITEMS_UPDATED",
  "STATUS_CHANGED",
  "PAYMENT_RECORDED",
  "PAYMENT_STATUS_CHANGED",
  "RETURN_RECORDED",
  "INVOICE_CREATED",
  "INVOICE_ISSUED",
  "INVOICE_CANCELLED",
] as const;

export type OrderEventType = (typeof ORDER_EVENT_TYPES)[number];

export interface OrderEvent {
  id: string;
  type: OrderEventType;
  message: string;
  metadata: Record<string, unknown> | null;
  actorName: string | null;
  createdAt: string;
}

/** The only payment statuses the create-payment endpoint accepts. */
export const CREATABLE_PAYMENT_STATUSES = ["PENDING", "COMPLETED"] as const;

export interface OrderCustomerSummary {
  id: string;
  name: string;
  phone: string;
  email: string | null;
}

/** Line item as returned by the orders list endpoint (no product id). */
export interface OrderSummaryItem {
  id: string;
  productName: string;
  sku: string | null;
  unitPrice: string;
  quantity: number;
  lineTotal: string;
}

/** Line item as returned by the order detail endpoint. */
export interface OrderItem extends OrderSummaryItem {
  productId: string;
  createdAt: string;
}

export interface OrderPayment {
  id: string;
  amount: string;
  method: PaymentMethod;
  status: OrderPaymentStatus;
  reference: string | null;
  note: string | null;
  paidAt: string | null;
  createdAt: string;
  updatedAt: string;
}

/** Fields shared by the order list and detail responses. */
export interface OrderBase {
  id: string;
  orderNumber: string;
  /**
   * Saved customer attached to the order. `null` for walk-in orders, which
   * carry a `guestName`/`guestPhone` snapshot instead.
   */
  customer: OrderCustomerSummary | null;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  source: OrderSource;
  currency: string;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  amountPaid: string;
  shippingName: string | null;
  shippingPhone: string | null;
  shippingAddress: string | null;
  shippingCity: string | null;
  shippingPostalCode: string | null;
  shippingCarrier: string | null;
  trackingNumber: string | null;
  customerNote: string | null;
  internalNote: string | null;
  cancellationReason: string | null;
  cancelledAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface OrderSummary extends OrderBase {
  items: OrderSummaryItem[];
}

export interface Order extends OrderBase {
  items: OrderItem[];
  payments: OrderPayment[];
  events: OrderEvent[];
}

export interface OrderListResponse {
  data: OrderSummary[];
  meta: PaginationMeta;
}

export type OrderSortField =
  | "createdAt"
  | "updatedAt"
  | "orderNumber"
  | "totalAmount";

export type SortOrder = "asc" | "desc";

export interface OrderListParams {
  page?: number;
  limit?: number;
  search?: string;
  status?: OrderStatus;
  paymentStatus?: PaymentStatus;
  source?: OrderSource;
  customerId?: string;
  dateFrom?: string;
  dateTo?: string;
  sortBy?: OrderSortField;
  sortOrder?: SortOrder;
}

/**
 * Payload accepted by the NestJS CreateOrderDto. Either an existing
 * `customerId` or walk-in `guestName` identifies who the order is for —
 * unit prices, subtotals, and the grand total are computed by the backend
 * from the current product prices, so only quantities and order-level
 * charges are sent from the client.
 */
export interface OrderCreateInput {
  customerId?: string;
  source?: OrderSource;
  items: { productId: string; quantity: number }[];
  discountAmount?: number;
  shippingFee?: number;
  taxAmount?: number;
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customerNote?: string | null;
  internalNote?: string | null;
}

/**
 * Payload accepted by the NestJS UpdateOrderDto. When `items` is provided it
 * replaces the order lines and only the stock delta is applied.
 */
export interface OrderUpdateInput {
  customerId?: string;
  source?: OrderSource;
  items?: { productId: string; quantity: number }[];
  shippingName?: string | null;
  shippingPhone?: string | null;
  shippingAddress?: string | null;
  shippingCity?: string | null;
  shippingPostalCode?: string | null;
  shippingCarrier?: string | null;
  trackingNumber?: string | null;
  customerNote?: string | null;
  internalNote?: string | null;
}

export interface OrderStatusUpdateInput {
  status: OrderStatus;
  cancellationReason?: string | null;
}

/** Payload accepted by the NestJS CreateOrderPaymentDto. */
export interface OrderPaymentCreateInput {
  amount: number;
  method: PaymentMethod;
  status?: (typeof CREATABLE_PAYMENT_STATUSES)[number];
  reference?: string | null;
  note?: string | null;
  paidAt?: string;
}

interface RequestOptions {
  signal?: AbortSignal;
}

function buildOrderListSearchParams(params: OrderListParams): URLSearchParams {
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
  if (params.status) {
    searchParams.set("status", params.status);
  }
  if (params.paymentStatus) {
    searchParams.set("paymentStatus", params.paymentStatus);
  }
  if (params.source) {
    searchParams.set("source", params.source);
  }
  if (params.customerId) {
    searchParams.set("customerId", params.customerId);
  }
  if (params.dateFrom) {
    searchParams.set("dateFrom", params.dateFrom);
  }
  if (params.dateTo) {
    searchParams.set("dateTo", params.dateTo);
  }
  if (params.sortBy) {
    searchParams.set("sortBy", params.sortBy);
  }
  if (params.sortOrder) {
    searchParams.set("sortOrder", params.sortOrder);
  }

  return searchParams;
}

export async function listOrders(
  params: OrderListParams = {},
  { signal }: RequestOptions = {},
): Promise<OrderListResponse> {
  const query = buildOrderListSearchParams(params).toString();
  return apiFetch<OrderListResponse>(`/api/orders${query ? `?${query}` : ""}`, {
    signal,
  });
}

export interface CsvExport {
  fileName: string;
  content: string;
}

export async function exportOrdersCsv(
  params: OrderListParams = {},
): Promise<CsvExport> {
  const filters: OrderListParams = {
    search: params.search,
    status: params.status,
    paymentStatus: params.paymentStatus,
    source: params.source,
    customerId: params.customerId,
    dateFrom: params.dateFrom,
    dateTo: params.dateTo,
    sortBy: params.sortBy,
    sortOrder: params.sortOrder,
  };
  const query = buildOrderListSearchParams(filters).toString();
  return apiFetch<CsvExport>(
    `/api/orders/export${query ? `?${query}` : ""}`,
  );
}

export async function getOrder(
  id: string,
  { signal }: RequestOptions = {},
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`, { signal });
}

export async function createOrder(input: OrderCreateInput): Promise<Order> {
  return apiFetch<Order>("/api/orders", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateOrder(
  id: string,
  input: OrderUpdateInput,
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function updateOrderStatus(
  id: string,
  input: OrderStatusUpdateInput,
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function deleteOrder(id: string): Promise<void> {
  await apiFetch<undefined>(`/api/orders/${id}`, { method: "DELETE" });
}

export interface OrderReturnInput {
  items: { productId: string; quantity: number }[];
  note?: string | null;
}

export async function recordOrderReturn(
  id: string,
  input: OrderReturnInput,
): Promise<Order> {
  return apiFetch<Order>(`/api/orders/${id}/returns`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function createOrderPayment(
  orderId: string,
  input: OrderPaymentCreateInput,
): Promise<OrderPayment> {
  return apiFetch<OrderPayment>(`/api/orders/${orderId}/payments`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function updateOrderPaymentStatus(
  orderId: string,
  paymentId: string,
  status: OrderPaymentStatus,
): Promise<OrderPayment> {
  return apiFetch<OrderPayment>(
    `/api/orders/${orderId}/payments/${paymentId}/status`,
    {
      method: "PATCH",
      body: JSON.stringify({ status }),
    },
  );
}
