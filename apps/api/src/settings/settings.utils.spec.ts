import { Prisma } from '@repo/database';
import {
  areValidSeparators,
  calculateShippingCharge,
  formatInvoiceNumber,
  isInvoiceNumberFormatCompatible,
} from './settings.utils.js';

describe('settings utils', () => {
  describe('formatInvoiceNumber', () => {
    const issuedAt = new Date('2026-11-10T12:00:00.000Z');

    it('renders prefix, year, month and sequence tokens', () => {
      const result = formatInvoiceNumber(
        {
          numberPrefix: 'INV',
          numberFormat: '{prefix}-{year}{month}-{sequence}',
          yearBasedNumbering: true,
        },
        42,
        issuedAt,
      );

      expect(result).toBe('INV-202611-42');
    });

    it('omits the year token when year-based numbering is disabled', () => {
      const result = formatInvoiceNumber(
        {
          numberPrefix: 'INV',
          numberFormat: '{prefix}-{sequence}',
          yearBasedNumbering: false,
        },
        7,
        issuedAt,
      );

      expect(result).toBe('INV-7');
    });
  });

  describe('isInvoiceNumberFormatCompatible', () => {
    it('allows {year} when year-based numbering is enabled', () => {
      expect(
        isInvoiceNumberFormatCompatible('{prefix}-{year}-{sequence}', true),
      ).toBe(true);
    });

    it('rejects {year} when year-based numbering is disabled', () => {
      expect(
        isInvoiceNumberFormatCompatible('{prefix}-{year}-{sequence}', false),
      ).toBe(false);
    });
  });

  describe('areValidSeparators', () => {
    it('accepts distinct punctuation separators', () => {
      expect(areValidSeparators('.', ',')).toBe(true);
    });

    it('rejects identical separators', () => {
      expect(areValidSeparators('.', '.')).toBe(false);
    });

    it('rejects letters and digits as separators', () => {
      expect(areValidSeparators('a', ',')).toBe(false);
      expect(areValidSeparators('.', '1')).toBe(false);
    });

    it('allows an empty thousand separator', () => {
      expect(areValidSeparators('.', '')).toBe(true);
    });
  });

  describe('calculateShippingCharge', () => {
    it('honours an explicit charge even when free shipping applies', () => {
      const charge = calculateShippingCharge({
        requestedCharge: new Prisma.Decimal(25),
        enabled: true,
        defaultCharge: new Prisma.Decimal(10),
        freeShippingThreshold: new Prisma.Decimal(100),
        subtotal: new Prisma.Decimal(200),
      });

      expect(charge.toString()).toBe('25');
    });

    it('uses the default charge below the free shipping threshold', () => {
      const charge = calculateShippingCharge({
        requestedCharge: undefined,
        enabled: true,
        defaultCharge: new Prisma.Decimal(10),
        freeShippingThreshold: new Prisma.Decimal(100),
        subtotal: new Prisma.Decimal(99),
      });

      expect(charge.toString()).toBe('10');
    });

    it('waives shipping at or above the free shipping threshold', () => {
      const charge = calculateShippingCharge({
        requestedCharge: undefined,
        enabled: true,
        defaultCharge: new Prisma.Decimal(10),
        freeShippingThreshold: new Prisma.Decimal(100),
        subtotal: new Prisma.Decimal(100),
      });

      expect(charge.toString()).toBe('0');
    });

    it('returns zero when shipping is disabled', () => {
      const charge = calculateShippingCharge({
        requestedCharge: undefined,
        enabled: false,
        defaultCharge: new Prisma.Decimal(10),
        freeShippingThreshold: null,
        subtotal: new Prisma.Decimal(500),
      });

      expect(charge.toString()).toBe('0');
    });
  });
});
