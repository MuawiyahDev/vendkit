import { apiFetch } from "@/lib/api/client";
import type { PaginationMeta } from "@/lib/api/types";

import type { Order } from "@/features/orders/api/orders-api";

export const INVOICE_STATUSES = ["DRAFT", "ISSUED", "CANCELLED"] as const;

export type InvoiceStatus = (typeof INVOICE_STATUSES)[number];

export interface InvoiceBusinessSnapshot {
  name: string;
  addressLine1: string | null;
  addressLine2: string | null;
  city: string | null;
  state: string | null;
  postalCode: string | null;
  country: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  additionalInfo: string | null;
}

export interface InvoicePresentationSnapshot {
  showSku: boolean;
  showTaxBreakdown: boolean;
  showDiscountBreakdown: boolean;
}

export interface InvoiceNotesSnapshot {
  customerNote: string | null;
  invoiceNotes: string | null;
  paymentTerms: string | null;
  footerText: string | null;
}

export interface InvoiceTaxSnapshot {
  enabled: boolean;
  name: string;
  rate: string;
}

export interface InvoiceSnapshot {
  formatVersion: number;
  capturedAt: string;
  business: InvoiceBusinessSnapshot;
  presentation: InvoicePresentationSnapshot;
  notes: InvoiceNotesSnapshot;
  tax: InvoiceTaxSnapshot;
}

export interface InvoiceBase {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  status: InvoiceStatus;
  issueDate: string;
  dueDate: string | null;
  sequenceYear: number | null;
  sequenceValue: number;
  currency: string;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  snapshot: InvoiceSnapshot | null;
  cancelledAt: string | null;
  cancellationReason: string | null;
  createdByName: string | null;
  createdAt: string;
  updatedAt: string;
}

export type Invoice = InvoiceBase;

export interface InvoiceDetail extends InvoiceBase {
  order: Order;
}

export interface InvoiceListResponse {
  data: Invoice[];
  meta: PaginationMeta;
}

export interface InvoiceListQuery {
  page?: number;
  limit?: number;
  search?: string;
  status?: InvoiceStatus;
  sortOrder?: "asc" | "desc";
}

export async function listInvoices(
  query: InvoiceListQuery = {},
  { signal }: { signal?: AbortSignal } = {},
): Promise<InvoiceListResponse> {
  const params = new URLSearchParams();

  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== "") {
      params.set(key, String(value));
    }
  }

  const suffix = params.toString();
  return apiFetch<InvoiceListResponse>(
    `/api/invoices${suffix ? `?${suffix}` : ""}`,
    { signal },
  );
}

export async function getInvoice(id: string): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/api/invoices/${id}`);
}

export async function getOrderInvoice(
  orderId: string,
  { signal }: { signal?: AbortSignal } = {},
): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/api/orders/${orderId}/invoice`, { signal });
}

export async function createInvoice(
  orderId: string,
  input: { invoiceNumber?: string } = {},
): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/api/orders/${orderId}/invoice`, {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function issueInvoice(id: string): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/api/invoices/${id}/issue`, {
    method: "POST",
    body: JSON.stringify({}),
  });
}

export async function cancelInvoice(
  id: string,
  cancellationReason?: string,
): Promise<InvoiceDetail> {
  return apiFetch<InvoiceDetail>(`/api/invoices/${id}/cancel`, {
    method: "POST",
    body: JSON.stringify({
      ...(cancellationReason ? { cancellationReason } : {}),
    }),
  });
}

export function invoiceFileUrl(id: string): string {
  return `/api/invoices/${id}/file`;
}
