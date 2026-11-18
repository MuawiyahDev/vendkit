import { Prisma } from '@repo/database';
import type { InvoiceSettingsResponse } from '../settings/settings.types.js';
import {
  buildInvoiceSearchWhere,
  buildInvoiceSnapshot,
  calculateInvoiceDueDate,
  normalizeInvoiceNumber,
  parseInvoiceSnapshot,
  resolveInvoiceStatusAfterCreate,
} from './invoices.utils.js';

describe('invoice utils', () => {
  const settings = {
    showSku: true,
    showTaxBreakdown: false,
    showDiscountBreakdown: true,
    notes: 'Invoice note',
    paymentTerms: 'Due on receipt',
    footerText: 'Thanks',
    effectiveBusinessInformation: {
      displayName: 'VendKit',
    },
  } as unknown as InvoiceSettingsResponse;

  const business = {
    displayName: 'VendKit',
    logo: null,
    email: 'hello@example.com',
    phone: '123',
    addressLine1: '1 Market St',
    addressLine2: null,
    city: 'Dhaka',
    state: null,
    postalCode: '1200',
    country: 'Bangladesh',
    taxRegistrationNumber: 'TAX-1',
    additionalInfo: null,
  };

  const tax = {
    enabled: true,
    defaultName: 'VAT',
    defaultRate: '5',
  };

  it('builds a snapshot from settings and current values', () => {
    const capturedAt = new Date('2026-11-18T10:00:00.000Z');
    const snapshot = buildInvoiceSnapshot({
      business,
      settings,
      tax,
      customerNote: 'Leave at the door',
      capturedAt,
    });

    expect(snapshot.business.name).toBe('VendKit');
    expect(snapshot.business.taxId).toBe('TAX-1');
    expect(snapshot.presentation).toEqual({
      showSku: true,
      showTaxBreakdown: false,
      showDiscountBreakdown: true,
    });
    expect(snapshot.notes.customerNote).toBe('Leave at the door');
    expect(snapshot.tax).toEqual({ enabled: true, name: 'VAT', rate: '5' });
    expect(snapshot.capturedAt).toBe('2026-11-18T10:00:00.000Z');
  });

  it('round-trips a snapshot through JSON', () => {
    const snapshot = buildInvoiceSnapshot({
      business,
      settings,
      tax,
      customerNote: null,
    });

    const parsed = parseInvoiceSnapshot(
      JSON.parse(JSON.stringify(snapshot)) as Prisma.JsonValue,
    );

    expect(parsed).toEqual(snapshot);
  });

  it('rejects malformed snapshots instead of returning partial data', () => {
    expect(parseInvoiceSnapshot(null)).toBeNull();
    expect(parseInvoiceSnapshot({ business: {} } as Prisma.JsonValue)).toBeNull();
    expect(parseInvoiceSnapshot({ business: {}, presentation: {} } as Prisma.JsonValue)).toBeNull();
  });

  it('maps the invoice default status to the persisted status', () => {
    expect(resolveInvoiceStatusAfterCreate('ISSUED')).toBe('ISSUED');
    expect(resolveInvoiceStatusAfterCreate('DRAFT')).toBe('DRAFT');
  });

  it('calculates a due date from the grace period', () => {
    const issuedAt = new Date('2026-11-18T23:30:00.000Z');
    expect(calculateInvoiceDueDate(issuedAt, 30)?.toISOString()).toBe(
      '2026-12-18T23:30:00.000Z',
    );
    expect(calculateInvoiceDueDate(issuedAt, 0)).toBeNull();
  });

  it('normalizes a manual invoice number', () => {
    expect(normalizeInvoiceNumber('  INV-2026-1 ')).toBe('INV-2026-1');
    expect(() => normalizeInvoiceNumber('')).toThrow();
    expect(() => normalizeInvoiceNumber('bad number')).toThrow();
    expect(() => normalizeInvoiceNumber('-INV')).toThrow();
  });

  it('searches invoice number, order number, and customer name', () => {
    const where = buildInvoiceSearchWhere('INV') as {
      OR: Array<Record<string, unknown>>;
    };

    expect(where.OR).toHaveLength(4);
    expect(where.OR[0]).toEqual({
      invoiceNumber: { contains: 'INV', mode: 'insensitive' },
    });
  });
});
