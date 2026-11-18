import { Text, View } from "@react-pdf/renderer";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocument } from "./invoice.types";
import {
  formatInvoiceCurrency,
  getInvoiceOutstandingBalance,
  parseInvoiceAmount,
} from "./invoice.utils";

interface InvoiceSummaryProps {
  document: InvoiceDocument;
}

export function InvoiceSummary({ document }: InvoiceSummaryProps) {
  const { currency, presentation, tax } = document;
  const discount = parseInvoiceAmount(document.discountAmount);
  const shipping = parseInvoiceAmount(document.shippingFee);
  const taxAmount = parseInvoiceAmount(document.taxAmount);
  const outstanding = getInvoiceOutstandingBalance({
    totalAmount: document.totalAmount,
    amountPaid: document.order.amountPaid,
  });

  return (
    <View style={styles.summary} wrap={false}>
      <View style={styles.summaryBox}>
        <SummaryRow
          label="Subtotal"
          value={formatInvoiceCurrency(document.subtotal, currency)}
        />
        {presentation.showDiscountBreakdown && discount > 0 ? (
          <SummaryRow
            label="Discount"
            value={`- ${formatInvoiceCurrency(discount, currency)}`}
          />
        ) : null}
        {shipping > 0 ? (
          <SummaryRow
            label="Shipping"
            value={formatInvoiceCurrency(shipping, currency)}
          />
        ) : null}
        {presentation.showTaxBreakdown && taxAmount > 0 ? (
          <SummaryRow
            label={tax.enabled ? `${tax.name} (${tax.rate}%)` : "Tax"}
            value={formatInvoiceCurrency(taxAmount, currency)}
          />
        ) : null}

        <View style={styles.grandRow}>
          <Text style={styles.grandLabel}>Total</Text>
          <Text style={styles.grandValue}>
            {formatInvoiceCurrency(document.totalAmount, currency)}
          </Text>
        </View>

        <View style={styles.paidRow}>
          <Text style={styles.paidLabel}>Amount paid</Text>
          <Text style={styles.paidValue}>
            {formatInvoiceCurrency(document.order.amountPaid, currency)}
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
              ? formatInvoiceCurrency(outstanding, currency)
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
