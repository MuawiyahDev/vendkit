import type {
  InvoiceDetailResponse,
  InvoiceDetailRow,
  InvoiceListRow,
  InvoiceResponse,
} from './invoices.types.js';
import { parseInvoiceSnapshot } from './invoices.utils.js';
import { toOrderResponse } from '../orders/orders.mapper.js';

export function toInvoiceResponse(
  invoice: InvoiceListRow | InvoiceDetailRow,
): InvoiceResponse {
  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    orderId: invoice.orderId,
    orderNumber: invoice.order.orderNumber,
    customerName: resolveCustomerName(invoice),
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    sequenceYear: invoice.sequenceYear,
    sequenceValue: invoice.sequenceValue,
    currency: invoice.currency,
    subtotal: invoice.subtotal.toString(),
    discountAmount: invoice.discountAmount.toString(),
    shippingFee: invoice.shippingFee.toString(),
    taxAmount: invoice.taxAmount.toString(),
    totalAmount: invoice.totalAmount.toString(),
    snapshot: parseInvoiceSnapshot(invoice.snapshot),
    cancelledAt: invoice.cancelledAt,
    cancellationReason: invoice.cancellationReason,
    createdByName: invoice.createdByName,
    createdAt: invoice.createdAt,
    updatedAt: invoice.updatedAt,
  };
}

export function toInvoiceDetailResponse(
  invoice: InvoiceDetailRow,
): InvoiceDetailResponse {
  return {
    ...toInvoiceResponse(invoice),
    order: toOrderResponse(invoice.order),
  };
}

function resolveCustomerName(
  invoice: InvoiceListRow | InvoiceDetailRow,
): string | null {
  return (
    invoice.order.customer?.name ?? invoice.order.shippingName?.trim() ?? null
  );
}
