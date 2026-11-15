import { Document, Page, View } from "@react-pdf/renderer";

import { InvoiceFooter } from "./invoice-footer";
import { InvoiceHeader } from "./invoice-header";
import { InvoiceItemsTable } from "./invoice-items-table";
import { InvoiceNotes } from "./invoice-notes";
import { InvoiceParties } from "./invoice-parties";
import { InvoicePayments } from "./invoice-payments";
import { InvoiceSummary } from "./invoice-summary";
import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocumentProps } from "./invoice.types";

/**
 * Server-rendered PDF invoice for a single order. The document is intentionally
 * self-contained: every value comes from the order snapshot so a downloaded
 * invoice never changes when products or customers are edited later.
 */
export function InvoiceDocument({
  order,
  business,
  generatedAt,
}: InvoiceDocumentProps) {
  return (
    <Document
      title={`Invoice ${order.orderNumber}`}
      author={business.name}
      subject={`Invoice for order ${order.orderNumber}`}
      creator="VendKit"
      producer="VendKit"
      keywords={`invoice, order, ${order.orderNumber}`}
      language="en"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.accentBar} fixed />

        <InvoiceHeader order={order} business={business} />
        <InvoiceParties order={order} />
        <InvoiceItemsTable order={order} />
        <InvoiceSummary order={order} />
        <InvoicePayments order={order} />
        <InvoiceNotes order={order} business={business} />

        <InvoiceFooter business={business} generatedAt={generatedAt} />
      </Page>
    </Document>
  );
}
