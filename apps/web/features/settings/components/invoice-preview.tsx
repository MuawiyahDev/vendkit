"use client";

import { FileText } from "lucide-react";

import { ImageThumbnail } from "@/features/images/components/image-thumbnail";
import { cn } from "@/lib/utils";

import type {
  BusinessProfileSettings,
  RegionalSettings,
  SettingsLogo,
} from "../settings.types";
import type { InvoiceSettingsFormValues as InvoiceFormValues } from "../schemas/invoice.schema";
import {
  addDays,
  formatDatePattern,
  formatInvoiceNumberExample,
  formatMoney,
  getInitials,
} from "../utils/settings-format.utils";

const SAMPLE_DATE = new Date("2026-11-10T10:30:00.000Z");
const SAMPLE_ITEMS = [
  {
    name: "Cotton Panjabi",
    sku: "PAN-001",
    quantity: 2,
    unitPrice: 1200,
  },
  {
    name: "Handloom Scarf",
    sku: "SCF-014",
    quantity: 1,
    unitPrice: 450,
  },
];

function optional(value: string): string | null {
  const trimmed = value.trim();
  return trimmed === "" ? null : trimmed;
}

interface InvoicePreviewProps {
  businessProfile: BusinessProfileSettings;
  invoice: InvoiceFormValues;
  regional: RegionalSettings;
  className?: string;
}

/**
 * Visual, clearly-labelled sample invoice built from the current form values.
 * It is never persisted and always carries a "sample data" marker.
 */
export function InvoicePreview({
  businessProfile,
  invoice,
  regional,
  className,
}: InvoicePreviewProps) {
  const useBusinessProfile = invoice.useBusinessProfile;

  const customLogo: SettingsLogo | null =
    invoice.logoImageId && invoice.logoUrl
      ? { id: invoice.logoImageId, url: invoice.logoUrl }
      : null;

  const pick = (customValue: string, businessValue: string | null) => {
    const value = optional(customValue);
    return useBusinessProfile ? (value ?? businessValue) : value;
  };

  const displayName =
    optional(invoice.displayName) ?? businessProfile.businessName;
  const logo = useBusinessProfile
    ? (customLogo ?? businessProfile.logo)
    : customLogo;
  const email = pick(invoice.email, businessProfile.email);
  const phone = pick(invoice.phone, businessProfile.phone);
  const addressLine1 = pick(invoice.addressLine1, businessProfile.addressLine1);
  const addressLine2 = pick(invoice.addressLine2, businessProfile.addressLine2);
  const city = pick(invoice.city, businessProfile.city);
  const state = pick(invoice.state, businessProfile.state);
  const postalCode = pick(invoice.postalCode, businessProfile.postalCode);
  const country = pick(invoice.country, businessProfile.country);
  const taxRegistrationNumber = pick(
    invoice.taxRegistrationNumber,
    businessProfile.taxIdentificationNumber,
  );
  const additionalInfo = pick(
    invoice.additionalInfo,
    businessProfile.description,
  );

  const addressLines = [
    addressLine1,
    addressLine2,
    [city, state, postalCode].filter(Boolean).join(", "),
    country,
  ].filter((line): line is string => Boolean(line && line.trim()));

  const displayCurrency =
    invoice.currencyDisplayFormat === "CODE"
      ? regional.currency
      : invoice.currencyDisplayFormat === "SYMBOL_AND_CODE"
        ? `${regional.currencySymbol} ${regional.currency}`
        : regional.currencySymbol;

  const moneyOptions = {
    currencySymbol: displayCurrency,
    currencyPosition: regional.currencyPosition,
    decimalPrecision: regional.decimalPrecision,
    thousandSeparator: regional.thousandSeparator,
    decimalSeparator: regional.decimalSeparator,
  };

  const subtotal = SAMPLE_ITEMS.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
  const discount = invoice.showDiscountBreakdown ? 100 : 0;
  const tax = invoice.showTaxBreakdown ? 185 : 0;
  const total = subtotal - discount + tax;

  const issueDate = SAMPLE_DATE;
  const duePeriodDays = Number.isFinite(invoice.duePeriodDays)
    ? invoice.duePeriodDays
    : 0;
  const startingSequence = Number.isFinite(invoice.startingSequence)
    ? invoice.startingSequence
    : 1;
  const dueDate = addDays(issueDate, duePeriodDays);
  const invoiceNumber = formatInvoiceNumberExample({
    numberPrefix: invoice.numberPrefix,
    numberFormat: invoice.numberFormat,
    yearBasedNumbering: invoice.yearBasedNumbering,
    sequence: startingSequence,
    date: issueDate,
  });

  const contactLine = [email, phone].filter(Boolean).join(" · ");

  return (
    <div className={cn("flex flex-col gap-3", className)}>
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold tracking-tight">Invoice preview</p>
        <span className="bg-primary-soft text-primary-soft-foreground rounded-full px-2.5 py-1 text-[0.6875rem] font-medium">
          Sample data
        </span>
      </div>

      <div className="bg-card overflow-hidden rounded-xl border border-border-subtle shadow-sm">
        <div className="h-1 bg-primary" />
        <div className="p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="flex min-w-0 items-start gap-3">
              <div className="bg-surface-muted border-border-subtle flex size-11 shrink-0 items-center justify-center overflow-hidden rounded-lg border">
                {logo ? (
                  <ImageThumbnail src={logo.url} alt={`${displayName} logo`} />
                ) : (
                  <span className="text-primary text-sm font-semibold">
                    {getInitials(displayName)}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{displayName}</p>
                {addressLines.length > 0 ? (
                  <p className="text-muted-foreground mt-0.5 text-[0.6875rem] leading-relaxed">
                    {addressLines.join(" · ")}
                  </p>
                ) : null}
                {contactLine ? (
                  <p className="text-muted-foreground text-[0.6875rem]">
                    {contactLine}
                  </p>
                ) : null}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p className="text-[0.625rem] font-semibold tracking-[0.18em] text-muted-foreground">
                INVOICE
              </p>
              <p className="mt-1 font-mono text-xs font-semibold">
                {invoiceNumber || "—"}
              </p>
            </div>
          </div>

          <div className="border-border-subtle my-4 border-t" />

          <div className="grid grid-cols-2 gap-4 text-[0.6875rem]">
            <div>
              <p className="text-muted-foreground mb-1 font-medium uppercase tracking-wide">
                Billed to
              </p>
              <p className="font-medium">Customer name</p>
              <p className="text-muted-foreground">Customer phone</p>
              <p className="text-muted-foreground">Customer address</p>
            </div>
            <div className="space-y-1 text-right">
              <p>
                <span className="text-muted-foreground">Issued </span>
                {formatDatePattern(issueDate, regional.dateFormat)}
              </p>
              <p>
                <span className="text-muted-foreground">Due </span>
                {formatDatePattern(dueDate, regional.dateFormat)}
              </p>
              <p>
                <span className="text-muted-foreground">Status </span>
                {invoice.defaultStatus === "DRAFT" ? "Draft" : "Issued"}
              </p>
            </div>
          </div>

          <div className="mt-4">
            <div className="text-muted-foreground border-border-subtle grid grid-cols-[1fr_auto_auto] gap-3 border-b pb-1.5 text-[0.625rem] font-medium uppercase tracking-wide">
              <span>Item</span>
              <span className="text-right">Qty</span>
              <span className="text-right">Amount</span>
            </div>
            {SAMPLE_ITEMS.map((item) => (
              <div
                key={item.sku}
                className="border-border-subtle grid grid-cols-[1fr_auto_auto] gap-3 border-b py-2 text-[0.6875rem] last:border-b-0"
              >
                <div className="min-w-0">
                  <p className="truncate font-medium">{item.name}</p>
                  {invoice.showSku ? (
                    <p className="text-muted-foreground font-mono text-[0.625rem]">
                      {item.sku}
                    </p>
                  ) : null}
                </div>
                <span className="text-right">{item.quantity}</span>
                <span className="text-right font-medium">
                  {formatMoney(item.quantity * item.unitPrice, moneyOptions)}
                </span>
              </div>
            ))}
          </div>

          <div className="border-border-subtle mt-4 flex justify-end border-t pt-3">
            <div className="w-full max-w-56 space-y-1 text-[0.6875rem]">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Subtotal</span>
                <span className="font-medium">
                  {formatMoney(subtotal, moneyOptions)}
                </span>
              </div>
              {invoice.showDiscountBreakdown ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Discount</span>
                  <span className="font-medium">
                    − {formatMoney(discount, moneyOptions)}
                  </span>
                </div>
              ) : null}
              {invoice.showTaxBreakdown ? (
                <div className="flex justify-between gap-4">
                  <span className="text-muted-foreground">Tax</span>
                  <span className="font-medium">
                    {formatMoney(tax, moneyOptions)}
                  </span>
                </div>
              ) : null}
              <div className="border-border-subtle flex justify-between gap-4 border-t pt-1.5 text-xs">
                <span className="font-semibold">Total</span>
                <span className="font-semibold">
                  {formatMoney(total, moneyOptions)}
                </span>
              </div>
            </div>
          </div>

          {invoice.paymentTerms.trim() ? (
            <div className="border-border-subtle mt-4 border-t pt-3 text-[0.6875rem]">
              <p className="text-muted-foreground font-medium">Payment terms</p>
              <p className="mt-0.5 whitespace-pre-line">
                {invoice.paymentTerms.trim()}
              </p>
            </div>
          ) : null}

          {invoice.notes.trim() ? (
            <div className="border-border-subtle mt-3 border-t pt-3 text-[0.6875rem]">
              <p className="text-muted-foreground font-medium">Notes</p>
              <p className="mt-0.5 whitespace-pre-line">{invoice.notes.trim()}</p>
            </div>
          ) : null}

          {taxRegistrationNumber || additionalInfo ? (
            <div className="border-border-subtle mt-3 border-t pt-3 text-[0.625rem] text-muted-foreground">
              {taxRegistrationNumber ? (
                <p>Tax registration: {taxRegistrationNumber}</p>
              ) : null}
              {additionalInfo ? (
                <p className="mt-0.5 whitespace-pre-line">{additionalInfo}</p>
              ) : null}
            </div>
          ) : null}

          <p className="text-muted-foreground border-border-subtle mt-4 border-t pt-2.5 text-center text-[0.625rem]">
            {invoice.footerText.trim() || "Thank you for your business."}
          </p>
        </div>
      </div>

      <p className="text-muted-foreground flex items-start gap-1.5 text-[0.6875rem] leading-relaxed">
        <FileText className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
        The preview uses sample items and is never saved as a real invoice.
      </p>
    </div>
  );
}
