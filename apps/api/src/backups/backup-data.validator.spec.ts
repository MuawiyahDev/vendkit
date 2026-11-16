import { BACKUP_TABLE_NAMES } from './backups.constants.js';
import type { BackupData, ExtractedMediaFile } from './backups.types.js';
import {
  validateBackupData,
  validateBackupRelations,
} from './backup-data.validator.js';

function emptyTables(): BackupData['tables'] {
  return Object.fromEntries(
    BACKUP_TABLE_NAMES.map((table) => [table, []]),
  ) as unknown as BackupData['tables'];
}

function validImage() {
  return {
    id: '11111111-1111-4111-8111-111111111111',
    originalName: 'logo.png',
    storageKey: '22222222-2222-4222-8222-222222222222.png',
    mimeType: 'image/png',
    size: 4,
    width: 1,
    height: 1,
    altText: null,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function validCategory() {
  return {
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Shirts',
    slug: 'shirts',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  };
}

function mediaFor(data: BackupData['tables']['images'][0]) {
  return {
    storageKey: data!.storageKey as string,
    path: `/staging/media/${data!.storageKey as string}`,
    size: data!.size as number,
    sha256: 'a'.repeat(64),
  } satisfies ExtractedMediaFile;
}

describe('validateBackupData', () => {
  it('accepts an empty but structurally complete dataset', () => {
    const data = validateBackupData(
      { tables: emptyTables() },
      { maxRecords: 100 },
    );
    expect(() => validateBackupRelations(data, [])).not.toThrow();
  });

  it('rejects unknown tables and unknown fields', () => {
    const withTable = { tables: { ...emptyTables(), secrets: [] } };
    expect(() => validateBackupData(withTable, { maxRecords: 100 })).toThrow(
      'unsupported table',
    );

    const tables = emptyTables();
    tables.categories.push({
      ...validCategory(),
      passwordHash: 'not-allowed',
    } as unknown as Record<string, unknown>);

    expect(() => validateBackupData({ tables }, { maxRecords: 100 })).toThrow(
      'unknown field',
    );
  });

  it('rejects duplicate identifiers and invalid singleton ids', () => {
    const tables = emptyTables();
    tables.categories.push(
      validCategory() as unknown as Record<string, unknown>,
      validCategory() as unknown as Record<string, unknown>,
    );

    expect(() => validateBackupData({ tables }, { maxRecords: 100 })).toThrow(
      'duplicate record identifiers',
    );

    const settings = emptyTables();
    settings.regionalSettings.push({
      id: 'not-default',
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
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    expect(() =>
      validateBackupData({ tables: settings }, { maxRecords: 100 }),
    ).toThrow('invalid settings identifier');
  });

  it('rejects invalid enum values and malformed dates', () => {
    const tables = emptyTables();
    tables.orders.push({
      id: '44444444-4444-4444-8444-444444444444',
      orderNumber: 'ORD-1',
      customerId: null,
      status: 'REFUNDED',
      paymentStatus: 'UNPAID',
      currency: 'BDT',
      subtotal: '10.00',
      discountAmount: '0',
      shippingFee: '0',
      taxAmount: '0',
      totalAmount: '10.00',
      amountPaid: '0',
      stockDeducted: false,
      shippingName: null,
      shippingPhone: null,
      shippingAddress: null,
      shippingCity: null,
      shippingPostalCode: null,
      customerNote: null,
      internalNote: null,
      cancellationReason: null,
      cancelledAt: null,
      createdAt: 'not-a-date',
      updatedAt: '2026-01-01T00:00:00.000Z',
    } as unknown as Record<string, unknown>);

    expect(() => validateBackupData({ tables }, { maxRecords: 100 })).toThrow(
      'invalid',
    );
  });

  it('requires every referenced media file and rejects extra files', () => {
    const tables = emptyTables();
    const image = validImage();
    tables.images.push(image as unknown as Record<string, unknown>);

    const data = validateBackupData({ tables }, { maxRecords: 100 });

    expect(() => validateBackupRelations(data, [])).toThrow(
      'missing a media file',
    );

    const extra = {
      storageKey: '55555555-5555-4555-8555-555555555555.png',
      path: '/staging/media/extra.png',
      size: 1,
      sha256: 'a'.repeat(64),
    } satisfies ExtractedMediaFile;

    expect(() =>
      validateBackupRelations(data, [mediaFor(image), extra]),
    ).toThrow('not referenced');
  });

  it('validates cross-table references', () => {
    const tables = emptyTables();
    const image = validImage();
    tables.images.push(image as unknown as Record<string, unknown>);
    tables.products.push({
      id: '66666666-6666-4666-8666-666666666666',
      name: 'Shirt',
      slug: 'shirt',
      description: null,
      shortDescription: null,
      sku: null,
      categoryId: 'missing-category',
      brandId: null,
      unit: null,
      sellingPrice: '10.00',
      compareAtPrice: null,
      stockQuantity: 5,
      lowStockThreshold: null,
      weight: null,
      length: null,
      width: null,
      height: null,
      isActive: true,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    });

    const data = validateBackupData({ tables }, { maxRecords: 100 });
    expect(() => validateBackupRelations(data, [mediaFor(image)])).toThrow(
      'missing category reference',
    );
  });
});
