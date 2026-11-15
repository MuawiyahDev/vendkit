import { Text, View } from "@react-pdf/renderer";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceBusinessProfile } from "./invoice.types";
import { formatInvoiceDateTime } from "./invoice.utils";

interface InvoiceFooterProps {
  business: InvoiceBusinessProfile;
  generatedAt: Date;
}

export function InvoiceFooter({ business, generatedAt }: InvoiceFooterProps) {
  return (
    <View style={styles.footer} fixed>
      <Text style={styles.footerText}>
        {business.footerNote ?? "Thank you for your business."}
      </Text>
      <Text style={styles.footerMeta}>
        Generated {formatInvoiceDateTime(generatedAt)}
      </Text>
    </View>
  );
}
