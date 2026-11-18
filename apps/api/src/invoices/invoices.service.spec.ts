import { ConflictException } from '@nestjs/common';
import {
  InvoiceDefaultStatus,
  OrderStatus,
  Prisma,
  type Order,
} from '@repo/database';
import type { InvoiceNumberingService } from '../settings/invoice-numbering.service.js';
import type { SettingsService } from '../settings/settings.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';
import { InvoicesService } from './invoices.service.js';

const NOW = new Date('2026-11-18T10:00:00.000Z');

function orderFixture(overrides: Partial<Order> = {}): Order {
  return {
    id: '3f1d2c9a-0000-4000-8000-000000000030',
    orderNumber: 'ORD-20261118-ABC123',
    customerId: null,
    status: OrderStatus.PENDING,
    paymentStatus: 'UNPAID',
    currency: 'BDT',
    subtotal: new Prisma.Decimal('500.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    shippingFee: new Prisma.Decimal('50.00'),
    taxAmount: new Prisma.Decimal('0.00'),
    totalAmount: new Prisma.Decimal('550.00'),
    amountPaid: new Prisma.Decimal('0.00'),
    stockDeducted: false,
    shippingName: 'Buyer',
    shippingPhone: null,
    shippingAddress: null,
    shippingCity: null,
    shippingPostalCode: null,
    customerNote: null,
    internalNote: null,
    cancellationReason: null,
    cancelledAt: null,
    createdAt: NOW,
    updatedAt: NOW,
    ...overrides,
  };
}

const invoiceSettings = {
  automaticNumbering: true,
  defaultStatus: InvoiceDefaultStatus.ISSUED,
  duePeriodDays: 30,
  numberPrefix: 'INV',
  notes: null,
  paymentTerms: 'Due in 30 days',
  footerText: 'Thanks',
  showSku: true,
  showTaxBreakdown: true,
  showDiscountBreakdown: true,
  allowEditingAfterIssue: false,
  allowCancellation: true,
  effectiveBusinessInformation: {
    displayName: 'VendKit',
    logo: null,
    email: null,
    phone: null,
    addressLine1: null,
    addressLine2: null,
    city: null,
    state: null,
    postalCode: null,
    country: null,
    taxRegistrationNumber: null,
    additionalInfo: null,
  },
};

const taxSettings = {
  enabled: false,
  defaultName: 'VAT',
  defaultRate: '0',
};

function invoiceRow(overrides: Record<string, unknown> = {}) {
  return {
    id: 'invoice-1',
    invoiceNumber: 'INV-2026-1',
    orderId: orderFixture().id,
    status: 'ISSUED',
    issueDate: NOW,
    dueDate: new Date('2026-12-18T10:00:00.000Z'),
    sequenceYear: 2026,
    sequenceValue: 1,
    currency: 'BDT',
    subtotal: new Prisma.Decimal('500.00'),
    discountAmount: new Prisma.Decimal('0.00'),
    shippingFee: new Prisma.Decimal('50.00'),
    taxAmount: new Prisma.Decimal('0.00'),
    totalAmount: new Prisma.Decimal('550.00'),
    snapshot: {},
    cancelledAt: null,
    cancellationReason: null,
    createdByName: 'Owner',
    createdAt: NOW,
    updatedAt: NOW,
    order: {
      ...orderFixture(),
      customer: null,
      items: [],
      payments: [],
    },
    ...overrides,
  };
}

function createHarness() {
  const tx = {
    order: { findUnique: vi.fn() },
    invoice: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
  };

  const prisma = {
    client: {
      $transaction: vi.fn(
        async (fn: (client: typeof tx) => Promise<unknown>) => fn(tx),
      ),
      invoice: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
      },
    },
  };

  const settings = {
    getInvoiceSettings: vi.fn().mockResolvedValue(invoiceSettings),
    getTaxSettings: vi.fn().mockResolvedValue(taxSettings),
  };

  const numbering = {
    claimNext: vi.fn().mockResolvedValue({
      number: 'INV-2026-1',
      sequence: 1,
      year: 2026,
    }),
  };

  const service = new InvoicesService(
    prisma as unknown as PrismaService,
    settings as unknown as SettingsService,
    numbering as unknown as InvoiceNumberingService,
  );

  return { service, tx, prisma, settings, numbering };
}

describe('InvoicesService', () => {
  it('creates an issued invoice with a snapshot and allocated number', async () => {
    const { service, tx, numbering } = createHarness();
    tx.order.findUnique.mockResolvedValue({
      ...orderFixture(),
      customer: null,
      items: [],
      payments: [],
    });
    tx.invoice.create.mockResolvedValue(invoiceRow());

    const invoice = await service.createForOrder(orderFixture().id, {});

    expect(numbering.claimNext).toHaveBeenCalled();
    const createArgs = tx.invoice.create.mock.calls[0]?.[0] as {
      data: Record<string, unknown>;
    };
    expect(createArgs.data).toMatchObject({
      invoiceNumber: 'INV-2026-1',
      status: 'ISSUED',
      totalAmount: new Prisma.Decimal('550.00'),
      createdByName: null,
    });
    expect(createArgs.data.snapshot).toMatchObject({
      business: { name: 'VendKit' },
      notes: { paymentTerms: 'Due in 30 days' },
    });
    expect(invoice.invoiceNumber).toBe('INV-2026-1');
  });

  it('refuses to invoice a cancelled order', async () => {
    const { service, tx } = createHarness();
    tx.order.findUnique.mockResolvedValue({
      ...orderFixture({ status: OrderStatus.CANCELLED }),
      customer: null,
      items: [],
      payments: [],
    });

    await expect(
      service.createForOrder(orderFixture().id, {}),
    ).rejects.toBeInstanceOf(ConflictException);
    expect(tx.invoice.create).not.toHaveBeenCalled();
  });

  it('requires a manual number when automatic numbering is off', async () => {
    const { service, tx, settings } = createHarness();
    settings.getInvoiceSettings.mockResolvedValue({
      ...invoiceSettings,
      automaticNumbering: false,
    });
    tx.order.findUnique.mockResolvedValue({
      ...orderFixture(),
      customer: null,
      items: [],
      payments: [],
    });

    await expect(
      service.createForOrder(orderFixture().id, {}),
    ).rejects.toThrow('Automatic numbering is disabled');
  });

  it('does not cancel invoices when cancellation is disabled', async () => {
    const { service, settings, prisma } = createHarness();
    settings.getInvoiceSettings.mockResolvedValue({
      ...invoiceSettings,
      allowCancellation: false,
    });
    prisma.client.invoice.findUnique.mockResolvedValue(invoiceRow());

    await expect(
      service.cancel('invoice-1', { cancellationReason: null }),
    ).rejects.toThrow('Invoice cancellation is disabled in settings');
  });

  it('issues a draft and captures fresh totals', async () => {
    const { service, tx } = createHarness();
    const draft = invoiceRow({ status: 'DRAFT', snapshot: null });
    tx.invoice.findUnique.mockResolvedValue(draft);
    tx.invoice.update.mockResolvedValue(
      invoiceRow({ status: 'ISSUED', snapshot: {} }),
    );

    const invoice = await service.issue('invoice-1');

    expect(tx.invoice.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: 'ISSUED',
          totalAmount: new Prisma.Decimal('550.00'),
        }),
      }),
    );
    expect(invoice.status).toBe('ISSUED');
  });
});
