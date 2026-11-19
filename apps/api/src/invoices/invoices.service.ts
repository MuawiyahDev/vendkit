import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  OrderEventType,
  OrderStatus,
  Prisma,
  type User,
} from '@repo/database';
import { ORDER_DETAIL_INCLUDE } from '../orders/orders.constants.js';
import { OrderEventsService } from '../orders/order-events.service.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { InvoiceNumberingService } from '../settings/invoice-numbering.service.js';
import { SettingsService } from '../settings/settings.service.js';
import { CreateInvoiceDto } from './dto/create-invoice.dto.js';
import { CancelInvoiceDto } from './dto/cancel-invoice.dto.js';
import { QueryInvoicesDto } from './dto/query-invoices.dto.js';
import {
  INVOICE_DEFAULT_PAGE_SIZE,
  INVOICE_DETAIL_INCLUDE,
  INVOICE_LIST_INCLUDE,
} from './invoices.constants.js';
import {
  toInvoiceDetailResponse,
  toInvoiceResponse,
} from './invoices.mapper.js';
import type {
  InvoiceDetailResponse,
  InvoiceListResponse,
  InvoiceSnapshot,
} from './invoices.types.js';
import {
  buildInvoiceSearchWhere,
  buildInvoiceSnapshot,
  calculateInvoiceDueDate,
  isUniqueConstraintViolation,
  normalizeInvoiceNumber,
  resolveInvoiceStatusAfterCreate,
} from './invoices.utils.js';

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
    private readonly numbering: InvoiceNumberingService,
    private readonly events: OrderEventsService,
  ) {}

  async createForOrder(
    orderId: string,
    dto: CreateInvoiceDto,
    actor: User | null = null,
  ): Promise<InvoiceDetailResponse> {
    const [invoiceSettings, taxSettings] = await Promise.all([
      this.settings.getInvoiceSettings(),
      this.settings.getTaxSettings(),
    ]);

    try {
      return await this.prisma.client.$transaction(async (tx) => {
        const order = await tx.order.findUnique({
          where: { id: orderId },
          include: ORDER_DETAIL_INCLUDE,
        });

        if (!order) {
          throw new NotFoundException('Order not found');
        }

        if (order.status === OrderStatus.CANCELLED) {
          throw new ConflictException(
            'Invoices cannot be created for a cancelled order',
          );
        }

        const existing = await tx.invoice.findUnique({
          where: { orderId },
          include: INVOICE_DETAIL_INCLUDE,
        });

        if (existing) {
          throw new ConflictException(
            `This order already has invoice ${existing.invoiceNumber}`,
          );
        }

        const issuedAt = new Date();
        const assignment = await this.resolveInvoiceNumber(
          dto,
          invoiceSettings.automaticNumbering,
          tx,
        );

        const snapshot = buildInvoiceSnapshot({
          business: invoiceSettings.effectiveBusinessInformation,
          settings: invoiceSettings,
          tax: taxSettings,
          customerNote: order.customerNote,
          capturedAt: issuedAt,
        });

        const invoice = await tx.invoice.create({
          data: {
            invoiceNumber: assignment.number,
            orderId,
            status: resolveInvoiceStatusAfterCreate(
              invoiceSettings.defaultStatus,
            ),
            issueDate: issuedAt,
            dueDate: calculateInvoiceDueDate(
              issuedAt,
              invoiceSettings.duePeriodDays,
            ),
            sequenceYear: assignment.year,
            sequenceValue: assignment.sequence,
            currency: order.currency,
            subtotal: order.subtotal,
            discountAmount: order.discountAmount,
            shippingFee: order.shippingFee,
            taxAmount: order.taxAmount,
            totalAmount: order.totalAmount,
            snapshot: toJsonSnapshot(snapshot),
            createdByName: resolveActorName(actor),
          },
          include: INVOICE_DETAIL_INCLUDE,
        });

        await this.events.record(tx, {
          orderId,
          type: OrderEventType.INVOICE_CREATED,
          message: `Invoice ${invoice.invoiceNumber} created`,
          metadata: {
            invoiceId: invoice.id,
            invoiceNumber: invoice.invoiceNumber,
            status: invoice.status,
          },
          actor,
        });

        return toInvoiceDetailResponse(invoice);
      });
    } catch (error) {
      if (isUniqueConstraintViolation(error)) {
        const existing = await this.prisma.client.invoice.findUnique({
          where: { orderId },
          select: { invoiceNumber: true },
        });

        if (existing) {
          throw new ConflictException(
            `This order already has invoice ${existing.invoiceNumber}`,
          );
        }

        throw new ConflictException(
          'That invoice number is already in use. Choose another number.',
        );
      }
      throw error;
    }
  }

  async findAll(query: QueryInvoicesDto): Promise<InvoiceListResponse> {
    const page = query.page ?? 1;
    const limit = query.limit ?? INVOICE_DEFAULT_PAGE_SIZE;
    const where: Prisma.InvoiceWhereInput = {
      ...(query.status ? { status: query.status } : {}),
      ...(query.search ? buildInvoiceSearchWhere(query.search) : {}),
    };

    const [total, rows] = await this.prisma.client.$transaction([
      this.prisma.client.invoice.count({ where }),
      this.prisma.client.invoice.findMany({
        where,
        include: INVOICE_LIST_INCLUDE,
        orderBy: { createdAt: query.sortOrder ?? 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ]);

    return {
      data: rows.map((row) => toInvoiceResponse(row)),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.max(1, Math.ceil(total / limit)),
      },
    };
  }

  async findOne(id: string): Promise<InvoiceDetailResponse> {
    const invoice = await this.prisma.client.invoice.findUnique({
      where: { id },
      include: INVOICE_DETAIL_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException('Invoice not found');
    }

    return toInvoiceDetailResponse(invoice);
  }

  async findByOrder(orderId: string): Promise<InvoiceDetailResponse> {
    const invoice = await this.prisma.client.invoice.findUnique({
      where: { orderId },
      include: INVOICE_DETAIL_INCLUDE,
    });

    if (!invoice) {
      throw new NotFoundException('This order has no invoice yet');
    }

    return toInvoiceDetailResponse(invoice);
  }

  async issue(
    id: string,
    actor: User | null = null,
  ): Promise<InvoiceDetailResponse> {
    const [invoiceSettings, taxSettings] = await Promise.all([
      this.settings.getInvoiceSettings(),
      this.settings.getTaxSettings(),
    ]);

    return this.prisma.client.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: INVOICE_DETAIL_INCLUDE,
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        throw new ConflictException('A cancelled invoice cannot be issued');
      }

      if (invoice.order.status === OrderStatus.CANCELLED) {
        throw new ConflictException(
          'Invoices cannot be issued for a cancelled order',
        );
      }

      if (invoice.status === 'ISSUED') {
        return toInvoiceDetailResponse(invoice);
      }

      const issuedAt = new Date();
      const snapshot = buildInvoiceSnapshot({
        business: invoiceSettings.effectiveBusinessInformation,
        settings: invoiceSettings,
        tax: taxSettings,
        customerNote: invoice.order.customerNote,
        capturedAt: issuedAt,
      });

      const issued = await tx.invoice.update({
        where: { id },
        data: {
          status: 'ISSUED',
          issueDate: issuedAt,
          dueDate: calculateInvoiceDueDate(
            issuedAt,
            invoiceSettings.duePeriodDays,
          ),
          subtotal: invoice.order.subtotal,
          discountAmount: invoice.order.discountAmount,
          shippingFee: invoice.order.shippingFee,
          taxAmount: invoice.order.taxAmount,
          totalAmount: invoice.order.totalAmount,
          currency: invoice.order.currency,
          snapshot: toJsonSnapshot(snapshot),
          createdByName: invoice.createdByName ?? resolveActorName(actor),
        },
        include: INVOICE_DETAIL_INCLUDE,
      });

      await this.events.record(tx, {
        orderId: issued.orderId,
        type: OrderEventType.INVOICE_ISSUED,
        message: `Invoice ${issued.invoiceNumber} issued`,
        metadata: {
          invoiceId: issued.id,
          invoiceNumber: issued.invoiceNumber,
        },
        actor,
      });

      return toInvoiceDetailResponse(issued);
    });
  }

  async cancel(
    id: string,
    dto: CancelInvoiceDto,
    actor: User | null = null,
  ): Promise<InvoiceDetailResponse> {
    const settings = await this.settings.getInvoiceSettings();

    if (!settings.allowCancellation) {
      throw new ConflictException(
        'Invoice cancellation is disabled in settings',
      );
    }

    return this.prisma.client.$transaction(async (tx) => {
      const invoice = await tx.invoice.findUnique({
        where: { id },
        include: INVOICE_DETAIL_INCLUDE,
      });

      if (!invoice) {
        throw new NotFoundException('Invoice not found');
      }

      if (invoice.status === 'CANCELLED') {
        return toInvoiceDetailResponse(invoice);
      }

      const cancelled = await tx.invoice.update({
        where: { id },
        data: {
          status: 'CANCELLED',
          cancelledAt: new Date(),
          cancellationReason: dto.cancellationReason?.trim() || null,
        },
        include: INVOICE_DETAIL_INCLUDE,
      });

      await this.events.record(tx, {
        orderId: cancelled.orderId,
        type: OrderEventType.INVOICE_CANCELLED,
        message: `Invoice ${cancelled.invoiceNumber} cancelled`,
        metadata: {
          invoiceId: cancelled.id,
          invoiceNumber: cancelled.invoiceNumber,
          reason: dto.cancellationReason?.trim() || null,
        },
        actor,
      });

      return toInvoiceDetailResponse(cancelled);
    });
  }

  private async resolveInvoiceNumber(
    dto: CreateInvoiceDto,
    automaticNumbering: boolean,
    tx: Prisma.TransactionClient,
  ): Promise<{ number: string; sequence: number; year: number | null }> {
    if (automaticNumbering) {
      return this.numbering.claimNext(tx);
    }

    if (!dto.invoiceNumber) {
      throw new BadRequestException(
        'Automatic numbering is disabled. Enter an invoice number.',
      );
    }

    return {
      number: normalizeInvoiceNumber(dto.invoiceNumber),
      sequence: 0,
      year: null,
    };
  }
}

function toJsonSnapshot(snapshot: InvoiceSnapshot): Prisma.InputJsonValue {
  return snapshot as unknown as Prisma.InputJsonValue;
}

function resolveActorName(actor: User | null): string | null {
  if (!actor) {
    return null;
  }
  return actor.name?.trim() || actor.email;
}
