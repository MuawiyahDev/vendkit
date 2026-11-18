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
 * Server-rendered PDF invoice. Metadata and business details come from the
 * invoice snapshot, while line items and payments come from the order detail
 * so the document always reflects the real transaction history.
 */
export function InvoiceDocument({ document }: InvoiceDocumentProps) {
  return (
    <Document
      title={`Invoice ${document.invoiceNumber}`}
      author={document.business.name}
      subject={`Invoice for order ${document.order.orderNumber}`}
      creator="VendKit"
      producer="VendKit"
      keywords={`invoice, order, ${document.order.orderNumber}`}
      language="en"
    >
      <Page size="A4" style={styles.page} wrap>
        <View style={styles.accentBar} fixed />

        <InvoiceHeader document={document} />
        <InvoiceParties order={document.order} />
        <InvoiceItemsTable document={document} />
        <InvoiceSummary document={document} />
        <InvoicePayments document={document} />
        <InvoiceNotes document={document} />

        <InvoiceFooter document={document} />
      </Page>
    </Document>
  );
}
