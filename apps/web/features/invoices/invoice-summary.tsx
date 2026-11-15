import { Text, View } from "@react-pdf/renderer";

import type { Order } from "@/features/orders/api/orders-api";

import { invoiceStyles as styles } from "./invoice.styles";
import {
  formatInvoiceCurrency,
  getInvoiceOutstandingBalance,
  parseInvoiceAmount,
} from "./invoice.utils";

interface InvoiceSummaryProps {
  order: Order;
}

export function InvoiceSummary({ order }: InvoiceSummaryProps) {
  const discount = parseInvoiceAmount(order.discountAmount);
  const shipping = parseInvoiceAmount(order.shippingFee);
  const tax = parseInvoiceAmount(order.taxAmount);
  const outstanding = getInvoiceOutstandingBalance(order);

  return (
    <View style={styles.summary} wrap={false}>
      <View style={styles.summaryBox}>
        <SummaryRow
          label="Subtotal"
          value={formatInvoiceCurrency(order.subtotal, order.currency)}
        />
        {discount > 0 ? (
          <SummaryRow
            label="Discount"
            value={`- ${formatInvoiceCurrency(discount, order.currency)}`}
          />
        ) : null}
        {shipping > 0 ? (
          <SummaryRow
            label="Shipping"
            value={formatInvoiceCurrency(shipping, order.currency)}
          />
        ) : null}
        {tax > 0 ? (
          <SummaryRow
            label="Tax"
            value={formatInvoiceCurrency(tax, order.currency)}
          />
        ) : null}

        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>
            {formatInvoiceCurrency(order.totalAmount, order.currency)}
          </Text>
        </View>

        <View style={styles.paidRow}>
          <Text style={styles.paidLabel}>Amount paid</Text>
          <Text style={styles.paidValue}>
            {formatInvoiceCurrency(order.amountPaid, order.currency)}
          </Text>
        </View>

        <View style={styles.balanceRow}>
          <Text style={styles.balanceLabel}>
            {outstanding > 0 ? "Balance due" : "Payment status"}
          </Text>
          <Text
            style={
              outstanding > 0 ? styles.balanceValue : styles.balanceValuePaid
            }
          >
            {outstanding > 0
              ? formatInvoiceCurrency(outstanding, order.currency)
              : "Paid in full"}
          </Text>
        </View>
      </View>
    </View>
  );
}

interface SummaryRowProps {
  label: string;
  value: string;
}

function SummaryRow({ label, value }: SummaryRowProps) {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.summaryLabel}>{label}</Text>
      <Text style={styles.summaryValue}>{value}</Text>
    </View>
  );
}
