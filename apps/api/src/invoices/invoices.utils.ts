import { BadRequestException } from '@nestjs/common';
import {
  InvoiceDefaultStatus,
  Prisma,
  type InvoiceStatus,
} from '@repo/database';
import type {
  EffectiveInvoiceBusinessInformation,
  InvoiceSettingsResponse,
  TaxSettingsResponse,
} from '../settings/settings.types.js';
import {
  INVOICE_NUMBER_MAX_LENGTH,
  INVOICE_NUMBER_PATTERN,
  INVOICE_SNAPSHOT_FORMAT_VERSION,
} from './invoices.constants.js';
import type {
  InvoiceBusinessSnapshot,
  InvoiceNotesSnapshot,
  InvoicePresentationSnapshot,
  InvoiceSnapshot,
  InvoiceTaxSnapshot,
} from './invoices.types.js';

export interface InvoiceSnapshotInput {
  business: EffectiveInvoiceBusinessInformation;
  settings: InvoiceSettingsResponse;
  tax: Pick<TaxSettingsResponse, 'enabled' | 'defaultName' | 'defaultRate'>;
  customerNote: string | null;
  capturedAt?: Date;
}

/**
 * Captures everything the PDF needs that could later change in settings or on
 * the order. Line items and payments stay linked to the order so a paid or
 * partially refunded invoice keeps showing the real transaction history.
 */
export function buildInvoiceSnapshot(
  input: InvoiceSnapshotInput,
): InvoiceSnapshot {
  const { business, settings, tax } = input;

  const businessSnapshot: InvoiceBusinessSnapshot = {
    name: business.displayName,
    addressLine1: business.addressLine1,
    addressLine2: business.addressLine2,
    city: business.city,
    state: business.state,
    postalCode: business.postalCode,
    country: business.country,
    phone: business.phone,
    email: business.email,
    website: null,
    taxId: business.taxRegistrationNumber,
    additionalInfo: business.additionalInfo,
  };

  const presentation: InvoicePresentationSnapshot = {
    showSku: settings.showSku,
    showTaxBreakdown: settings.showTaxBreakdown,
    showDiscountBreakdown: settings.showDiscountBreakdown,
  };

  const notes: InvoiceNotesSnapshot = {
    customerNote: input.customerNote,
    invoiceNotes: settings.notes,
    paymentTerms: settings.paymentTerms,
    footerText: settings.footerText,
  };

  const taxSnapshot: InvoiceTaxSnapshot = {
    enabled: tax.enabled,
    name: tax.defaultName,
    rate: tax.defaultRate.toString(),
  };

  return {
    formatVersion: INVOICE_SNAPSHOT_FORMAT_VERSION,
    capturedAt: (input.capturedAt ?? new Date()).toISOString(),
    business: businessSnapshot,
    presentation,
    notes,
    tax: taxSnapshot,
  };
}

/**
 * Reads a snapshot stored as JSON. Malformed snapshots are returned as `null`
 * so the caller can fall back to live settings instead of rendering a partial
 * document.
 */
export function parseInvoiceSnapshot(
  value: Prisma.JsonValue | null,
): InvoiceSnapshot | null {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) {
    return null;
  }

  const root = value as Record<string, unknown>;
  const business = pickObject(root.business);
  const presentation = pickObject(root.presentation);
  const notes = pickObject(root.notes);
  const tax = pickObject(root.tax);

  if (!business || !presentation || !notes || !tax) {
    return null;
  }

  return {
    formatVersion:
      typeof root.formatVersion === 'number' ? root.formatVersion : 0,
    capturedAt:
      typeof root.capturedAt === 'string'
        ? root.capturedAt
        : new Date(0).toISOString(),
    business: {
      name: pickString(business.name) ?? 'VendKit',
      addressLine1: pickNullableString(business.addressLine1),
      addressLine2: pickNullableString(business.addressLine2),
      city: pickNullableString(business.city),
      state: pickNullableString(business.state),
      postalCode: pickNullableString(business.postalCode),
      country: pickNullableString(business.country),
      phone: pickNullableString(business.phone),
      email: pickNullableString(business.email),
      website: pickNullableString(business.website),
      taxId: pickNullableString(business.taxId),
      additionalInfo: pickNullableString(business.additionalInfo),
    },
    presentation: {
      showSku: readFlag(presentation.showSku, true),
      showTaxBreakdown: readFlag(presentation.showTaxBreakdown, true),
      showDiscountBreakdown: readFlag(
        presentation.showDiscountBreakdown,
        true,
      ),
    },
    notes: {
      customerNote: pickNullableString(notes.customerNote),
      invoiceNotes: pickNullableString(notes.invoiceNotes),
      paymentTerms: pickNullableString(notes.paymentTerms),
      footerText: pickNullableString(notes.footerText),
    },
    tax: {
      enabled: readFlag(tax.enabled, false),
      name: pickString(tax.name) ?? 'Tax',
      rate: pickString(tax.rate) ?? '0',
    },
  };
}

export function resolveInvoiceStatusAfterCreate(
  defaultStatus: InvoiceDefaultStatus,
): InvoiceStatus {
  return defaultStatus === InvoiceDefaultStatus.ISSUED ? 'ISSUED' : 'DRAFT';
}

/** Due date is issued-date plus the configured grace period. */
export function calculateInvoiceDueDate(
  issuedAt: Date,
  duePeriodDays: number,
): Date | null {
  if (!Number.isFinite(duePeriodDays) || duePeriodDays <= 0) {
    return null;
  }

  const dueDate = new Date(issuedAt);
  dueDate.setUTCDate(dueDate.getUTCDate() + Math.trunc(duePeriodDays));
  return dueDate;
}

export function normalizeInvoiceNumber(value: string): string {
  const trimmed = value.trim();

  if (
    trimmed.length === 0 ||
    trimmed.length > INVOICE_NUMBER_MAX_LENGTH ||
    !INVOICE_NUMBER_PATTERN.test(trimmed)
  ) {
    throw new BadRequestException(
      'Invoice number must start with a letter or number and contain only letters, numbers, dots, dashes, underscores, or slashes',
    );
  }

  return trimmed;
}

export function buildInvoiceSearchWhere(
  search: string,
): Prisma.InvoiceWhereInput {
  return {
    OR: [
      { invoiceNumber: { contains: search, mode: 'insensitive' } },
      { order: { orderNumber: { contains: search, mode: 'insensitive' } } },
      {
        order: {
          customer: { name: { contains: search, mode: 'insensitive' } },
        },
      },
      { order: { shippingName: { contains: search, mode: 'insensitive' } } },
    ],
  };
}

export function isInvoiceIssued(
  invoice: { status: InvoiceStatus } | null,
): boolean {
  return invoice?.status === 'ISSUED';
}

export function isUniqueConstraintViolation(error: unknown): boolean {
  return (
    error instanceof Prisma.PrismaClientKnownRequestError &&
    error.code === 'P2002'
  );
}

function pickObject(value: unknown): Record<string, unknown> | null {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : null;
}

function pickString(value: unknown): string | null {
  return typeof value === 'string' && value.trim().length > 0 ? value : null;
}

function pickNullableString(value: unknown): string | null {
  return typeof value === 'string' ? value : null;
}

function readFlag(value: unknown, fallback: boolean): boolean {
  return typeof value === 'boolean' ? value : fallback;
}
