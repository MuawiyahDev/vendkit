import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/database';
import request from 'supertest';
import { App } from 'supertest/types';
import { InvoiceNumberingService } from '../src/settings/invoice-numbering.service.js';
import { SettingsCategory } from '../src/settings/settings.constants.js';
import { SettingsService } from '../src/settings/settings.service.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';

const TEST_API_KEY = 'e2e-test-api-key';

describe('Settings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let settingsService: SettingsService;
  let invoiceNumbering: InvoiceNumberingService;

  let regularToken: string;
  let adminToken: string;
  let userId: string;
  let regularUserId: string;

  const uniqueSuffix = Date.now().toString();
  const email = `settings-e2e-${uniqueSuffix}@example.com`;
  const regularEmail = `settings-regular-${uniqueSuffix}@example.com`;
  const password = 'strong-password-123';
  const namePrefix = `E2E Settings ${uniqueSuffix}`;

  let categoryId: string;
  let customerId: string;
  const productIds: string[] = [];
  const orderIds: string[] = [];

  function auth(token = adminToken) {
    return { Authorization: `Bearer ${token}` };
  }

  function get(path: string, token = adminToken) {
    return request(app.getHttpServer())
      .get(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth(token));
  }

  function patch(path: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .patch(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send(body);
  }

  function post(path: string, body: Record<string, unknown>) {
    return request(app.getHttpServer())
      .post(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .send(body);
  }

  async function resetAllSettings() {
    for (const category of Object.values(SettingsCategory)) {
      await settingsService.resetCategory(category);
    }
    await prisma.client.documentSequence.deleteMany({
      where: { key: 'INVOICE' },
    });
  }

  async function createProduct(sellingPrice: number): Promise<string> {
    const product = await post('/products', {
      name: `${namePrefix} Product ${productIds.length}`,
      categoryId,
      sellingPrice,
      stockQuantity: 100,
    }).expect(201);

    productIds.push(product.body.id);
    return product.body.id;
  }

  async function createOrder(
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    const order = await post('/orders', { customerId, ...body }).expect(201);
    orderIds.push(order.body.id);
    return order.body;
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret';
    process.env.API_KEY = TEST_API_KEY;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);
    settingsService = app.get(SettingsService);
    invoiceNumbering = app.get(InvoiceNumberingService);

    const adminRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(201);

    userId = adminRegistration.body.user.id;

    const regularRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-api-key', TEST_API_KEY)
      .send({ email: regularEmail, password })
      .expect(201);

    regularToken = regularRegistration.body.accessToken;
    regularUserId = regularRegistration.body.user.id;

    await prisma.client.user.update({
      where: { id: userId },
      data: { role: Role.ADMIN },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(200);

    adminToken = login.body.accessToken;

    await resetAllSettings();

    const category = await post('/categories', {
      name: `${namePrefix} Category`,
    }).expect(201);
    categoryId = category.body.id;

    const customer = await post('/customers', {
      name: `${namePrefix} Customer`,
      phone: '01712345678',
    }).expect(201);
    customerId = customer.body.id;
  });

  afterAll(async () => {
    await prisma.client.orderPayment.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.orderItem.deleteMany({
      where: { orderId: { in: orderIds } },
    });
    await prisma.client.order.deleteMany({ where: { id: { in: orderIds } } });
    await prisma.client.product.deleteMany({
      where: { id: { in: productIds } },
    });
    await prisma.client.category.deleteMany({ where: { id: categoryId } });
    await prisma.client.customer.deleteMany({ where: { id: customerId } });

    await resetAllSettings();
    await prisma.client.refreshToken.deleteMany({
      where: { userId: { in: [userId, regularUserId] } },
    });
    await prisma.client.user.deleteMany({
      where: { id: { in: [userId, regularUserId] } },
    });

    await app.close();
  });

  describe('authentication and authorization', () => {
    it('rejects requests without an API key', async () => {
      await request(app.getHttpServer()).get('/settings').expect(401);
    });

    it('rejects requests without a JWT', async () => {
      await request(app.getHttpServer())
        .get('/settings')
        .set('x-api-key', TEST_API_KEY)
        .expect(401);
    });

    it('allows regular users to read settings', async () => {
      await get('/settings', regularToken).expect(200);
    });

    it('forbids regular users from updating settings', async () => {
      await request(app.getHttpServer())
        .patch('/settings/business-profile')
        .set('x-api-key', TEST_API_KEY)
        .set(auth(regularToken))
        .send({ businessName: 'Nope' })
        .expect(403);
    });
  });

  describe('GET /settings', () => {
    it('returns every category with defaults', async () => {
      const res = await get('/settings').expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          businessProfile: expect.objectContaining({ businessName: 'VendKit' }),
          invoice: expect.objectContaining({
            numberPrefix: 'INV',
            numberFormat: '{prefix}-{year}-{sequence}',
            startingSequence: 1,
            defaultStatus: 'DRAFT',
            effectiveBusinessInformation: expect.objectContaining({
              displayName: 'VendKit',
            }),
          }),
          regional: expect.objectContaining({
            currency: 'BDT',
            defaultCountry: 'BD',
            timezone: 'Asia/Dhaka',
            decimalPrecision: 2,
          }),
          tax: expect.objectContaining({ enabled: false, defaultRate: '0' }),
          order: expect.objectContaining({
            orderNumberPrefix: 'ORD',
            automaticNumbering: true,
            defaultStatus: 'PENDING',
          }),
          payment: expect.objectContaining({
            defaultMethod: 'CASH',
            cashEnabled: true,
            bankTransferEnabled: true,
          }),
          shipping: expect.objectContaining({ enabled: true, defaultCharge: '0' }),
          notification: expect.objectContaining({
            senderName: 'VendKit',
            orderConfirmationEnabled: false,
          }),
        }),
      );
    });

    it('returns one category', async () => {
      const res = await get('/settings/invoice').expect(200);
      expect(res.body.numberPrefix).toBe('INV');
    });

    it('rejects an unknown category', async () => {
      await get('/settings/not-a-category').expect(400);
    });
  });

  describe('PATCH /settings/business-profile', () => {
    it('updates and persists the business profile', async () => {
      const res = await patch('/settings/business-profile', {
        businessName: `${namePrefix} Store`,
        legalName: `${namePrefix} Store Ltd`,
        email: 'billing@example.com',
        phone: '+8801712345678',
        website: 'https://example.com',
        description: 'A small social-commerce business.',
        registrationNumber: 'REG-123',
        taxIdentificationNumber: 'TAX-456',
        addressLine1: 'House 12, Road 5',
        addressLine2: 'Level 2',
        city: 'Dhaka',
        state: 'Dhaka',
        postalCode: '1207',
        country: 'Bangladesh',
      }).expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          businessName: `${namePrefix} Store`,
          email: 'billing@example.com',
          website: 'https://example.com',
          city: 'Dhaka',
        }),
      );

      const all = await get('/settings').expect(200);
      expect(all.body.businessProfile.businessName).toBe(
        `${namePrefix} Store`,
      );
    });

    it('normalizes empty optional strings to null', async () => {
      const res = await patch('/settings/business-profile', {
        legalName: '   ',
        addressLine2: '',
      }).expect(200);

      expect(res.body.legalName).toBeNull();
      expect(res.body.addressLine2).toBeNull();
    });

    it('rejects an invalid email and URL', async () => {
      await patch('/settings/business-profile', { email: 'not-an-email' }).expect(
        400,
      );
      await patch('/settings/business-profile', { website: 'not a url' }).expect(
        400,
      );
    });

    it('rejects a missing logo image', async () => {
      await patch('/settings/business-profile', {
        logoImageId: '00000000-0000-4000-8000-000000000000',
      }).expect(404);
    });
  });

  describe('invoice settings and fallback', () => {
    it('falls back to business profile values per field', async () => {
      await patch('/settings/invoice', {
        useBusinessProfile: true,
        displayName: null,
        addressLine1: 'Invoice Street 1',
        city: null,
        email: null,
        taxRegistrationNumber: null,
      }).expect(200);

      const res = await get('/settings/invoice').expect(200);

      expect(res.body.effectiveBusinessInformation).toEqual(
        expect.objectContaining({
          displayName: `${namePrefix} Store`,
          addressLine1: 'Invoice Street 1',
          city: 'Dhaka',
          email: 'billing@example.com',
          taxRegistrationNumber: 'TAX-456',
        }),
      );
    });

    it('uses only invoice values when business profile fallback is disabled', async () => {
      await patch('/settings/invoice', {
        useBusinessProfile: false,
        email: 'invoices@example.com',
        city: null,
      }).expect(200);

      const res = await get('/settings/invoice').expect(200);

      expect(res.body.effectiveBusinessInformation.email).toBe(
        'invoices@example.com',
      );
      expect(res.body.effectiveBusinessInformation.city).toBeNull();
      expect(res.body.effectiveBusinessInformation.taxRegistrationNumber).toBeNull();
    });

    it('updates invoice defaults and behavior', async () => {
      const res = await patch('/settings/invoice', {
        useBusinessProfile: true,
        numberPrefix: 'BILL',
        numberFormat: '{prefix}-{year}{month}-{sequence}',
        yearBasedNumbering: true,
        automaticNumbering: true,
        startingSequence: 5,
        duePeriodDays: 15,
        paymentTerms: 'Net 15',
        notes: 'Thanks for your order.',
        footerText: 'VendKit',
        currencyDisplayFormat: 'SYMBOL_AND_CODE',
        showSku: false,
        showTaxBreakdown: false,
        showDiscountBreakdown: false,
        defaultStatus: 'ISSUED',
        allowEditingAfterIssue: true,
        allowCancellation: false,
      }).expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          numberPrefix: 'BILL',
          startingSequence: 5,
          duePeriodDays: 15,
          defaultStatus: 'ISSUED',
          showSku: false,
          allowCancellation: false,
        }),
      );
    });

    it('rejects invalid numbering formats and incompatible options', async () => {
      await patch('/settings/invoice', {
        numberFormat: '{prefix}-{year}',
      }).expect(400);

      await patch('/settings/invoice', {
        numberFormat: '{prefix}-{bad}-{sequence}',
      }).expect(400);

      await patch('/settings/invoice', {
        numberFormat: '{prefix}-{year}-{sequence}',
        yearBasedNumbering: false,
      }).expect(400);
    });

    it('allocates unique invoice numbers and prevents rewinding the sequence', async () => {
      await patch('/settings/invoice', {
        numberPrefix: 'INV',
        numberFormat: '{prefix}-{year}-{sequence}',
        yearBasedNumbering: true,
        automaticNumbering: true,
        startingSequence: 5,
      }).expect(200);

      const preview = await invoiceNumbering.previewNext();
      expect(preview.sequence).toBe(5);

      const first = await invoiceNumbering.claimNext();
      const second = await invoiceNumbering.claimNext();

      expect(first.number).toMatch(/^INV-\d{4}-5$/);
      expect(second.number).toMatch(/^INV-\d{4}-6$/);
      expect(second.number).not.toBe(first.number);

      await patch('/settings/invoice', { startingSequence: 3 }).expect(409);
      await patch('/settings/invoice', { startingSequence: 10 }).expect(200);

      const third = await invoiceNumbering.claimNext();
      expect(third.sequence).toBe(10);
    });

    it('resets invoice settings but keeps allocated sequences safe', async () => {
      const res = await post('/settings/invoice/reset', {}).expect(200);

      expect(res.body.numberPrefix).toBe('INV');
      expect(res.body.startingSequence).toBe(1);

      const assignment = await invoiceNumbering.claimNext();
      expect(assignment.sequence).toBeGreaterThanOrEqual(10);
    });
  });

  describe('regional, tax and notification settings', () => {
    it('updates regional settings', async () => {
      const res = await patch('/settings/regional', {
        currency: 'usd',
        currencySymbol: '$',
        currencyPosition: 'BEFORE',
        decimalPrecision: 2,
        thousandSeparator: ',',
        decimalSeparator: '.',
        defaultCountry: 'us',
        timezone: 'America/New_York',
        dateFormat: 'MM/DD/YYYY',
        timeFormat: 'hh:mm A',
        language: 'en-US',
      }).expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          currency: 'USD',
          defaultCountry: 'US',
          timezone: 'America/New_York',
        }),
      );
    });

    it('rejects invalid currency, timezone, locale and separators', async () => {
      await patch('/settings/regional', { currency: 'US' }).expect(400);
      await patch('/settings/regional', { timezone: 'Mars/Olympus' }).expect(400);
      await patch('/settings/regional', { language: 'not a locale' }).expect(400);
      await patch('/settings/regional', {
        thousandSeparator: '.',
        decimalSeparator: '.',
      }).expect(400);
    });

    it('updates tax settings and rejects an impossible rate', async () => {
      const res = await patch('/settings/tax', {
        enabled: true,
        defaultName: 'GST',
        defaultRate: 15.5,
        taxIdentificationNumber: 'TAX-999',
        pricingMode: 'INCLUSIVE',
        showBreakdownOnInvoice: false,
      }).expect(200);

      expect(res.body.defaultRate).toBe('15.5');
      expect(res.body.pricingMode).toBe('INCLUSIVE');

      await patch('/settings/tax', { defaultRate: 101 }).expect(400);
      await patch('/settings/tax', { defaultRate: -1 }).expect(400);
    });

    it('updates notification settings and validates emails', async () => {
      const res = await patch('/settings/notification', {
        businessNotificationEmail: 'orders@example.com',
        orderConfirmationEnabled: true,
        paymentEnabled: true,
        invoiceEnabled: true,
        senderName: 'VendKit Orders',
        replyToEmail: 'support@example.com',
      }).expect(200);

      expect(res.body).toEqual(
        expect.objectContaining({
          orderConfirmationEnabled: true,
          senderName: 'VendKit Orders',
        }),
      );

      await patch('/settings/notification', {
        businessNotificationEmail: 'bad',
      }).expect(400);
    });
  });

  describe('payment settings', () => {
    it('rejects a default method outside the enabled list', async () => {
      await patch('/settings/payment', {
        enabledMethods: ['CASH'],
        defaultMethod: 'BANK_TRANSFER',
      }).expect(400);
    });

    it('updates methods and bank details', async () => {
      const res = await patch('/settings/payment', {
        enabledMethods: ['BANK_TRANSFER', 'MOBILE_FINANCIAL_SERVICE'],
        defaultMethod: 'BANK_TRANSFER',
        bankAccountName: 'VendKit',
        bankName: 'Example Bank',
        accountNumber: '1234567890',
        branchName: 'Main Branch',
        routingNumber: 'ROUTING-1',
        paymentInstructions: 'Send the transaction reference.',
        defaultPaymentTerms: 'Payment before dispatch',
      }).expect(200);

      expect(res.body.cashEnabled).toBe(false);
      expect(res.body.bankTransferEnabled).toBe(true);
      expect(res.body.defaultMethod).toBe('BANK_TRANSFER');
    });

    it('enforces enabled methods when recording an order payment', async () => {
      await patch('/settings/payment', {
        enabledMethods: ['CASH'],
        defaultMethod: 'CASH',
      }).expect(200);

      const productId = await createProduct(100);
      const order = await createOrder({
        items: [{ productId, quantity: 1 }],
      });

      await post(`/orders/${order.id}/payments`, {
        amount: 10,
        method: 'BANK_TRANSFER',
      }).expect(400);

      await post(`/orders/${order.id}/payments`, {
        amount: 10,
        method: 'CASH',
      }).expect(201);
    });
  });

  describe('shipping settings', () => {
    it('applies the default charge and free shipping threshold', async () => {
      await patch('/settings/shipping', {
        enabled: true,
        defaultCharge: 50,
        freeShippingThreshold: 500,
        deliveryInstructions: 'Call before delivery.',
        defaultDeliveryMethod: 'STANDARD',
      }).expect(200);

      const productId = await createProduct(250);

      const belowThreshold = await createOrder({
        items: [{ productId, quantity: 1 }],
      });
      expect(belowThreshold.shippingFee).toBe('50');
      expect(belowThreshold.totalAmount).toBe('300');

      const atThreshold = await createOrder({
        items: [{ productId, quantity: 2 }],
      });
      expect(atThreshold.shippingFee).toBe('0');
      expect(atThreshold.totalAmount).toBe('500');

      const explicit = await createOrder({
        items: [{ productId, quantity: 1 }],
        shippingFee: 12,
      });
      expect(explicit.shippingFee).toBe('12');
    });
  });

  describe('order settings', () => {
    it('applies prefix, default status and default notes', async () => {
      await patch('/settings/order', {
        orderNumberPrefix: 'SALE',
        automaticNumbering: true,
        defaultStatus: 'CONFIRMED',
        defaultNotes: 'Prepared by the store.',
        allowEditing: true,
        requireCustomerInformation: false,
      }).expect(200);

      const productId = await createProduct(75);
      const order = await createOrder({
        items: [{ productId, quantity: 1 }],
      });

      expect(order.orderNumber).toMatch(/^SALE-\d{8}-[A-Z2-9]{6}$/);
      expect(order.status).toBe('CONFIRMED');
      expect(order.customerNote).toBe('Prepared by the store.');

      await patch('/settings/order', { allowEditing: false }).expect(200);

      await request(app.getHttpServer())
        .patch(`/orders/${order.id}`)
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .send({ internalNote: 'Should fail' })
        .expect(409);
    });

    it('supports manual numbering when automatic numbering is disabled', async () => {
      await patch('/settings/order', {
        automaticNumbering: false,
        allowEditing: true,
        requireCustomerInformation: false,
      }).expect(200);

      const productId = await createProduct(50);

      await post('/orders', {
        customerId,
        items: [{ productId, quantity: 1 }],
      }).expect(400);

      const manualNumber = `MANUAL-${uniqueSuffix}-1001`;
      const manual = await createOrder({
        orderNumber: manualNumber.toLowerCase(),
        items: [{ productId, quantity: 1 }],
      });

      expect(manual.orderNumber).toBe(manualNumber);

      const second = await post('/orders', {
        customerId,
        orderNumber: `MANUAL-${uniqueSuffix}-1002`,
        items: [{ productId, quantity: 1 }],
      }).expect(201);

      orderIds.push(second.body.id);
    });

    it('can require saved customer information', async () => {
      await patch('/settings/order', {
        automaticNumbering: true,
        defaultStatus: 'PENDING',
        allowEditing: true,
        requireCustomerInformation: true,
      }).expect(200);

      const productId = await createProduct(60);

      await post('/orders', {
        guestName: 'Walk-in Buyer',
        items: [{ productId, quantity: 1 }],
      }).expect(400);
    });
  });

  describe('reset and persistence', () => {
    it('resets a category to defaults', async () => {
      await patch('/settings/business-profile', {
        businessName: 'Temporary Name',
      }).expect(200);

      const res = await post('/settings/business-profile/reset', {}).expect(200);
      expect(res.body.businessName).toBe('VendKit');
    });

    it('persists settings across an application restart', async () => {
      await patch('/settings/business-profile', {
        businessName: `${namePrefix} Persisted`,
      }).expect(200);

      const secondModule: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      const secondApp = secondModule.createNestApplication();
      secondApp.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
      );
      await secondApp.init();

      const res = await request(secondApp.getHttpServer())
        .get('/settings/business-profile')
        .set('x-api-key', TEST_API_KEY)
        .set(auth())
        .expect(200);

      expect(res.body.businessName).toBe(`${namePrefix} Persisted`);

      await secondApp.close();
    });
  });
});
