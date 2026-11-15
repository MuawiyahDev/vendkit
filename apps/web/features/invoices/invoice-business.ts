import type { InvoiceBusinessProfile } from "./invoice.types";

const DEFAULT_BUSINESS_NAME = "VendKit";
const DEFAULT_FOOTER_NOTE = "Thank you for your business.";

/**
 * Reads the optional business profile used by invoice PDFs. Every value is
 * optional so a fresh installation still produces a clean, usable invoice;
 * set the `INVOICE_BUSINESS_*` variables to add real business details.
 */
export function getInvoiceBusinessProfile(): InvoiceBusinessProfile {
  return {
    name: readEnv("INVOICE_BUSINESS_NAME") ?? DEFAULT_BUSINESS_NAME,
    addressLines: readMultilineEnv("INVOICE_BUSINESS_ADDRESS"),
    phone: readEnv("INVOICE_BUSINESS_PHONE"),
    email: readEnv("INVOICE_BUSINESS_EMAIL"),
    website: readEnv("INVOICE_BUSINESS_WEBSITE"),
    taxId: readEnv("INVOICE_BUSINESS_TAX_ID"),
    paymentTerms: readEnv("INVOICE_PAYMENT_TERMS"),
    footerNote: readEnv("INVOICE_FOOTER_NOTE") ?? DEFAULT_FOOTER_NOTE,
  };
}

function readEnv(name: string): string | null {
  const value = process.env[name]?.trim();
  return value ? value : null;
}

function readMultilineEnv(name: string): string[] {
  const value = readEnv(name);
  if (!value) {
    return [];
  }

  return value
    .split(/\r?\n|\\n/)
    .map((line) => line.trim())
    .filter(Boolean);
}
