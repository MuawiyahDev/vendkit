import { Text, View } from "@react-pdf/renderer";

import type { Order } from "@/features/orders/api/orders-api";

import { invoiceStyles as styles } from "./invoice.styles";
import type { InvoiceBusinessProfile } from "./invoice.types";
import {
  buildInvoiceBusinessContactLine,
  formatInvoiceDate,
  formatInvoiceStatus,
  getBusinessInitials,
} from "./invoice.utils";

interface InvoiceHeaderProps {
  order: Order;
  business: InvoiceBusinessProfile;
}

export function InvoiceHeader({ order, business }: InvoiceHeaderProps) {
  const contactLine = buildInvoiceBusinessContactLine(business);

  return (
    <>
      <View style={styles.header}>
        <View style={styles.brand}>
          <View style={styles.brandMark}>
            <Text style={styles.brandMarkText}>
              {getBusinessInitials(business.name)}
            </Text>
          </View>
          <View style={styles.brandDetails}>
            <Text style={styles.businessName}>{business.name}</Text>
            {business.addressLines.length > 0 ? (
              <Text style={styles.businessMeta}>
                {business.addressLines.join("\n")}
              </Text>
            ) : null}
            {contactLine ? (
              <Text style={styles.businessMeta}>{contactLine}</Text>
            ) : null}
            {business.taxId ? (
              <Text style={styles.businessMeta}>Tax ID: {business.taxId}</Text>
            ) : null}
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.invoiceTitle}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{order.orderNumber}</Text>
          <View style={styles.metaList}>
            <MetaRow
              label="Invoice date"
              value={formatInvoiceDate(order.createdAt)}
            />
            <MetaRow
              label="Order status"
              value={formatInvoiceStatus(order.status)}
            />
            <MetaRow
              label="Payment"
              value={formatInvoiceStatus(order.paymentStatus)}
            />
          </View>
        </View>
      </View>
      <View style={styles.divider} />
    </>
  );
}

interface MetaRowProps {
  label: string;
  value: string;
}

function MetaRow({ label, value }: MetaRowProps) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue}>{value}</Text>
    </View>
  );
}
