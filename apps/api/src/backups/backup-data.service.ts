import { Injectable } from '@nestjs/common';
import { Prisma, type Image } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BACKUP_DELETE_ORDER,
  BACKUP_TABLE_NAMES,
  type BackupCounts,
  type BackupTableName,
} from './backups.constants.js';
import type { BackupData } from './backups.types.js';
import { summarizeTableCounts } from './backup-archive.service.js';

const INSERT_BATCH_SIZE = 500;

export interface BackupSnapshot {
  data: BackupData;
  images: Image[];
  counts: BackupCounts;
}

type TransactionClient = Prisma.TransactionClient;

interface TableOperations {
  deleteAll: () => Promise<unknown>;
  insert: (rows: Array<Record<string, unknown>>) => Promise<unknown>;
}

@Injectable()
export class BackupDataService {
  constructor(private readonly prisma: PrismaService) {}

  async createSnapshot(timeoutMs: number): Promise<BackupSnapshot> {
    return this.prisma.client.$transaction(
      async (tx) => {
        const tables = {
          categories: await tx.category.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          brands: await tx.brand.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          images: await tx.image.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          products: await tx.product.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          productImages: await tx.productImage.findMany({
            orderBy: [{ productId: 'asc' }, { sortOrder: 'asc' }],
          }),
          customers: await tx.customer.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          orders: await tx.order.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          orderItems: await tx.orderItem.findMany({
            orderBy: [{ orderId: 'asc' }, { createdAt: 'asc' }],
          }),
          orderPayments: await tx.orderPayment.findMany({
            orderBy: [{ orderId: 'asc' }, { createdAt: 'asc' }],
          }),
          invoices: await tx.invoice.findMany({
            orderBy: [{ issueDate: 'asc' }, { id: 'asc' }],
          }),
          stockMovements: await tx.stockMovement.findMany({
            orderBy: [{ createdAt: 'asc' }, { id: 'asc' }],
          }),
          businessProfileSettings: await tx.businessProfileSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          invoiceSettings: await tx.invoiceSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          regionalSettings: await tx.regionalSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          taxSettings: await tx.taxSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          orderSettings: await tx.orderSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          paymentSettings: await tx.paymentSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          shippingSettings: await tx.shippingSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          notificationSettings: await tx.notificationSettings.findMany({
            orderBy: { id: 'asc' },
          }),
          documentSequences: await tx.documentSequence.findMany({
            orderBy: [{ key: 'asc' }, { year: 'asc' }],
          }),
        };

        const data: BackupData = {
          tables: tables as BackupData['tables'],
        };

        return {
          data,
          images: tables.images,
          counts: summarizeTableCounts(data),
        };
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.RepeatableRead,
        timeout: timeoutMs,
        maxWait: 15_000,
      },
    );
  }

  async restoreSnapshot(
    data: BackupData,
    timeoutMs: number,
    onTableRestored?: (table: BackupTableName, index: number) => Promise<void>,
    onCompleted?: (tx: TransactionClient) => Promise<void>,
  ): Promise<void> {
    await this.prisma.client.$transaction(
      async (tx) => {
        const operations = createTableOperations(tx);

        for (const table of BACKUP_DELETE_ORDER) {
          await operations[table].deleteAll();
        }

        for (const [index, table] of BACKUP_TABLE_NAMES.entries()) {
          const rows = data.tables[table];
          for (
            let offset = 0;
            offset < rows.length;
            offset += INSERT_BATCH_SIZE
          ) {
            await operations[table].insert(
              rows.slice(offset, offset + INSERT_BATCH_SIZE),
            );
          }
          await onTableRestored?.(table, index);
        }

        // Marking the job complete inside the same transaction is the commit
        // marker used by startup recovery: if the process dies, an
        // IN_PROGRESS job proves the database change was rolled back.
        await onCompleted?.(tx);
      },
      {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        timeout: timeoutMs,
        maxWait: 15_000,
      },
    );
  }
}

function createTableOperations(
  tx: TransactionClient,
): Record<BackupTableName, TableOperations> {
  return {
    categories: {
      deleteAll: () => tx.category.deleteMany(),
      insert: (rows) =>
        tx.category.createMany({
          data: rows as unknown as Prisma.CategoryCreateManyInput[],
        }),
    },
    brands: {
      deleteAll: () => tx.brand.deleteMany(),
      insert: (rows) =>
        tx.brand.createMany({
          data: rows as unknown as Prisma.BrandCreateManyInput[],
        }),
    },
    images: {
      deleteAll: () => tx.image.deleteMany(),
      insert: (rows) =>
        tx.image.createMany({
          data: rows as unknown as Prisma.ImageCreateManyInput[],
        }),
    },
    products: {
      deleteAll: () => tx.product.deleteMany(),
      insert: (rows) =>
        tx.product.createMany({
          data: rows as unknown as Prisma.ProductCreateManyInput[],
        }),
    },
    productImages: {
      deleteAll: () => tx.productImage.deleteMany(),
      insert: (rows) =>
        tx.productImage.createMany({
          data: rows as unknown as Prisma.ProductImageCreateManyInput[],
        }),
    },
    customers: {
      deleteAll: () => tx.customer.deleteMany(),
      insert: (rows) =>
        tx.customer.createMany({
          data: rows as unknown as Prisma.CustomerCreateManyInput[],
        }),
    },
    orders: {
      deleteAll: () => tx.order.deleteMany(),
      insert: (rows) =>
        tx.order.createMany({
          data: rows as unknown as Prisma.OrderCreateManyInput[],
        }),
    },
    orderItems: {
      deleteAll: () => tx.orderItem.deleteMany(),
      insert: (rows) =>
        tx.orderItem.createMany({
          data: rows as unknown as Prisma.OrderItemCreateManyInput[],
        }),
    },
    orderPayments: {
      deleteAll: () => tx.orderPayment.deleteMany(),
      insert: (rows) =>
        tx.orderPayment.createMany({
          data: rows as unknown as Prisma.OrderPaymentCreateManyInput[],
        }),
    },
    invoices: {
      deleteAll: () => tx.invoice.deleteMany(),
      insert: (rows) =>
        tx.invoice.createMany({
          data: rows as unknown as Prisma.InvoiceCreateManyInput[],
        }),
    },
    stockMovements: {
      deleteAll: () => tx.stockMovement.deleteMany(),
      insert: (rows) =>
        tx.stockMovement.createMany({
          data: rows as unknown as Prisma.StockMovementCreateManyInput[],
        }),
    },
    businessProfileSettings: {
      deleteAll: () => tx.businessProfileSettings.deleteMany(),
      insert: (rows) =>
        tx.businessProfileSettings.createMany({
          data: rows as unknown as Prisma.BusinessProfileSettingsCreateManyInput[],
        }),
    },
    invoiceSettings: {
      deleteAll: () => tx.invoiceSettings.deleteMany(),
      insert: (rows) =>
        tx.invoiceSettings.createMany({
          data: rows as unknown as Prisma.InvoiceSettingsCreateManyInput[],
        }),
    },
    regionalSettings: {
      deleteAll: () => tx.regionalSettings.deleteMany(),
      insert: (rows) =>
        tx.regionalSettings.createMany({
          data: rows as unknown as Prisma.RegionalSettingsCreateManyInput[],
        }),
    },
    taxSettings: {
      deleteAll: () => tx.taxSettings.deleteMany(),
      insert: (rows) =>
        tx.taxSettings.createMany({
          data: rows as unknown as Prisma.TaxSettingsCreateManyInput[],
        }),
    },
    orderSettings: {
      deleteAll: () => tx.orderSettings.deleteMany(),
      insert: (rows) =>
        tx.orderSettings.createMany({
          data: rows as unknown as Prisma.OrderSettingsCreateManyInput[],
        }),
    },
    paymentSettings: {
      deleteAll: () => tx.paymentSettings.deleteMany(),
      insert: (rows) =>
        tx.paymentSettings.createMany({
          data: rows as unknown as Prisma.PaymentSettingsCreateManyInput[],
        }),
    },
    shippingSettings: {
      deleteAll: () => tx.shippingSettings.deleteMany(),
      insert: (rows) =>
        tx.shippingSettings.createMany({
          data: rows as unknown as Prisma.ShippingSettingsCreateManyInput[],
        }),
    },
    notificationSettings: {
      deleteAll: () => tx.notificationSettings.deleteMany(),
      insert: (rows) =>
        tx.notificationSettings.createMany({
          data: rows as unknown as Prisma.NotificationSettingsCreateManyInput[],
        }),
    },
    documentSequences: {
      deleteAll: () => tx.documentSequence.deleteMany(),
      insert: (rows) =>
        tx.documentSequence.createMany({
          data: rows as unknown as Prisma.DocumentSequenceCreateManyInput[],
        }),
    },
  };
}
