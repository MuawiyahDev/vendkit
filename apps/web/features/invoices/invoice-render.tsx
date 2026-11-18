import { renderToBuffer } from "@react-pdf/renderer";

import type { InvoiceDetail } from "./invoices-api";
import { InvoiceDocument } from "./invoice-document";
import { toInvoiceDocument } from "./invoice.types";

/**
 * Renders the invoice PDF from persisted invoice data. Kept separate from the
 * route handler so JSX stays in a `.tsx` module and the HTTP layer remains
 * thin.
 */
export async function renderInvoicePdf(invoice: InvoiceDetail): Promise<Buffer> {
  return renderToBuffer(<InvoiceDocument document={toInvoiceDocument(invoice)} />);
}
