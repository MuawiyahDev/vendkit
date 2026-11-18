import { Text, View } from "@react-pdf/renderer";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocument } from "./invoice.types";

interface InvoiceNotesProps {
  document: InvoiceDocument;
}

export function InvoiceNotes({ document }: InvoiceNotesProps) {
  const { notes, additionalInfo } = document;
  const customerNote = notes.customerNote?.trim();
  const invoiceNote = notes.invoiceNotes?.trim();
  const paymentTerms = notes.paymentTerms?.trim();
  const extraInfo = additionalInfo?.trim();

  const blocks = [
    customerNote ? { title: "Notes", body: customerNote } : null,
    invoiceNote ? { title: "Invoice notes", body: invoiceNote } : null,
    paymentTerms ? { title: "Payment terms", body: paymentTerms } : null,
    extraInfo ? { title: "Additional information", body: extraInfo } : null,
  ].filter((block): block is { title: string; body: string } => block !== null);

  if (blocks.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      {blocks.map((block, index) => (
        <View key={block.title}>
          <Text
            style={[
              styles.sectionTitle,
              index > 0 ? styles.sectionTitleSpaced : undefined,
            ]}
            minPresenceAhead={24}
          >
            {block.title}
          </Text>
          <Text style={styles.noteText}>{block.body}</Text>
        </View>
      ))}
    </View>
  );
}
