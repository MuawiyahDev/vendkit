import { StyleSheet } from "@react-pdf/renderer";

/**
 * Invoice palette. Mirrors the dashboard's restrained indigo accent and
 * slate neutrals so printed invoices feel like part of the product.
 */
export const INVOICE_COLORS = {
  ink: "#0F172A",
  body: "#334155",
  muted: "#64748B",
  faint: "#94A3B8",
  border: "#E2E8F0",
  borderSubtle: "#EEF2F7",
  surface: "#F8FAFC",
  surfaceMuted: "#F1F5F9",
  primary: "#3B4FD8",
  primarySoft: "#EEF1FF",
  success: "#15803D",
  warning: "#B45309",
  danger: "#B91C1C",
  white: "#FFFFFF",
} as const;

export const invoiceStyles = StyleSheet.create({
  page: {
    paddingTop: 34,
    paddingBottom: 54,
    paddingHorizontal: 40,
    fontFamily: "Helvetica",
    fontSize: 9,
    color: INVOICE_COLORS.body,
    lineHeight: 1.4,
    backgroundColor: INVOICE_COLORS.white,
  },

  accentBar: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    backgroundColor: INVOICE_COLORS.primary,
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 16,
  },
  brand: {
    flexDirection: "row",
    alignItems: "flex-start",
    maxWidth: "58%",
  },
  brandMark: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: INVOICE_COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  brandMarkText: {
    color: INVOICE_COLORS.white,
    fontSize: 14,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },
  brandDetails: {
    flexDirection: "column",
    flexShrink: 1,
  },
  businessName: {
    fontSize: 15,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
    letterSpacing: 0.2,
  },
  businessMeta: {
    marginTop: 3,
    fontSize: 8,
    color: INVOICE_COLORS.muted,
    lineHeight: 1.45,
  },
  headerRight: {
    alignItems: "flex-end",
    maxWidth: "38%",
  },
  invoiceTitle: {
    fontSize: 23,
    fontWeight: "bold",
    color: INVOICE_COLORS.primary,
    letterSpacing: 3,
    lineHeight: 1,
  },
  invoiceNumber: {
    marginTop: 5,
    fontSize: 10,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
    letterSpacing: 0.3,
  },
  metaList: {
    marginTop: 9,
    alignItems: "flex-end",
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 2.5,
  },
  metaLabel: {
    fontSize: 7,
    color: INVOICE_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.7,
    marginRight: 7,
    marginTop: 1,
  },
  metaValue: {
    fontSize: 8,
    color: INVOICE_COLORS.body,
    fontWeight: "bold",
  },

  divider: {
    height: 1,
    backgroundColor: INVOICE_COLORS.border,
    marginBottom: 16,
  },

  parties: {
    flexDirection: "row",
    marginBottom: 18,
  },
  party: {
    flex: 1,
    paddingRight: 18,
  },
  partyLast: {
    paddingRight: 0,
    paddingLeft: 18,
    borderLeftWidth: 1,
    borderLeftColor: INVOICE_COLORS.borderSubtle,
  },
  sectionLabel: {
    fontSize: 7,
    fontWeight: "bold",
    color: INVOICE_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: 5,
  },
  partyName: {
    fontSize: 10,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
    marginBottom: 2,
  },
  partyLine: {
    fontSize: 8.5,
    color: INVOICE_COLORS.body,
    lineHeight: 1.45,
  },
  partyMuted: {
    fontSize: 8.5,
    color: INVOICE_COLORS.muted,
    lineHeight: 1.45,
  },

  table: {
    marginBottom: 14,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: INVOICE_COLORS.surfaceMuted,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: INVOICE_COLORS.border,
    paddingVertical: 6,
    paddingHorizontal: 8,
  },
  tableHeaderText: {
    fontSize: 7,
    fontWeight: "bold",
    color: INVOICE_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: INVOICE_COLORS.borderSubtle,
    paddingVertical: 7,
    paddingHorizontal: 8,
  },
  tableRowAlt: {
    backgroundColor: INVOICE_COLORS.surface,
  },
  colItem: {
    flex: 1,
    paddingRight: 10,
  },
  colQty: {
    width: 40,
    textAlign: "right",
  },
  colUnit: {
    width: 88,
    textAlign: "right",
  },
  colAmount: {
    width: 88,
    textAlign: "right",
  },
  itemName: {
    fontSize: 9,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
    lineHeight: 1.35,
  },
  itemSku: {
    fontSize: 7.5,
    color: INVOICE_COLORS.muted,
    marginTop: 1.5,
  },
  cellText: {
    fontSize: 8.5,
    color: INVOICE_COLORS.body,
  },
  cellStrong: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
  },

  summary: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 16,
  },
  summaryBox: {
    width: 246,
  },
  summaryRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 2.5,
  },
  summaryLabel: {
    fontSize: 8.5,
    color: INVOICE_COLORS.muted,
  },
  summaryValue: {
    fontSize: 8.5,
    color: INVOICE_COLORS.body,
    fontWeight: "bold",
  },
  grandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 5,
    paddingTop: 7,
    paddingBottom: 7,
    paddingHorizontal: 8,
    borderTopWidth: 1.5,
    borderTopColor: INVOICE_COLORS.ink,
    backgroundColor: INVOICE_COLORS.surfaceMuted,
  },
  grandLabel: {
    fontSize: 9,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
  },
  grandValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
  },
  paidRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingTop: 7,
    paddingBottom: 2,
    paddingHorizontal: 8,
  },
  paidLabel: {
    fontSize: 8.5,
    color: INVOICE_COLORS.muted,
  },
  paidValue: {
    fontSize: 8.5,
    color: INVOICE_COLORS.success,
    fontWeight: "bold",
  },
  balanceRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 3,
    paddingVertical: 6,
    paddingHorizontal: 8,
    backgroundColor: INVOICE_COLORS.primarySoft,
    borderRadius: 3,
  },
  balanceLabel: {
    fontSize: 8.5,
    fontWeight: "bold",
    color: INVOICE_COLORS.primary,
  },
  balanceValue: {
    fontSize: 10,
    fontWeight: "bold",
    color: INVOICE_COLORS.primary,
  },
  balanceValuePaid: {
    fontSize: 10,
    fontWeight: "bold",
    color: INVOICE_COLORS.success,
  },

  section: {
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 9,
    fontWeight: "bold",
    color: INVOICE_COLORS.ink,
    marginBottom: 5,
  },
  sectionTitleSpaced: {
    marginTop: 8,
  },
  paymentTable: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: INVOICE_COLORS.border,
  },
  paymentHeader: {
    flexDirection: "row",
    backgroundColor: INVOICE_COLORS.surfaceMuted,
    paddingVertical: 5,
    paddingHorizontal: 7,
  },
  paymentHeaderText: {
    fontSize: 6.8,
    fontWeight: "bold",
    color: INVOICE_COLORS.muted,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  paymentRow: {
    flexDirection: "row",
    paddingVertical: 6,
    paddingHorizontal: 7,
    borderTopWidth: 1,
    borderTopColor: INVOICE_COLORS.borderSubtle,
  },
  colPaymentDate: {
    width: 78,
  },
  colPaymentMethod: {
    flex: 1,
    paddingRight: 6,
  },
  colPaymentReference: {
    flex: 1,
    paddingRight: 6,
  },
  colPaymentAmount: {
    width: 78,
    textAlign: "right",
  },
  colPaymentStatus: {
    width: 60,
    textAlign: "right",
  },
  paymentText: {
    fontSize: 8,
    color: INVOICE_COLORS.body,
  },
  paymentTextStrong: {
    fontSize: 8,
    color: INVOICE_COLORS.ink,
    fontWeight: "bold",
  },
  noteText: {
    fontSize: 8.5,
    color: INVOICE_COLORS.body,
    lineHeight: 1.5,
  },

  footer: {
    position: "absolute",
    bottom: 24,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: INVOICE_COLORS.border,
    paddingTop: 7,
  },
  footerText: {
    fontSize: 7.5,
    color: INVOICE_COLORS.muted,
    lineHeight: 1.4,
  },
  footerMeta: {
    fontSize: 7,
    color: INVOICE_COLORS.faint,
    marginTop: 2,
  },
});
