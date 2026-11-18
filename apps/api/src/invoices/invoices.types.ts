import type {
  InvoiceStatus,
  Prisma,
} from '@repo/database';
import type { OrderResponse } from '../orders/orders.types.js';
import type {
  INVOICE_DETAIL_INCLUDE,
  INVOICE_LIST_INCLUDE,
} from './invoices.constants.js';

export type InvoiceRow = Prisma.InvoiceGetPayload<Record<string, never>>;

export type InvoiceDetailRow = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_DETAIL_INCLUDE;
}>;

export type InvoiceListRow = Prisma.InvoiceGetPayload<{
  include: typeof INVOICE_LIST_INCLUDE;
}>;

export type InvoiceListWhere = Prisma.InvoiceWhereInput;
export type InvoiceListOrderBy = Prisma.InvoiceOrderByWithRelationInput;

/** Business details captured when the invoice was created. */
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

/** Presentation switches captured with the invoice. */
export interface InvoicePresentationSnapshot {
  showSku: boolean;
  showTaxBreakdown: boolean;
  showDiscountBreakdown: boolean;
}

/** Terms and free-form text captured with the invoice. */
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

export interface InvoiceResponse {
  id: string;
  invoiceNumber: string;
  orderId: string;
  orderNumber: string;
  customerName: string | null;
  status: InvoiceStatus;
  issueDate: Date;
  dueDate: Date | null;
  sequenceYear: number | null;
  sequenceValue: number;
  currency: string;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  snapshot: InvoiceSnapshot | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  createdByName: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface InvoiceDetailResponse extends InvoiceResponse {
  order: OrderResponse;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface InvoiceListResponse {
  data: InvoiceResponse[];
  meta: PaginationMeta;
}
