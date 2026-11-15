import type { Order } from "@/features/orders/api/orders-api";

/**
 * Business details printed on every invoice. Values come from server-side
 * environment variables so a self-hosted installation can brand its invoices
 * without a database-backed settings model.
 */
export interface InvoiceBusinessProfile {
  name: string;
  addressLines: string[];
  phone: string | null;
  email: string | null;
  website: string | null;
  taxId: string | null;
  paymentTerms: string | null;
  footerNote: string | null;
}

export interface InvoiceDocumentProps {
  order: Order;
  business: InvoiceBusinessProfile;
  generatedAt: Date;
}
