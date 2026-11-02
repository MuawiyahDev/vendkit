import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  Prisma,
  type Customer,
  type Order,
  type OrderItem,
  type OrderPayment,
  type Product,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import type { CreateOrderDto } from './dto/create-order.dto.js';
import type { CreateOrderPaymentDto } from './dto/create-order-payment.dto.js';
import type { UpdateOrderDto } from './dto/update-order.dto.js';
import { OrdersService } from './orders.service.js';

const NOW = new Date('2026-10-18T00:00:00.000Z');

const customerFixture: Customer = {
  id: '3f1d2c9a-0000-4000-8000-000000000001',
  name: 'Ayesha Rahman',
  phone: '+8801712345678',
  email: 'ayesha@example.com',
  address: 'House 12, Road 5',
  city: 'Dhaka',
  postalCode: '1207',
  notes: null,
  createdAt: NOW,
  updatedAt: NOW,
};

const productFixture = (overrides: Partial<Product> = {}): Product => ({
  id: '3f1d2c9a-0000-4000-8000-000000000010',
  name: 'Cotton Panjabi',
  slug: 'cotton-panjabi',
  description: null,
  shortDescription: null,
  sku: 'PAN-001',
  categoryId: '3f1d2c9a-0000-4000-8000-000000000020',
  brandId: null,
  unit: null,
  sellingPrice: new Prisma.Decimal('250.00'),
  compareAtPrice: null,
  stockQuantity: 10,
  lowStockThreshold: null,
  weight: null,
  length: null,
  width: null,
  height: null,
  isActive: true,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const orderFixture = (overrides: Partial<Order> = {}): Order => ({
  id: '3f1d2c9a-0000-4000-8000-000000000030',
  orderNumber: 'ORD-20261018-ABC123',
  customerId: customerFixture.id,


  status: OrderStatus.PENDING,
  paymentStatus: PaymentStatus.UNPAID,
  currency: 'BDT',
  subtotal: new Prisma.Decimal('500.00'),
  discountAmount: new Prisma.Decimal('0.00'),
  shippingFee: new Prisma.Decimal('0.00'),
  taxAmount: new Prisma.Decimal('0.00'),
  totalAmount: new Prisma.Decimal('500.00'),
  amountPaid: new Prisma.Decimal('0.00'),
  stockDeducted: true,
  shippingName: 'Ayesha Rahman',
  shippingPhone: '+8801712345678',
  shippingAddress: 'House 12, Road 5',
  shippingCity: 'Dhaka',
  shippingPostalCode: '1207',
  customerNote: null,
  internalNote: null,
  cancellationReason: null,
  cancelledAt: null,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const orderItemFixture = (overrides: Partial<OrderItem> = {}): OrderItem => ({
  id: '3f1d2c9a-0000-4000-8000-000000000040',
  orderId: '3f1d2c9a-0000-4000-8000-000000000030',
  productId: '3f1d2c9a-0000-4000-8000-000000000010',
  productName: 'Cotton Panjabi',
  sku: 'PAN-001',
  unitPrice: new Prisma.Decimal('250.00'),
  quantity: 2,
  lineTotal: new Prisma.Decimal('500.00'),
  createdAt: NOW,
  ...overrides,
});

const orderPaymentFixture = (
  overrides: Partial<OrderPayment> = {},
): OrderPayment => ({
  id: '3f1d2c9a-0000-4000-8000-000000000050',
  orderId: '3f1d2c9a-0000-4000-8000-000000000030',
  amount: new Prisma.Decimal('200.00'),
  method: PaymentMethod.CASH,
  status: OrderPaymentStatus.COMPLETED,
  reference: null,
  note: null,
  paidAt: NOW,
  createdAt: NOW,
  updatedAt: NOW,
  ...overrides,
});

const orderWithRelationsFixture = (overrides: Partial<Order> = {}) => ({
  ...orderFixture(overrides),
  customer: {
    id: customerFixture.id,
    name: customerFixture.name,
    phone: customerFixture.phone,
    email: customerFixture.email,
  },
  items: [orderItemFixture()],
  payments: [],
});

const orderSummaryFixture = (overrides: Partial<Order> = {}) => ({
  ...orderFixture(overrides),
  customer: {
    id: customerFixture.id,
    name: customerFixture.name,
    phone: customerFixture.phone,
    email: customerFixture.email,
  },
  items: [
    {
      id: '3f1d2c9a-0000-4000-8000-000000000040',
      productName: 'Cotton Panjabi',
      sku: 'PAN-001',
      unitPrice: new Prisma.Decimal('250.00'),
      quantity: 2,
      lineTotal: new Prisma.Decimal('500.00'),
    },
  ],
});

function uniqueViolation(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
    code: 'P2002',
    clientVersion: 'test',
  });
}

function recordNotFound(): Prisma.PrismaClientKnownRequestError {
  return new Prisma.PrismaClientKnownRequestError('Record not found', {
    code: 'P2025',
    clientVersion: 'test',
  });
}

describe('OrdersService', () => {
  let service: OrdersService;

  const txMock = {
    order: {
      findUnique: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    orderItem: {
      findMany: vi.fn(),
      deleteMany: vi.fn(),
    },
    orderPayment: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
      update: vi.fn(),
      deleteMany: vi.fn(),
      aggregate: vi.fn(),
    },
    product: {
      findMany: vi.fn(),
      updateMany: vi.fn(),
      update: vi.fn(),
    },
    customer: {
      findUnique: vi.fn(),
    },
  };

  const prismaMock = {
    client: {
      $transaction: vi.fn(),
      order: {
        findUnique: vi.fn(),
        findMany: vi.fn(),
        count: vi.fn(),
        update: vi.fn(),
      },
      orderPayment: {
        findMany: vi.fn(),
      },
      customer: {
        findUnique: vi.fn(),
      },
    },
  };

  const createDto: CreateOrderDto = {
    customerId: customerFixture.id,
    items: [{ productId: productFixture().id, quantity: 2 }],
  };

  beforeEach(async () => {
    vi.clearAllMocks();

    prismaMock.client.$transaction.mockImplementation(
      async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
    );

    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: prismaMock },
      ],
    }).compile();

    service = moduleRef.get(OrdersService);
  });

  describe('create', () => {
    beforeEach(() => {
      prismaMock.client.customer.findUnique.mockResolvedValue({
        id: customerFixture.id,
      });
      txMock.customer.findUnique.mockResolvedValue({
        name: customerFixture.name,
        phone: customerFixture.phone,
        address: customerFixture.address,
        city: customerFixture.city,
        postalCode: customerFixture.postalCode,
      });
      txMock.product.findMany.mockResolvedValue([productFixture()]);
      txMock.product.updateMany.mockResolvedValue({ count: 1 });
      txMock.order.create.mockResolvedValue(orderWithRelationsFixture());
    });

    it('creates an order with server-side totals and stock deduction', async () => {
      const result = await service.create(createDto);

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            orderNumber: expect.stringMatching(
              /^ORD-\d{8}-[A-Z2-9]{6}$/,
            ) as string,
            customerId: customerFixture.id,
            status: OrderStatus.PENDING,
            paymentStatus: PaymentStatus.UNPAID,
            currency: 'BDT',
            subtotal: new Prisma.Decimal('500.00'),
            totalAmount: new Prisma.Decimal('500.00'),
            stockDeducted: true,
            shippingName: 'Ayesha Rahman',
            shippingPhone: '+8801712345678',
            items: {
              create: [
                expect.objectContaining({
                  productId: productFixture().id,
                  productName: 'Cotton Panjabi',
                  sku: 'PAN-001',
                  unitPrice: new Prisma.Decimal('250.00'),
                  quantity: 2,
                  lineTotal: new Prisma.Decimal('500.00'),
                }),
              ],
            },
          }),
        }),
      );
      expect(txMock.product.updateMany).toHaveBeenCalledWith({
        where: {
          id: productFixture().id,
          isActive: true,
          stockQuantity: { gte: 2 },
        },
        data: { stockQuantity: { decrement: 2 } },
      });
      expect(result.totalAmount).toBe('500');
      expect(result.items).toHaveLength(1);
    });

    it('applies order-level discounts, shipping fees and taxes', async () => {
      await service.create({
        ...createDto,
        discountAmount: 50,
        shippingFee: 80,
        taxAmount: 20,
      });

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            subtotal: new Prisma.Decimal('500.00'),
            discountAmount: new Prisma.Decimal(50),
            shippingFee: new Prisma.Decimal(80),
            taxAmount: new Prisma.Decimal(20),
            totalAmount: new Prisma.Decimal('550.00'),
          }),
        }),
      );
    });

    it('combines duplicate product lines and checks combined stock', async () => {
      await service.create({
        ...createDto,
        items: [
          { productId: productFixture().id, quantity: 1 },
          { productId: productFixture().id, quantity: 2 },
        ],
      });

      expect(txMock.product.updateMany).toHaveBeenCalledTimes(1);
      expect(txMock.product.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ stockQuantity: { gte: 3 } }),
          data: { stockQuantity: { decrement: 3 } },
        }),
      );
    });

    it('uses customer details as shipping snapshot defaults', async () => {
      await service.create(createDto);

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingName: 'Ayesha Rahman',
            shippingPhone: '+8801712345678',
            shippingAddress: 'House 12, Road 5',
            shippingCity: 'Dhaka',
            shippingPostalCode: '1207',
          }),
        }),
      );
    });

    it('prefers explicit shipping overrides over customer defaults', async () => {
      await service.create({
        ...createDto,
        shippingName: 'Gift Recipient',
        shippingPhone: '+8801799999999',
        shippingAddress: 'Village Post Office',
        shippingCity: 'Rajshahi',
        shippingPostalCode: '6000',
        customerNote: 'Call before delivery',
        internalNote: 'Repeat customer',
      });

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingName: 'Gift Recipient',
            shippingPhone: '+8801799999999',
            shippingAddress: 'Village Post Office',
            shippingCity: 'Rajshahi',
            shippingPostalCode: '6000',
            customerNote: 'Call before delivery',
            internalNote: 'Repeat customer',
          }),
        }),
      );
    });

    it('throws not found when the customer does not exist', async () => {
      prismaMock.client.customer.findUnique.mockResolvedValue(null);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('throws not found when a product does not exist', async () => {
      txMock.product.findMany.mockResolvedValue([]);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(txMock.order.create).not.toHaveBeenCalled();
    });

    it('rejects inactive products', async () => {
      txMock.product.findMany.mockResolvedValue([
        productFixture({ isActive: false }),
      ]);

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(txMock.product.updateMany).not.toHaveBeenCalled();
    });

    it('rejects orders with insufficient stock', async () => {
      txMock.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(txMock.order.create).not.toHaveBeenCalled();
    });

    it('rejects a discount larger than the subtotal', async () => {
      await expect(
        service.create({ ...createDto, discountAmount: 999.99 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(txMock.product.updateMany).not.toHaveBeenCalled();
    });

    it('rejects a combined quantity above the per-item limit', async () => {
      await expect(
        service.create({
          ...createDto,
          items: [
            { productId: productFixture().id, quantity: 60000 },
            { productId: productFixture().id, quantity: 60000 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('retries order number generation after a unique violation', async () => {
      prismaMock.client.$transaction
        .mockRejectedValueOnce(uniqueViolation())
        .mockImplementationOnce(
          async (fn: (tx: typeof txMock) => Promise<unknown>) => fn(txMock),
        );

      const result = await service.create(createDto);

      expect(prismaMock.client.$transaction).toHaveBeenCalledTimes(2);
      expect(result.orderNumber).toBe('ORD-20261018-ABC123');
    });

    it('maps a persistent unique violation to a conflict', async () => {
      prismaMock.client.$transaction.mockRejectedValue(uniqueViolation());

      await expect(service.create(createDto)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(prismaMock.client.$transaction).toHaveBeenCalledTimes(5);
    });

    it('does not swallow unexpected database errors', async () => {
      const dbError = new Error('connection lost');
      prismaMock.client.$transaction.mockRejectedValue(dbError);

      await expect(service.create(createDto)).rejects.toBe(dbError);
    });

    it('creates a walk-in order with guest details and no customer', async () => {
      await service.create({
        items: createDto.items,
        guestName: 'Walk-in Buyer',
        guestPhone: '+8801700000001',
      });

      expect(prismaMock.client.customer.findUnique).not.toHaveBeenCalled();
      expect(txMock.customer.findUnique).not.toHaveBeenCalled();
      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: null,
            guestName: 'Walk-in Buyer',
            guestPhone: '+8801700000001',
          }),
        }),
      );
    });

    it('falls back to guest details for the shipping snapshot', async () => {
      await service.create({
        items: createDto.items,
        guestName: 'Walk-in Buyer',
      });

      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            shippingName: 'Walk-in Buyer',
            shippingPhone: null,
          }),
        }),
      );
    });

    it('rejects a walk-in order without a guest name', async () => {
      await expect(
        service.create({ items: createDto.items, guestPhone: '+8801700000001' }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('saves the guest as a customer when saveCustomer is set', async () => {
      txMock.customer.create.mockResolvedValue({
        id: '3f1d2c9a-0000-4000-8000-000000000099',
        name: 'Walk-in Buyer',
        phone: '+8801700000001',
        address: null,
        city: null,
        postalCode: null,
      });

      await service.create({
        items: createDto.items,
        guestName: 'Walk-in Buyer',
        guestPhone: '+8801700000001',
        saveCustomer: true,
      });

      expect(txMock.customer.create).toHaveBeenCalledWith({
        data: { name: 'Walk-in Buyer', phone: '+8801700000001' },
      });
      expect(txMock.order.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            customerId: '3f1d2c9a-0000-4000-8000-000000000099',
          
          
          }),
        }),
      );
    });

    it('requires a phone number when saveCustomer is set', async () => {
      await expect(
        service.create({
          items: createDto.items,
          guestName: 'Walk-in Buyer',
          saveCustomer: true,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('rejects saveCustomer together with an existing customerId', async () => {
      await expect(
        service.create({ ...createDto, saveCustomer: true }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });
  });

  describe('findAll', () => {
    beforeEach(() => {
      prismaMock.client.order.findMany.mockResolvedValue([
        orderSummaryFixture(),
      ]);
      prismaMock.client.order.count.mockResolvedValue(1);
    });

    it('returns paginated results with default page and limit', async () => {
      const result = await service.findAll({});

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {},
          orderBy: { createdAt: 'desc' },
          skip: 0,
          take: 20,
        }),
      );
      expect(result.meta).toEqual({
        page: 1,
        limit: 20,
        total: 1,
        totalPages: 1,
      });
      expect(result.data[0]?.totalAmount).toBe('500');
    });

    it('searches by order number and customer name', async () => {
      await service.findAll({ search: 'ORD-2026' });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: [
                  {
                    orderNumber: {
                      contains: 'ORD-2026',
                      mode: 'insensitive',
                    },
                  },
                  {
                    customer: {
                      name: { contains: 'ORD-2026', mode: 'insensitive' },
                    },
                  },
                ],
              },
            ],
          },
        }),
      );
    });

    it('adds a customer phone condition for phone-like search terms', async () => {
      await service.findAll({ search: '+880 (17) 1234-5678' });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                OR: expect.arrayContaining([
                  { customer: { phone: { contains: '+8801712345678' } } },
                ]),
              },
            ],
          },
        }),
      );
    });

    it('filters by status, payment status and customer', async () => {
      await service.findAll({
        status: OrderStatus.PENDING,
        paymentStatus: PaymentStatus.UNPAID,
        customerId: customerFixture.id,
      });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              { status: OrderStatus.PENDING },
              { paymentStatus: PaymentStatus.UNPAID },
              { customerId: customerFixture.id },
            ],
          },
        }),
      );
    });

    it('filters by creation date range including whole-day bounds', async () => {
      await service.findAll({ dateFrom: '2026-10-01', dateTo: '2026-10-18' });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            AND: [
              {
                createdAt: {
                  gte: new Date('2026-10-01T00:00:00.000Z'),
                  lte: new Date('2026-10-18T23:59:59.999Z'),
                },
              },
            ],
          },
        }),
      );
    });

    it('rejects a date range where dateFrom is after dateTo', async () => {
      await expect(
        service.findAll({ dateFrom: '2026-10-10', dateTo: '2026-10-01' }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('sorts by total amount descending by default', async () => {
      await service.findAll({ sortBy: 'totalAmount' });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { totalAmount: 'desc' } }),
      );
    });

    it('sorts by order number ascending by default', async () => {
      await service.findAll({ sortBy: 'orderNumber' });

      expect(prismaMock.client.order.findMany).toHaveBeenCalledWith(
        expect.objectContaining({ orderBy: { orderNumber: 'asc' } }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the order with items and payments', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(
        orderWithRelationsFixture(),
      );

      const result = await service.findOne(orderFixture().id);

      expect(result.orderNumber).toBe('ORD-20261018-ABC123');
      expect(result.items).toHaveLength(1);
      expect(result.payments).toEqual([]);
    });

    it('throws not found for a missing order', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(null);

      await expect(service.findOne(orderFixture().id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('findByOrderNumber', () => {
    it('looks up the order by normalized order number', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(
        orderWithRelationsFixture(),
      );

      await service.findByOrderNumber('  ord-20261018-abc123 ');

      expect(prismaMock.client.order.findUnique).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { orderNumber: 'ORD-20261018-ABC123' },
        }),
      );
    });

    it('throws not found for a missing order number', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(null);

      await expect(
        service.findByOrderNumber('ORD-00000000-ZZZZZZ'),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('update', () => {
    it('updates only permitted metadata fields', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
      });
      const updated = orderWithRelationsFixture({
        internalNote: 'Call first',
      });
      prismaMock.client.order.update.mockResolvedValue(updated);

      const dto: UpdateOrderDto = {
        internalNote: 'Call first',
        shippingCity: 'Rajshahi',
      };
      const result = await service.update(orderFixture().id, dto);

      expect(prismaMock.client.order.update).toHaveBeenCalledWith({
        where: { id: orderFixture().id },
        data: { internalNote: 'Call first', shippingCity: 'Rajshahi' },
        include: expect.any(Object),
      });
      expect(result.internalNote).toBe('Call first');
    });

    it('returns the existing order when no fields are supplied', async () => {
      prismaMock.client.order.findUnique
        .mockResolvedValueOnce({
          id: orderFixture().id,
          status: OrderStatus.PENDING,
        })
        .mockResolvedValueOnce(orderWithRelationsFixture());

      const result = await service.update(orderFixture().id, {});

      expect(prismaMock.client.order.update).not.toHaveBeenCalled();
      expect(result.orderNumber).toBe('ORD-20261018-ABC123');
    });

    it('validates that a replacement customer exists', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
      });
      prismaMock.client.customer.findUnique.mockResolvedValue(null);

      await expect(
        service.update(orderFixture().id, {
          customerId: '3f1d2c9a-0000-4000-8000-000000000099',
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prismaMock.client.order.update).not.toHaveBeenCalled();
    });

    it('rejects modifications to cancelled orders', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.CANCELLED,
      });

      await expect(
        service.update(orderFixture().id, { internalNote: 'nope' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws not found for a missing order', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(null);

      await expect(
        service.update(orderFixture().id, { internalNote: 'nope' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updateStatus', () => {
    it('confirms a pending order without touching payment state', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });
      txMock.order.update.mockResolvedValue(
        orderWithRelationsFixture({ status: OrderStatus.CONFIRMED }),
      );

      const result = await service.updateStatus(orderFixture().id, {
        status: OrderStatus.CONFIRMED,
      });

      expect(txMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderFixture().id, status: OrderStatus.PENDING },
          data: { status: OrderStatus.CONFIRMED },
        }),
      );
      expect(
        (txMock.order.update.mock.calls[0] as [{ data: object }])[0].data,
      ).not.toHaveProperty('paymentStatus');
      expect(result.status).toBe(OrderStatus.CONFIRMED);
    });

    it('rejects invalid status transitions', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.DELIVERED,
        stockDeducted: true,
      });

      await expect(
        service.updateStatus(orderFixture().id, {
          status: OrderStatus.PROCESSING,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(txMock.order.update).not.toHaveBeenCalled();
    });

    it('does not allow a cancelled order to become active again', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.CANCELLED,
        stockDeducted: false,
      });

      await expect(
        service.updateStatus(orderFixture().id, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('restores stock exactly once when cancelling', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });
      txMock.order.update.mockResolvedValue(
        orderWithRelationsFixture({
          status: OrderStatus.CANCELLED,
          cancelledAt: NOW,
        }),
      );
      txMock.order.updateMany.mockResolvedValue({ count: 1 });
      txMock.orderItem.findMany.mockResolvedValue([
        { productId: productFixture().id, quantity: 2 },
      ]);

      await service.updateStatus(orderFixture().id, {
        status: OrderStatus.CANCELLED,
        cancellationReason: 'Customer changed their mind',
      });

      expect(txMock.order.updateMany).toHaveBeenCalledWith({
        where: { id: orderFixture().id, stockDeducted: true },
        data: { stockDeducted: false },
      });
      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: productFixture().id },
        data: { stockQuantity: { increment: 2 } },
      });
      expect(txMock.order.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            status: OrderStatus.CANCELLED,
            cancellationReason: 'Customer changed their mind',
          }),
        }),
      );
    });

    it('does not restore stock when it was never deducted', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: false,
      });
      txMock.order.update.mockResolvedValue(
        orderWithRelationsFixture({ status: OrderStatus.CANCELLED }),
      );

      await service.updateStatus(orderFixture().id, {
        status: OrderStatus.CANCELLED,
      });

      expect(txMock.order.updateMany).not.toHaveBeenCalled();
      expect(txMock.product.update).not.toHaveBeenCalled();
    });

    it('rejects a cancellation reason on a non-cancellation transition', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });

      await expect(
        service.updateStatus(orderFixture().id, {
          status: OrderStatus.CONFIRMED,
          cancellationReason: 'why not',
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('maps a lost concurrent update to a conflict', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });
      txMock.order.update.mockRejectedValue(recordNotFound());

      await expect(
        service.updateStatus(orderFixture().id, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('throws not found for a missing order', async () => {
      txMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updateStatus(orderFixture().id, {
          status: OrderStatus.CONFIRMED,
        }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('remove', () => {
    it('deletes a pending order after restoring stock', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });
      txMock.orderPayment.count.mockResolvedValue(0);
      txMock.order.updateMany.mockResolvedValue({ count: 1 });
      txMock.orderItem.findMany.mockResolvedValue([
        { productId: productFixture().id, quantity: 2 },
      ]);

      await expect(service.remove(orderFixture().id)).resolves.toBeUndefined();

      expect(txMock.product.update).toHaveBeenCalledWith({
        where: { id: productFixture().id },
        data: { stockQuantity: { increment: 2 } },
      });
      expect(txMock.orderPayment.deleteMany).toHaveBeenCalledWith({
        where: { orderId: orderFixture().id },
      });
      expect(txMock.orderItem.deleteMany).toHaveBeenCalledWith({
        where: { orderId: orderFixture().id },
      });
      expect(txMock.order.delete).toHaveBeenCalledWith({
        where: { id: orderFixture().id },
      });
    });

    it('deletes a cancelled order without restoring stock again', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.CANCELLED,
        stockDeducted: false,
      });
      txMock.orderPayment.count.mockResolvedValue(0);

      await service.remove(orderFixture().id);

      expect(txMock.order.updateMany).not.toHaveBeenCalled();
      expect(txMock.product.update).not.toHaveBeenCalled();
      expect(txMock.order.delete).toHaveBeenCalled();
    });

    it('rejects deletion of orders beyond the cancellable stage', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.SHIPPED,
        stockDeducted: true,
      });

      await expect(service.remove(orderFixture().id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(txMock.order.delete).not.toHaveBeenCalled();
    });

    it('rejects deletion when payment records exist', async () => {
      txMock.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
        status: OrderStatus.PENDING,
        stockDeducted: true,
      });
      txMock.orderPayment.count.mockResolvedValue(1);

      await expect(service.remove(orderFixture().id)).rejects.toBeInstanceOf(
        ConflictException,
      );
      expect(txMock.order.delete).not.toHaveBeenCalled();
    });

    it('throws not found for a missing order', async () => {
      txMock.order.findUnique.mockResolvedValue(null);

      await expect(service.remove(orderFixture().id)).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe('createPayment', () => {
    const paymentDto: CreateOrderPaymentDto = {
      amount: 200,
      method: PaymentMethod.CASH,
    };

    beforeEach(() => {
      txMock.order.findUnique.mockResolvedValue(orderFixture());
      txMock.order.update.mockResolvedValue(orderFixture());
      txMock.orderPayment.create.mockResolvedValue(orderPaymentFixture());
      txMock.orderPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('200.00') },
      });
    });

    it('records a completed payment and recalculates payment status', async () => {
      const result = await service.createPayment(orderFixture().id, paymentDto);

      expect(txMock.orderPayment.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          orderId: orderFixture().id,
          amount: new Prisma.Decimal(200),
          method: PaymentMethod.CASH,
          status: OrderPaymentStatus.COMPLETED,
          paidAt: expect.any(Date) as Date,
        }),
      });
      expect(txMock.order.update).toHaveBeenLastCalledWith({
        where: { id: orderFixture().id },
        data: {
          amountPaid: new Prisma.Decimal('200.00'),
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        },
      });
      expect(result.amount).toBe('200');
      expect(result.status).toBe(OrderPaymentStatus.COMPLETED);
    });

    it('marks an order fully paid when payments reach the total', async () => {
      txMock.order.update.mockResolvedValue(
        orderFixture({ amountPaid: new Prisma.Decimal('300.00') }),
      );
      txMock.orderPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('500.00') },
      });

      await service.createPayment(orderFixture().id, {
        ...paymentDto,
        amount: 200,
      });

      expect(txMock.order.update).toHaveBeenLastCalledWith({
        where: { id: orderFixture().id },
        data: {
          amountPaid: new Prisma.Decimal('500.00'),
          paymentStatus: PaymentStatus.PAID,
        },
      });
    });

    it('rejects a zero or negative amount', async () => {
      await expect(
        service.createPayment(orderFixture().id, { ...paymentDto, amount: 0 }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prismaMock.client.$transaction).not.toHaveBeenCalled();
    });

    it('rejects payments exceeding the outstanding balance', async () => {
      txMock.order.update.mockResolvedValue(
        orderFixture({ amountPaid: new Prisma.Decimal('400.00') }),
      );

      await expect(
        service.createPayment(orderFixture().id, { ...paymentDto, amount: 200 }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(txMock.orderPayment.create).not.toHaveBeenCalled();
    });

    it('rejects payments on a cancelled order', async () => {
      txMock.order.update.mockResolvedValue(
        orderFixture({ status: OrderStatus.CANCELLED }),
      );

      await expect(
        service.createPayment(orderFixture().id, paymentDto),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('rejects a duplicate reference within the order', async () => {
      txMock.orderPayment.findUnique.mockResolvedValue({
        id: 'existing-payment',
      });

      await expect(
        service.createPayment(orderFixture().id, {
          ...paymentDto,
          reference: 'TRX-123',
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(txMock.orderPayment.create).not.toHaveBeenCalled();
    });

    it('does not set paidAt for a pending payment attempt', async () => {
      txMock.orderPayment.create.mockResolvedValue(
        orderPaymentFixture({
          status: OrderPaymentStatus.PENDING,
          paidAt: null,
        }),
      );
      txMock.orderPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal(0) },
      });

      const result = await service.createPayment(orderFixture().id, {
        ...paymentDto,
        status: OrderPaymentStatus.PENDING,
      });

      expect(txMock.orderPayment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ paidAt: null }),
        }),
      );
      expect(result.status).toBe(OrderPaymentStatus.PENDING);
    });

    it('throws not found for a missing order', async () => {
      txMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.createPayment(orderFixture().id, paymentDto),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('listPayments', () => {
    it('lists payments for an order', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue({
        id: orderFixture().id,
      });
      prismaMock.client.orderPayment.findMany.mockResolvedValue([
        orderPaymentFixture(),
      ]);

      const result = await service.listPayments(orderFixture().id);

      expect(result).toEqual([
        expect.objectContaining({
          id: orderPaymentFixture().id,
          amount: '200',
          method: PaymentMethod.CASH,
          status: OrderPaymentStatus.COMPLETED,
        }),
      ]);
    });

    it('throws not found for a missing order', async () => {
      prismaMock.client.order.findUnique.mockResolvedValue(null);

      await expect(
        service.listPayments(orderFixture().id),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updatePaymentStatus', () => {
    beforeEach(() => {
      txMock.order.findUnique.mockResolvedValue(orderFixture());
      txMock.order.update.mockResolvedValue(orderFixture());
      txMock.orderPayment.findFirst.mockResolvedValue(
        orderPaymentFixture({ status: OrderPaymentStatus.PENDING, paidAt: null }),
      );
      txMock.orderPayment.update.mockResolvedValue(
        orderPaymentFixture({ status: OrderPaymentStatus.COMPLETED }),
      );
      txMock.orderPayment.aggregate.mockResolvedValue({
        _sum: { amount: new Prisma.Decimal('200.00') },
      });
    });

    it('marks a pending payment completed and recalculates totals', async () => {
      const result = await service.updatePaymentStatus(
        orderFixture().id,
        orderPaymentFixture().id,
        { status: OrderPaymentStatus.COMPLETED },
      );

      expect(txMock.orderPayment.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: orderPaymentFixture().id },
          data: expect.objectContaining({
            status: OrderPaymentStatus.COMPLETED,
            paidAt: expect.any(Date) as Date,
          }),
        }),
      );
      expect(txMock.order.update).toHaveBeenLastCalledWith({
        where: { id: orderFixture().id },
        data: {
          amountPaid: new Prisma.Decimal('200.00'),
          paymentStatus: PaymentStatus.PARTIALLY_PAID,
        },
      });
      expect(result.status).toBe(OrderPaymentStatus.COMPLETED);
    });

    it('recalculates totals when a completed payment becomes failed', async () => {
      txMock.orderPayment.findFirst.mockResolvedValue(
        orderPaymentFixture({ status: OrderPaymentStatus.COMPLETED }),
      );
      txMock.orderPayment.update.mockResolvedValue(
        orderPaymentFixture({ status: OrderPaymentStatus.FAILED }),
      );
      txMock.orderPayment.aggregate.mockResolvedValue({
        _sum: { amount: null },
      });

      await service.updatePaymentStatus(
        orderFixture().id,
        orderPaymentFixture().id,
        { status: OrderPaymentStatus.FAILED },
      );

      expect(txMock.order.update).toHaveBeenLastCalledWith({
        where: { id: orderFixture().id },
        data: {
          amountPaid: new Prisma.Decimal(0),
          paymentStatus: PaymentStatus.UNPAID,
        },
      });
    });

    it('rejects an invalid payment status transition', async () => {
      txMock.orderPayment.findFirst.mockResolvedValue(
        orderPaymentFixture({ status: OrderPaymentStatus.COMPLETED }),
      );

      await expect(
        service.updatePaymentStatus(
          orderFixture().id,
          orderPaymentFixture().id,
          { status: OrderPaymentStatus.PENDING },
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(txMock.orderPayment.update).not.toHaveBeenCalled();
    });

    it('throws not found for a missing payment', async () => {
      txMock.orderPayment.findFirst.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus(
          orderFixture().id,
          orderPaymentFixture().id,
          { status: OrderPaymentStatus.COMPLETED },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });

    it('throws not found for a missing order', async () => {
      txMock.order.findUnique.mockResolvedValue(null);

      await expect(
        service.updatePaymentStatus(
          orderFixture().id,
          orderPaymentFixture().id,
          { status: OrderPaymentStatus.COMPLETED },
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });
});
