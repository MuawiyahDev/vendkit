import { Text, View } from "@react-pdf/renderer";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocument } from "./invoice.types";
import { formatInvoiceDateTime } from "./invoice.utils";

interface InvoiceFooterProps {
  document: InvoiceDocument;
}

export function InvoiceFooter({ document }: InvoiceFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {document.notes.footerText?.trim() || "Thank you for your business."}
      </Text>
      <Text style={styles.footerMeta}>
        Generated {formatInvoiceDateTime(document.generatedAt)}
      </Text>
    </View>
  );
}
