import { Text, View } from "@react-pdf/renderer";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocument } from "./invoice.types";
import { formatInvoiceCurrency } from "./invoice.utils";

interface InvoiceItemsTableProps {
  document: InvoiceDocument;
}

export function InvoiceItemsTable({ document }: InvoiceItemsTableProps) {
  const { order, presentation, currency } = document;

  return (
    <View style={styles.table}>
      <View style={styles.tableHeader} minPresenceAhead={56}>
        <Text style={[styles.tableHeaderText, styles.colItem]}>Item</Text>
        <Text style={[styles.tableHeaderText, styles.colQty]}>Qty</Text>
        <Text style={[styles.tableHeaderText, styles.colUnit]}>Unit price</Text>
        <Text style={[styles.tableHeaderText, styles.colAmount]}>Amount</Text>
      </View>

      {order.items.map((item, index) => (
        <View
          key={item.id}
          style={[
            styles.tableRow,
            index % 2 === 1 ? styles.tableRowAlt : undefined,
          ]}
          wrap={false}
        >
          <View style={styles.colItem}>
            <Text style={styles.itemName}>{item.productName}</Text>
            {presentation.showSku && item.sku ? (
              <Text style={styles.itemSku}>SKU {item.sku}</Text>
            ) : null}
          </View>
          <Text style={[styles.cellText, styles.colQty]}>{item.quantity}</Text>
          <Text style={[styles.cellText, styles.colUnit]}>
            {formatInvoiceCurrency(item.unitPrice, currency)}
          </Text>
          <Text style={[styles.cellStrong, styles.colAmount]}>
            {formatInvoiceCurrency(item.lineTotal, currency)}
          </Text>
        </View>
      ))}
    </View>
  );
}
