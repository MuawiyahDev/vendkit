import { Text, View } from "@react-pdf/renderer";

import type { OrderPaymentStatus } from "@/features/orders/api/orders-api";

import { INVOICE_COLORS, invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceDocument } from "./invoice.types";
import {
  formatInvoiceCurrency,
  formatInvoiceDate,
  formatInvoiceStatus,
} from "./invoice.utils";

const PAYMENT_STATUS_COLOR: Record<OrderPaymentStatus, string> = {
  COMPLETED: INVOICE_COLORS.success,
  PENDING: INVOICE_COLORS.warning,
  FAILED: INVOICE_COLORS.danger,
};

interface InvoicePaymentsProps {
  document: InvoiceDocument;
}

export function InvoicePayments({ document }: InvoicePaymentsProps) {
  const payments = document.order.payments;

  if (payments.length === 0) {
    return null;
  }

  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle} minPresenceAhead={40}>
        Payments
      </Text>
      <View style={styles.paymentTable}>
        <View style={styles.paymentHeader}>
          <Text style={[styles.paymentHeaderText, styles.colPaymentDate]}>
            Date
          </Text>
          <Text style={[styles.paymentHeaderText, styles.colPaymentMethod]}>
            Method
          </Text>
          <Text style={[styles.paymentHeaderText, styles.colPaymentReference]}>
            Reference
          </Text>
          <Text style={[styles.paymentHeaderText, styles.colPaymentAmount]}>
            Amount
          </Text>
          <Text style={[styles.paymentHeaderText, styles.colPaymentStatus]}>
            Status
          </Text>
        </View>

        {payments.map((payment) => (
          <View key={payment.id} style={styles.paymentRow} wrap={false}>
            <Text style={[styles.paymentText, styles.colPaymentDate]}>
              {formatInvoiceDate(payment.paidAt ?? payment.createdAt)}
            </Text>
            <Text style={[styles.paymentText, styles.colPaymentMethod]}>
              {formatInvoiceStatus(payment.method)}
            </Text>
            <Text style={[styles.paymentText, styles.colPaymentReference]}>
              {payment.reference?.trim() || "-"}
            </Text>
            <Text style={[styles.paymentTextStrong, styles.colPaymentAmount]}>
              {formatInvoiceCurrency(payment.amount, document.currency)}
            </Text>
            <Text
              style={[
                styles.paymentTextStrong,
                styles.colPaymentStatus,
                { color: PAYMENT_STATUS_COLOR[payment.status] },
              ]}
            >
              {formatInvoiceStatus(payment.status)}
            </Text>
          </View>
        ))}
      </View>
    </View>
  );
}
