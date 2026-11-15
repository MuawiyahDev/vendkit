import { Text, View } from "@react-pdf/renderer";

import type { Order } from "@/features/orders/api/orders-api";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceBusinessProfile } from "./invoice.types";

interface InvoiceNotesProps {
  order: Order;
  business: InvoiceBusinessProfile;
}

export function InvoiceNotes({ order, business }: InvoiceNotesProps) {
  const customerNote = order.customerNote?.trim();
  const paymentTerms = business.paymentTerms?.trim();

  if (!customerNote && !paymentTerms) {
    return null;
  }

  return (
    <View style={styles.section}>
      {customerNote ? (
        <>
          <Text style={styles.sectionTitle} minPresenceAhead={24}>
            Notes
          </Text>
          <Text style={styles.noteText}>{customerNote}</Text>
        </>
      ) : null}
      {paymentTerms ? (
        <>
          <Text
            style={[
              styles.sectionTitle,
              customerNote ? styles.sectionTitleSpaced : undefined,
            ]}
            minPresenceAhead={24}
          >
            Payment terms
          </Text>
          <Text style={styles.noteText}>{paymentTerms}</Text>
        </>
      ) : null}
    </View>
  );
}
