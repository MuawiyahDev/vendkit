import {
  CurrencyDisplayFormat,
  CurrencyPosition,
  InvoiceDefaultStatus,
  OrderPaymentStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  StockMovementReason,
  StockMovementType,
  TaxPricingMode,
} from '@repo/database';
import {
  BACKUP_TABLE_NAMES,
  type BackupTableName,
} from './backups.constants.js';
import type { BackupData, ExtractedMediaFile } from './backups.types.js';
import {
  BackupValidationError,
  isPlainObject,
  toDictionary,
} from './backups.utils.js';

type FieldKind =
  'string' | 'int' | 'bool' | 'decimal' | 'date' | 'enum' | 'enumArray';

interface FieldRule {
  kind: FieldKind;
  optional?: boolean;
  enumValues?: readonly string[];
}

interface BackupDataLimits {
  maxRecords: number;
}

const SINGLETON_TABLES = new Set<BackupTableName>([
  'businessProfileSettings',
  'invoiceSettings',
  'regionalSettings',
  'taxSettings',
  'orderSettings',
  'paymentSettings',
  'shippingSettings',
  'notificationSettings',
]);

const str: FieldRule = { kind: 'string' };
const strOptional: FieldRule = { kind: 'string', optional: true };
const int: FieldRule = { kind: 'int' };
const intOptional: FieldRule = { kind: 'int', optional: true };
const bool: FieldRule = { kind: 'bool' };
const boolOptional: FieldRule = { kind: 'bool', optional: true };
const decimal: FieldRule = { kind: 'decimal' };
const decimalOptional: FieldRule = { kind: 'decimal', optional: true };
const date: FieldRule = { kind: 'date' };
const dateOptional: FieldRule = { kind: 'date', optional: true };

function enumRule(values: readonly string[], optional = false): FieldRule {
  return { kind: 'enum', optional, enumValues: values };
}

function enumArrayRule(values: readonly string[]): FieldRule {
  return { kind: 'enumArray', enumValues: values };
}

const MAX_STRING_LENGTH = 2_000_000;
const MAX_DECIMAL_LENGTH = 32;
const DATE_MIN = Date.UTC(1900, 0, 1);
const DATE_MAX = Date.UTC(2200, 0, 1);

const TABLE_FIELDS: Record<BackupTableName, Record<string, FieldRule>> = {
  categories: {
    id: str,
    name: str,
    slug: str,
    isActive: bool,
    createdAt: date,
    updatedAt: date,
  },
  brands: {
    id: str,
    name: str,
    slug: str,
    isActive: bool,
    createdAt: date,
    updatedAt: date,
  },
  images: {
    id: str,
    originalName: str,
    storageKey: str,
    mimeType: str,
    size: int,
    width: intOptional,
    height: intOptional,
    altText: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  products: {
    id: str,
    name: str,
    slug: str,
    description: strOptional,
    shortDescription: strOptional,
    sku: strOptional,
    categoryId: str,
    brandId: strOptional,
    unit: strOptional,
    sellingPrice: decimal,
    compareAtPrice: decimalOptional,
    stockQuantity: int,
    lowStockThreshold: intOptional,
    trackInventory: boolOptional,
    weight: decimalOptional,
    length: decimalOptional,
    width: decimalOptional,
    height: decimalOptional,
    isActive: bool,
    createdAt: date,
    updatedAt: date,
  },
  productImages: {
    id: str,
    productId: str,
    imageId: str,
    sortOrder: int,
    isPrimary: bool,
    createdAt: date,
    updatedAt: date,
  },
  customers: {
    id: str,
    name: str,
    phone: str,
    email: strOptional,
    address: strOptional,
    city: strOptional,
    postalCode: strOptional,
    notes: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  orders: {
    id: str,
    orderNumber: str,
    customerId: strOptional,
    status: enumRule(Object.values(OrderStatus)),
    paymentStatus: enumRule(Object.values(PaymentStatus)),
    currency: str,
    subtotal: decimal,
    discountAmount: decimal,
    shippingFee: decimal,
    taxAmount: decimal,
    totalAmount: decimal,
    amountPaid: decimal,
    stockDeducted: bool,
    shippingName: strOptional,
    shippingPhone: strOptional,
    shippingAddress: strOptional,
    shippingCity: strOptional,
    shippingPostalCode: strOptional,
    customerNote: strOptional,
    internalNote: strOptional,
    cancellationReason: strOptional,
    cancelledAt: dateOptional,
    createdAt: date,
    updatedAt: date,
  },
  orderItems: {
    id: str,
    orderId: str,
    productId: str,
    productName: str,
    sku: strOptional,
    unitPrice: decimal,
    quantity: int,
    lineTotal: decimal,
    trackedInventory: boolOptional,
    createdAt: date,
  },
  stockMovements: {
    id: str,
    productId: strOptional,
    productName: str,
    sku: strOptional,
    type: enumRule(Object.values(StockMovementType)),
    reason: enumRule(Object.values(StockMovementReason)),
    previousQuantity: int,
    quantityChange: int,
    newQuantity: int,
    note: strOptional,
    orderId: strOptional,
    orderNumber: strOptional,
    userId: strOptional,
    userName: strOptional,
    idempotencyKey: strOptional,
    createdAt: date,
  },
  orderPayments: {
    id: str,
    orderId: str,
    amount: decimal,
    method: enumRule(Object.values(PaymentMethod)),
    status: enumRule(Object.values(OrderPaymentStatus)),
    reference: strOptional,
    note: strOptional,
    paidAt: dateOptional,
    createdAt: date,
    updatedAt: date,
  },
  businessProfileSettings: {
    id: str,
    businessName: str,
    legalName: strOptional,
    logoImageId: strOptional,
    email: strOptional,
    phone: strOptional,
    alternativePhone: strOptional,
    website: strOptional,
    description: strOptional,
    registrationNumber: strOptional,
    taxIdentificationNumber: strOptional,
    addressLine1: strOptional,
    addressLine2: strOptional,
    city: strOptional,
    state: strOptional,
    postalCode: strOptional,
    country: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  invoiceSettings: {
    id: str,
    useBusinessProfile: bool,
    displayName: strOptional,
    logoImageId: strOptional,
    email: strOptional,
    phone: strOptional,
    addressLine1: strOptional,
    addressLine2: strOptional,
    city: strOptional,
    state: strOptional,
    postalCode: strOptional,
    country: strOptional,
    taxRegistrationNumber: strOptional,
    additionalInfo: strOptional,
    numberPrefix: str,
    numberFormat: str,
    yearBasedNumbering: bool,
    automaticNumbering: bool,
    startingSequence: int,
    duePeriodDays: int,
    paymentTerms: strOptional,
    notes: strOptional,
    footerText: strOptional,
    currencyDisplayFormat: enumRule(Object.values(CurrencyDisplayFormat)),
    showSku: bool,
    showTaxBreakdown: bool,
    showDiscountBreakdown: bool,
    defaultStatus: enumRule(Object.values(InvoiceDefaultStatus)),
    allowEditingAfterIssue: bool,
    allowCancellation: bool,
    createdAt: date,
    updatedAt: date,
  },
  regionalSettings: {
    id: str,
    currency: str,
    currencySymbol: str,
    currencyPosition: enumRule(Object.values(CurrencyPosition)),
    decimalPrecision: int,
    thousandSeparator: str,
    decimalSeparator: str,
    defaultCountry: str,
    timezone: str,
    dateFormat: str,
    timeFormat: str,
    language: str,
    createdAt: date,
    updatedAt: date,
  },
  taxSettings: {
    id: str,
    enabled: bool,
    defaultName: str,
    defaultRate: decimal,
    taxIdentificationNumber: strOptional,
    pricingMode: enumRule(Object.values(TaxPricingMode)),
    showBreakdownOnInvoice: bool,
    createdAt: date,
    updatedAt: date,
  },
  orderSettings: {
    id: str,
    orderNumberPrefix: str,
    automaticNumbering: bool,
    defaultStatus: enumRule(Object.values(OrderStatus)),
    defaultNotes: strOptional,
    allowEditing: bool,
    requireCustomerInformation: bool,
    createdAt: date,
    updatedAt: date,
  },
  paymentSettings: {
    id: str,
    enabledMethods: enumArrayRule(Object.values(PaymentMethod)),
    defaultMethod: enumRule(Object.values(PaymentMethod)),
    bankAccountName: strOptional,
    bankName: strOptional,
    accountNumber: strOptional,
    branchName: strOptional,
    routingNumber: strOptional,
    paymentInstructions: strOptional,
    defaultPaymentTerms: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  shippingSettings: {
    id: str,
    enabled: bool,
    defaultCharge: decimal,
    freeShippingThreshold: decimalOptional,
    deliveryInstructions: strOptional,
    defaultDeliveryMethod: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  notificationSettings: {
    id: str,
    businessNotificationEmail: strOptional,
    orderConfirmationEnabled: bool,
    paymentEnabled: bool,
    invoiceEnabled: bool,
    senderName: str,
    replyToEmail: strOptional,
    createdAt: date,
    updatedAt: date,
  },
  documentSequences: {
    id: str,
    key: str,
    year: int,
    nextValue: int,
    createdAt: date,
    updatedAt: date,
  },
};

export function validateBackupData(
  raw: unknown,
  limits: BackupDataLimits,
): BackupData {
  const root = toDictionary(raw);
  const tablesValue = root.tables;

  if (!isPlainObject(tablesValue)) {
    throw new BackupValidationError(
      'Backup data does not contain a valid table collection',
    );
  }

  const allowedTables = new Set<string>(BACKUP_TABLE_NAMES);
  for (const key of Object.keys(tablesValue)) {
    if (!allowedTables.has(key)) {
      throw new BackupValidationError(
        `Backup contains an unsupported table: ${key}`,
      );
    }
  }

  const tables = {} as BackupData['tables'];
  let totalRecords = 0;

  for (const table of BACKUP_TABLE_NAMES) {
    const recordsValue = tablesValue[table];

    // Backups created before inventory management existed do not contain
    // this table. Treat them as having an empty audit trail.
    if (recordsValue === undefined && table === 'stockMovements') {
      tables[table] = [];
      continue;
    }

    if (!Array.isArray(recordsValue)) {
      throw new BackupValidationError(
        `Backup table "${table}" is missing or invalid`,
      );
    }

    totalRecords += recordsValue.length;
    if (totalRecords > limits.maxRecords) {
      throw new BackupValidationError(
        'Backup contains more records than this installation allows',
      );
    }

    const seenIds = new Set<string>();
    const records: Array<Record<string, unknown>> = [];

    for (const recordValue of recordsValue) {
      if (!isPlainObject(recordValue)) {
        throw new BackupValidationError(
          `Backup table "${table}" contains a malformed record`,
        );
      }

      const record = validateRecord(table, recordValue);

      // Columns added with inventory management are absent from older
      // backups; preserve their database defaults instead of writing null.
      if (table === 'products' && record.trackInventory === null) {
        record.trackInventory = true;
      }
      if (table === 'orderItems' && record.trackedInventory === null) {
        record.trackedInventory = true;
      }

      const id = record.id as string;

      if (seenIds.has(id)) {
        throw new BackupValidationError(
          `Backup table "${table}" contains duplicate record identifiers`,
        );
      }
      seenIds.add(id);

      if (SINGLETON_TABLES.has(table) && id !== 'default') {
        throw new BackupValidationError(
          `Backup table "${table}" contains an invalid settings identifier`,
        );
      }

      records.push(record);
    }

    tables[table] = records;
  }

  return { tables };
}

export function validateBackupRelations(
  data: BackupData,
  media: ExtractedMediaFile[],
): void {
  const imageIds = new Set(data.tables.images.map((row) => row.id as string));
  const categoryIds = new Set(
    data.tables.categories.map((row) => row.id as string),
  );
  const brandIds = new Set(data.tables.brands.map((row) => row.id as string));
  const productIds = new Set(
    data.tables.products.map((row) => row.id as string),
  );
  const customerIds = new Set(
    data.tables.customers.map((row) => row.id as string),
  );
  const orderIds = new Set(data.tables.orders.map((row) => row.id as string));
  const mediaByKey = new Map(media.map((file) => [file.storageKey, file]));

  for (const product of data.tables.products) {
    assertReference(categoryIds, product.categoryId, 'category');
    if (product.brandId !== null) {
      assertReference(brandIds, product.brandId, 'brand');
    }
  }

  for (const link of data.tables.productImages) {
    assertReference(productIds, link.productId, 'product');
    assertReference(imageIds, link.imageId, 'image');
  }

  for (const order of data.tables.orders) {
    if (order.customerId !== null) {
      assertReference(customerIds, order.customerId, 'customer');
    }
  }

  for (const item of data.tables.orderItems) {
    assertReference(orderIds, item.orderId, 'order');
    assertReference(productIds, item.productId, 'product');
  }

  for (const payment of data.tables.orderPayments) {
    assertReference(orderIds, payment.orderId, 'order');
  }

  for (const movement of data.tables.stockMovements) {
    if (movement.productId !== null) {
      assertReference(productIds, movement.productId, 'product');
    }
    if (movement.orderId !== null) {
      assertReference(orderIds, movement.orderId, 'order');
    }
  }

  for (const image of data.tables.images) {
    const storageKey = image.storageKey as string;
    const file = mediaByKey.get(storageKey);

    if (!file) {
      throw new BackupValidationError(
        'Backup is missing a media file referenced by the database',
      );
    }
    if (file.size !== image.size) {
      throw new BackupValidationError(
        'A media file size does not match its database record',
      );
    }
    mediaByKey.delete(storageKey);
  }

  if (mediaByKey.size > 0) {
    throw new BackupValidationError(
      'Backup contains media files that are not referenced by the database',
    );
  }

  for (const imageIdField of [
    data.tables.businessProfileSettings[0]?.logoImageId,
    data.tables.invoiceSettings[0]?.logoImageId,
  ]) {
    if (imageIdField !== undefined && imageIdField !== null) {
      assertReference(imageIds, imageIdField, 'logo image');
    }
  }
}

function assertReference(
  ids: ReadonlySet<string>,
  value: unknown,
  label: string,
): void {
  if (typeof value !== 'string' || !ids.has(value)) {
    throw new BackupValidationError(
      `Backup contains a record with a missing ${label} reference`,
    );
  }
}

function validateRecord(
  table: BackupTableName,
  record: Record<string, unknown>,
): Record<string, unknown> {
  const fields = TABLE_FIELDS[table];
  const result: Record<string, unknown> = {};

  for (const key of Object.keys(record)) {
    if (!(key in fields)) {
      throw new BackupValidationError(
        `Backup table "${table}" contains an unknown field: ${key}`,
      );
    }
  }

  for (const [key, rule] of Object.entries(fields)) {
    const value = record[key];

    if (value === undefined || value === null) {
      if (!rule.optional) {
        throw new BackupValidationError(
          `Backup table "${table}" is missing the "${key}" field`,
        );
      }
      result[key] = null;
      continue;
    }

    result[key] = validateField(table, key, rule, value);
  }

  return result;
}

function validateField(
  table: BackupTableName,
  key: string,
  rule: FieldRule,
  value: unknown,
): unknown {
  switch (rule.kind) {
    case 'string':
      if (typeof value !== 'string' || value.length > MAX_STRING_LENGTH) {
        throw invalidField(table, key);
      }
      return value;

    case 'int':
      if (!Number.isInteger(value) || !isInt32(value as number)) {
        throw invalidField(table, key);
      }
      return value;

    case 'bool':
      if (typeof value !== 'boolean') {
        throw invalidField(table, key);
      }
      return value;

    case 'decimal':
      return validateDecimal(table, key, value);

    case 'date':
      return validateDate(table, key, value);

    case 'enum':
      if (typeof value !== 'string' || !rule.enumValues?.includes(value)) {
        throw invalidField(table, key);
      }
      return value;

    case 'enumArray':
      if (
        !Array.isArray(value) ||
        value.some(
          (item) =>
            typeof item !== 'string' || !rule.enumValues?.includes(item),
        )
      ) {
        throw invalidField(table, key);
      }
      return [...value];

    default: {
      const exhaustive: never = rule.kind;
      throw new Error(`Unsupported backup field kind: ${exhaustive}`);
    }
  }
}

function validateDecimal(
  table: BackupTableName,
  key: string,
  value: unknown,
): string {
  const decimalValue =
    typeof value === 'string'
      ? value
      : typeof value === 'number' && Number.isFinite(value)
        ? String(value)
        : null;

  if (
    decimalValue === null ||
    decimalValue.length > MAX_DECIMAL_LENGTH ||
    !/^-?\d+(\.\d+)?$/.test(decimalValue)
  ) {
    throw invalidField(table, key);
  }

  return decimalValue;
}

function validateDate(
  table: BackupTableName,
  key: string,
  value: unknown,
): string {
  if (typeof value !== 'string') {
    throw invalidField(table, key);
  }

  const timestamp = Date.parse(value);
  if (
    !Number.isFinite(timestamp) ||
    timestamp < DATE_MIN ||
    timestamp > DATE_MAX
  ) {
    throw invalidField(table, key);
  }

  return new Date(timestamp).toISOString();
}

function invalidField(
  table: BackupTableName,
  key: string,
): BackupValidationError {
  return new BackupValidationError(
    `Backup table "${table}" contains an invalid "${key}" value`,
  );
}

function isInt32(value: number): boolean {
  return value >= -2_147_483_648 && value <= 2_147_483_647;
}
