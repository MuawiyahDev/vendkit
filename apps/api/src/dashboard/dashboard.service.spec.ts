import { Test } from '@nestjs/testing';
import { Prisma } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { DashboardService } from './dashboard.service.js';

const productId = '3f1d2c9a-0000-4000-8000-000000000010';
const imageId = '3f1d2c9a-0000-4000-8000-000000000020';
const orderId = '3f1d2c9a-0000-4000-8000-000000000030';

const regionalSettings = {
  currency: 'BDT',
  currencySymbol: '৳',
  currencyPosition: 'BEFORE',
  decimalPrecision: 2,
  thousandSeparator: ',',
  decimalSeparator: '.',
  defaultCountry: 'BD',
  timezone: 'Asia/Dhaka',
  dateFormat: 'DD/MM/YYYY',
  timeFormat: 'HH:mm',
  language: 'en',
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function productRow(overrides: Record<string, unknown> = {}) {
  return {
    id: productId,
    name: 'Cotton Crew T-Shirt',
    sku: 'TS-CREW-001',
    stockQuantity: 4,
    lowStockThreshold: 5,
    images: [{ image: { id: imageId } }],
    ...overrides,
  };
}

describe('DashboardService', () => {
  let service: DashboardService;

  const prismaMock = {
    client: {
      $queryRaw: vi.fn(),
      order: {
        aggregate: vi.fn(),
        count: vi.fn(),
        groupBy: vi.fn(),
        findMany: vi.fn(),
      },
      orderItem: {
        groupBy: vi.fn(),
      },
      customer: {
        count: vi.fn(),
      },
      invoice: {
        count: vi.fn(),
      },
      backup: {
        count: vi.fn(),
      },
      user: {
        count: vi.fn(),
      },
      product: {
        count: vi.fn(),
        findMany: vi.fn(),
        fields: { lowStockThreshold: 'Product.lowStockThreshold' },
      },
    },
  };

  const settingsMock = {
    getRegionalSettings: vi.fn(),
    getBusinessProfile: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    settingsMock.getRegionalSettings.mockResolvedValue(regionalSettings);
    settingsMock.getBusinessProfile.mockResolvedValue({
      businessName: 'VendKit',
      email: null,
      phone: null,
      addressLine1: null,
    });

    prismaMock.client.order.aggregate
      .mockResolvedValueOnce({
        _sum: { totalAmount: new Prisma.Decimal('50') },
        _count: { _all: 1 },
      })
      .mockResolvedValueOnce({
        _sum: { totalAmount: new Prisma.Decimal('20') },
        _count: { _all: 1 },
      });

    prismaMock.client.order.count
      .mockResolvedValueOnce(4)
      .mockResolvedValueOnce(2)
      .mockResolvedValueOnce(12);

    prismaMock.client.customer.count
      .mockResolvedValueOnce(8)
      .mockResolvedValueOnce(3);

    prismaMock.client.invoice.count.mockResolvedValue(0);
    prismaMock.client.backup.count.mockResolvedValue(0);
    prismaMock.client.user.count.mockResolvedValue(1);

    prismaMock.client.product.count.mockImplementation(
      async ({ where }: { where: Record<string, unknown> }) => {
        const stockCondition = where.stockQuantity as
          { lte?: number; gt?: number } | undefined;

        if (stockCondition?.lte === 0) {
          return 1;
        }
        if (stockCondition?.gt === 0) {
          return 2;
        }
        return 10;
      },
    );

    prismaMock.client.order.groupBy.mockResolvedValue([
      { status: 'PENDING', _count: { _all: 1 } },
      { status: 'DELIVERED', _count: { _all: 2 } },
      { status: 'CANCELLED', _count: { _all: 1 } },
    ]);

    prismaMock.client.$queryRaw.mockResolvedValue([
      { bucket: '2026-10-02', revenue: '50', orders: 1 },
    ]);

    prismaMock.client.order.findMany.mockResolvedValue([
      {
        id: orderId,
        orderNumber: 'ORD-20261002-ABC123',
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        totalAmount: new Prisma.Decimal('50'),
        currency: 'BDT',
        createdAt: new Date('2026-10-02T10:00:00.000Z'),
        shippingName: 'Walk-in buyer',
        customer: null,
      },
    ]);

    prismaMock.client.orderItem.groupBy.mockResolvedValue([
      {
        productId,
        _sum: {
          quantity: 2,
          lineTotal: new Prisma.Decimal('50'),
        },
      },
    ]);

    prismaMock.client.product.findMany.mockImplementation(
      async (args: { where: { OR?: unknown[]; id?: unknown } }) => {
        if (args.where.OR) {
          return [productRow()];
        }

        return [productRow()];
      },
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        DashboardService,
        { provide: PrismaService, useValue: prismaMock },
        { provide: SettingsService, useValue: settingsMock },
      ],
    }).compile();

    service = moduleRef.get(DashboardService);
  });

  it('aggregates summary, series, status, recent orders and product insights', async () => {
    const dashboard = await service.getDashboard({
      preset: 'custom',
      from: '2026-10-01',
      to: '2026-10-03',
    });

    expect(dashboard.range).toEqual({
      preset: 'custom',
      from: '2026-10-01',
      to: '2026-10-03',
      previousFrom: '2026-09-28',
      previousTo: '2026-09-30',
      granularity: 'day',
    });

    expect(dashboard.summary).toEqual({
      revenue: {
        current: '50',
        previous: '20',
        changePercent: 150,
      },
      orders: {
        current: 4,
        previous: 2,
        changePercent: 100,
      },
      averageOrderValue: {
        current: '50.00',
        previous: '20.00',
        changePercent: 150,
      },
      customers: { total: 8, newInPeriod: 3 },
      inventory: { totalProducts: 10, lowStock: 2, outOfStock: 1 },
    });

    expect(dashboard.series).toEqual([
      { bucket: '2026-10-01', revenue: '0', orders: 0 },
      { bucket: '2026-10-02', revenue: '50', orders: 1 },
      { bucket: '2026-10-03', revenue: '0', orders: 0 },
    ]);

    expect(dashboard.statusCounts).toEqual([
      { status: 'PENDING', count: 1 },
      { status: 'CONFIRMED', count: 0 },
      { status: 'PROCESSING', count: 0 },
      { status: 'SHIPPED', count: 0 },
      { status: 'DELIVERED', count: 2 },
      { status: 'CANCELLED', count: 1 },
    ]);

    expect(dashboard.recentOrders[0]).toMatchObject({
      orderNumber: 'ORD-20261002-ABC123',
      customerName: 'Walk-in buyer',
      totalAmount: '50',
      paymentStatus: 'PAID',
      status: 'DELIVERED',
    });

    expect(dashboard.bestSellingProducts[0]).toEqual({
      productId,
      name: 'Cotton Crew T-Shirt',
      sku: 'TS-CREW-001',
      imageUrl: `/api/images/${imageId}/file`,
      unitsSold: 2,
      revenue: '50',
    });

    expect(dashboard.inventoryAlerts[0]).toMatchObject({
      productId,
      stockQuantity: 4,
      lowStockThreshold: 5,
    });
  });
});
