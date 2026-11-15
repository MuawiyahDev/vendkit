import { Text, View } from "@react-pdf/renderer";

import type { Order } from "@/features/orders/api/orders-api";

import { invoiceStyles as styles } from "./invoice.styles";
import {
  getInvoiceCustomerContactLines,
  getInvoiceCustomerName,
  getInvoiceShippingLines,
  hasInvoiceShippingDetails,
} from "./invoice.utils";

interface InvoicePartiesProps {
  order: Order;
}

export function InvoiceParties({ order }: InvoicePartiesProps) {
  const customerLines = getInvoiceCustomerContactLines(order);
  const shippingLines = getInvoiceShippingLines(order);
  const hasShipping = hasInvoiceShippingDetails(order);

  return (
    <View style={styles.parties}>
      <View style={styles.party}>
        <Text style={styles.sectionLabel}>Billed to</Text>
        <Text style={styles.partyName}>{getInvoiceCustomerName(order)}</Text>
        {customerLines.map((line, index) => (
          <Text key={`${line}-${index}`} style={styles.partyLine}>
            {line}
          </Text>
        ))}
      </View>

      <View style={[styles.party, styles.partyLast]}>
        <Text style={styles.sectionLabel}>Ship to</Text>
        {hasShipping ? (
          <>
            <Text style={styles.partyName}>
              {order.shippingName?.trim() || getInvoiceCustomerName(order)}
            </Text>
            {shippingLines.map((line, index) => (
              <Text key={`${line}-${index}`} style={styles.partyLine}>
                {line}
              </Text>
            ))}
          </>
        ) : (
          <Text style={styles.partyMuted}>Not provided</Text>
        )}
      </View>
    </View>
  );
}
