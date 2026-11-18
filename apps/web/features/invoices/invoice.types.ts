import type { Order } from "@/features/orders/api/orders-api";

import type { InvoiceBusinessSnapshot, InvoiceDetail } from "./invoices-api";

/**
 * Business details printed on the invoice. They are captured from the
 * database-backed business profile when the invoice is created, so editing
 * settings later never rewrites a document the buyer already received.
 */
export interface InvoiceBusinessProfile {
  name: string;
  addressLines: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
}

export interface InvoiceDocument {
  id: string;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  dueDate: string | null;
  currency: string;
  subtotal: string;
  discountAmount: string;
  shippingFee: string;
  taxAmount: string;
  totalAmount: string;
  business: InvoiceBusinessProfile;
  additionalInfo: string | null;
  presentation: {
    showSku: boolean;
    showTaxBreakdown: boolean;
    showDiscountBreakdown: boolean;
  };
  notes: {
    customerNote: string | null;
    invoiceNotes: string | null;
    paymentTerms: string | null;
    footerText: string | null;
  };
  tax: {
    enabled: boolean;
    name: string;
    rate: string;
  };
  order: Order;
  generatedAt: Date;
}

export interface InvoiceDocumentProps {
  document: InvoiceDocument;
}

export function toInvoiceDocument(invoice: InvoiceDetail): InvoiceDocument {
  const snapshot = invoice.snapshot;

  return {
    id: invoice.id,
    invoiceNumber: invoice.invoiceNumber,
    status: invoice.status,
    issueDate: invoice.issueDate,
    dueDate: invoice.dueDate,
    currency: invoice.currency,
    subtotal: invoice.subtotal,
    discountAmount: invoice.discountAmount,
    shippingFee: invoice.shippingFee,
    taxAmount: invoice.taxAmount,
    totalAmount: invoice.totalAmount,
    business: {
      name: snapshot?.business.name ?? "VendKit",
      addressLines: buildAddressLines(snapshot?.business),
      phone: snapshot?.business.phone ?? null,
      email: snapshot?.business.email ?? null,
      website: snapshot?.business.website ?? null,
      taxId: snapshot?.business.taxId ?? null,
    },
    additionalInfo: snapshot?.business.additionalInfo ?? null,
    presentation: {
      showSku: snapshot?.presentation.showSku ?? true,
      showTaxBreakdown: snapshot?.presentation.showTaxBreakdown ?? true,
      showDiscountBreakdown:
        snapshot?.presentation.showDiscountBreakdown ?? true,
    },
    notes: {
      customerNote:
        snapshot?.notes.customerNote ?? invoice.order.customerNote ?? null,
      invoiceNotes: snapshot?.notes.invoiceNotes ?? null,
      paymentTerms: snapshot?.notes.paymentTerms ?? null,
      footerText: snapshot?.notes.footerText ?? null,
    },
    tax: {
      enabled: snapshot?.tax.enabled ?? false,
      name: snapshot?.tax.name ?? "Tax",
      rate: snapshot?.tax.rate ?? "0",
    },
    order: invoice.order,
    generatedAt: new Date(),
  };
}

function buildAddressLines(
  business: InvoiceBusinessSnapshot | undefined,
): string[] {
  if (!business) {
    return [];
  }

  const cityLine = [business.city, business.state, business.postalCode]
    .filter(Boolean)
    .join(", ");

  return [
    business.addressLine1,
    business.addressLine2,
    cityLine,
    business.country,
  ]
    .filter((line): line is string => Boolean(line?.trim()))
    .map((line) => line.trim());
}
