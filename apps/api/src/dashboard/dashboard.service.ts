import { Injectable } from '@nestjs/common';
import { OrderStatus, Prisma, type Product } from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import type { RegionalSettingsResponse } from '../settings/settings.types.js';
import { SettingsService } from '../settings/settings.service.js';
import {
  DASHBOARD_BUCKET_FORMAT,
  DASHBOARD_LIMITS,
  DASHBOARD_ORDER_STATUSES,
  IMAGE_API_ROUTE,
  type DashboardGranularity,
} from './dashboard.constants.js';
import type { QueryDashboardDto } from './dto/query-dashboard.dto.js';
import type {
  DashboardBestSellingProduct,
  DashboardInventoryAlert,
  DashboardRangeResponse,
  DashboardRecentOrder,
  DashboardRegionalSettings,
  DashboardResponse,
  DashboardSeriesPoint,
  DashboardSetup,
  DashboardStatusCount,
  DashboardSummary,
  LocalDateParts,
  PeriodInstants,
  ResolvedDashboardRange,
} from './dashboard.types.js';
import {
  calculatePercentageChange,
  formatLocalDate,
  generateBuckets,
  getPeriodInstants,
  resolveDashboardRange,
} from './dashboard.utils.js';

interface SeriesRow {
  bucket: string;
  revenue: string;
  orders: number;
}

interface ProductImageSelection {
  images: { image: { id: string } }[];
}

type InventoryAlertProduct = Pick<
  Product,
  'id' | 'name' | 'sku' | 'stockQuantity' | 'lowStockThreshold'
> &
  ProductImageSelection;

type BestSellingProductRow = Pick<Product, 'id' | 'name' | 'sku'> &
  ProductImageSelection;

const PRODUCT_IMAGE_SELECT = {
  images: {
    select: { image: { select: { id: true } } },
    orderBy: { sortOrder: 'asc' as const },
    take: 1,
  },
} satisfies Prisma.ProductInclude;

@Injectable()
export class DashboardService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getDashboard(query: QueryDashboardDto): Promise<DashboardResponse> {
    const regionalSettings = await this.settings.getRegionalSettings();
    const regional = this.toRegionalSummary(regionalSettings);
    const range = resolveDashboardRange({
      preset: query.preset,
      from: query.from,
      to: query.to,
      timeZone: regional.timezone,
      now: new Date(),
    });

    const current = getPeriodInstants(range.current, regional.timezone);
    const previous = getPeriodInstants(range.previous, regional.timezone);

    const [
      currentTotals,
      previousTotals,
      currentOrderCount,
      previousOrderCount,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
      statusGroups,
      series,
      recentOrders,
      bestSellingProducts,
      inventoryAlerts,
      totalOrders,
      invoiceCount,
      completedBackups,
      userCount,
      businessProfile,
    ] = await Promise.all([
      this.prisma.client.order.aggregate({
        where: this.revenueWhere(current),
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.client.order.aggregate({
        where: this.revenueWhere(previous),
        _sum: { totalAmount: true },
        _count: { _all: true },
      }),
      this.prisma.client.order.count({
        where: { createdAt: { gte: current.start, lt: current.end } },
      }),
      this.prisma.client.order.count({
        where: { createdAt: { gte: previous.start, lt: previous.end } },
      }),
      this.prisma.client.customer.count(),
      this.prisma.client.customer.count({
        where: { createdAt: { gte: current.start, lt: current.end } },
      }),
      this.prisma.client.product.count({ where: { isActive: true } }),
      this.countLowStockProducts(),
      this.prisma.client.product.count({
        where: {
          isActive: true,
          trackInventory: true,
          stockQuantity: { lte: 0 },
        },
      }),
      this.prisma.client.order.groupBy({
        by: ['status'],
        where: { createdAt: { gte: current.start, lt: current.end } },
        _count: { _all: true },
      }),
      this.loadSeries(
        range.current.from,
        range.current.to,
        range.granularity,
        regional.timezone,
        current,
      ),
      this.loadRecentOrders(current),
      this.loadBestSellingProducts(current),
      this.loadInventoryAlerts(),
      this.prisma.client.order.count(),
      this.prisma.client.invoice.count(),
      this.prisma.client.backup.count({ where: { status: 'COMPLETED' } }),
      this.prisma.client.user.count(),
      this.settings.getBusinessProfile(),
    ]);

    const summary = this.buildSummary({
      currentTotals,
      previousTotals,
      currentOrderCount,
      previousOrderCount,
      totalCustomers,
      newCustomers,
      totalProducts,
      lowStockProducts,
      outOfStockProducts,
    });

    return {
      generatedAt: new Date().toISOString(),
      range: this.toRangeResponse(range),
      regional,
      summary,
      series,
      statusCounts: this.toStatusCounts(statusGroups),
      recentOrders,
      bestSellingProducts,
      inventoryAlerts,
      setup: this.buildSetup({
        totalProducts,
        totalCustomers,
        totalOrders,
        invoiceCount,
        completedBackups,
        userCount,
        businessName: businessProfile.businessName,
        businessEmail: businessProfile.email,
        businessPhone: businessProfile.phone,
        businessAddress: businessProfile.addressLine1,
      }),
    };
  }

  private buildSetup(input: {
    totalProducts: number;
    totalCustomers: number;
    totalOrders: number;
    invoiceCount: number;
    completedBackups: number;
    userCount: number;
    businessName: string;
    businessEmail: string | null;
    businessPhone: string | null;
    businessAddress: string | null;
  }): DashboardSetup {
    const businessConfigured =
      (input.businessName.trim().length > 0 &&
        input.businessName.trim() !== 'VendKit') ||
      Boolean(input.businessEmail?.trim()) ||
      Boolean(input.businessPhone?.trim()) ||
      Boolean(input.businessAddress?.trim());

    const steps = [
      {
        key: 'business-profile',
        title: 'Set up your business profile',
        description:
          'Add the name, contact details and address that appear on invoices.',
        href: '/settings/business-profile',
        completed: businessConfigured,
      },
      {
        key: 'first-product',
        title: 'Add your first product',
        description:
          'Products provide the prices and stock that orders are built from.',
        href: '/products/new',
        completed: input.totalProducts > 0,
      },
      {
        key: 'first-customer',
        title: 'Save a customer',
        description:
          'Saved customers make repeat orders faster and keep contact details in one place.',
        href: '/customers',
        completed: input.totalCustomers > 0,
      },
      {
        key: 'first-order',
        title: 'Create your first order',
        description:
          'Record a sale from Facebook, Instagram, WhatsApp or anywhere else.',
        href: '/orders/new',
        completed: input.totalOrders > 0,
      },
      {
        key: 'first-invoice',
        title: 'Issue an invoice',
        description:
          'Give buyers a professional document with a permanent invoice number.',
        href: '/invoices',
        completed: input.invoiceCount > 0,
      },
      {
        key: 'first-backup',
        title: 'Download a backup',
        description:
          'Keep a portable copy of your business data before you need it.',
        href: '/settings/backup',
        completed: input.completedBackups > 0,
      },
      {
        key: 'invite-team',
        title: 'Invite a teammate',
        description:
          'Add someone who helps you pack, deliver or answer customers.',
        href: '/team',
        completed: input.userCount > 1,
      },
    ];

    return {
      completed: steps.filter((step) => step.completed).length,
      total: steps.length,
      steps,
    };
  }

  private toRegionalSummary(
    settings: RegionalSettingsResponse,
  ): DashboardRegionalSettings {
    return {
      currency: settings.currency,
      currencySymbol: settings.currencySymbol,
      currencyPosition: settings.currencyPosition,
      decimalPrecision: settings.decimalPrecision,
      thousandSeparator: settings.thousandSeparator,
      decimalSeparator: settings.decimalSeparator,
      timezone: settings.timezone,
      dateFormat: settings.dateFormat,
      timeFormat: settings.timeFormat,
    };
  }

  private toRangeResponse(
    range: ResolvedDashboardRange,
  ): DashboardRangeResponse {
    return {
      preset: range.preset,
      from: formatLocalDate(range.current.from),
      to: formatLocalDate(range.current.to),
      previousFrom: formatLocalDate(range.previous.from),
      previousTo: formatLocalDate(range.previous.to),
      granularity: range.granularity,
    };
  }

  private revenueWhere(period: PeriodInstants): Prisma.OrderWhereInput {
    return {
      createdAt: { gte: period.start, lt: period.end },
      status: { not: OrderStatus.CANCELLED },
    };
  }

  private async countLowStockProducts(): Promise<number> {
    return this.prisma.client.product.count({
      where: {
        isActive: true,
        trackInventory: true,
        lowStockThreshold: { not: null },
        stockQuantity: {
          gt: 0,
          lte: this.prisma.client.product.fields.lowStockThreshold,
        },
      },
    });
  }

  private buildSummary(input: {
    currentTotals: {
      _sum: { totalAmount: Prisma.Decimal | null };
      _count: { _all: number };
    };
    previousTotals: {
      _sum: { totalAmount: Prisma.Decimal | null };
      _count: { _all: number };
    };
    currentOrderCount: number;
    previousOrderCount: number;
    totalCustomers: number;
    newCustomers: number;
    totalProducts: number;
    lowStockProducts: number;
    outOfStockProducts: number;
  }): DashboardSummary {
    const currentRevenue =
      input.currentTotals._sum.totalAmount ?? new Prisma.Decimal(0);
    const previousRevenue =
      input.previousTotals._sum.totalAmount ?? new Prisma.Decimal(0);
    const currentSalesOrders = input.currentTotals._count._all;
    const previousSalesOrders = input.previousTotals._count._all;

    const currentRevenueValue = currentRevenue.toNumber();
    const previousRevenueValue = previousRevenue.toNumber();
    const currentAverage =
      currentSalesOrders > 0 ? currentRevenueValue / currentSalesOrders : 0;
    const previousAverage =
      previousSalesOrders > 0 ? previousRevenueValue / previousSalesOrders : 0;

    return {
      revenue: {
        current: currentRevenue.toString(),
        previous: previousRevenue.toString(),
        changePercent: calculatePercentageChange(
          currentRevenueValue,
          previousRevenueValue,
        ),
      },
      orders: {
        current: input.currentOrderCount,
        previous: input.previousOrderCount,
        changePercent: calculatePercentageChange(
          input.currentOrderCount,
          input.previousOrderCount,
        ),
      },
      averageOrderValue: {
        current: currentAverage.toFixed(2),
        previous: previousAverage.toFixed(2),
        changePercent:
          previousSalesOrders > 0
            ? calculatePercentageChange(currentAverage, previousAverage)
            : null,
      },
      customers: {
        total: input.totalCustomers,
        newInPeriod: input.newCustomers,
      },
      inventory: {
        totalProducts: input.totalProducts,
        lowStock: input.lowStockProducts,
        outOfStock: input.outOfStockProducts,
      },
    };
  }

  private async loadSeries(
    from: LocalDateParts,
    to: LocalDateParts,
    granularity: DashboardGranularity,
    timeZone: string,
    period: PeriodInstants,
  ): Promise<DashboardSeriesPoint[]> {
    const bucketFormat = DASHBOARD_BUCKET_FORMAT[granularity];

    const rows = await this.prisma.client.$queryRaw<SeriesRow[]>`
      SELECT
        to_char(
          date_trunc(${granularity}::text, o."createdAt" AT TIME ZONE ${timeZone}),
          ${bucketFormat}
        ) AS bucket,
        COALESCE(SUM(o."totalAmount"), 0)::text AS revenue,
        COUNT(o.id)::int AS orders
      FROM "Order" o
      WHERE o."createdAt" >= ${period.start}
        AND o."createdAt" < ${period.end}
        AND o.status::text <> 'CANCELLED'
      GROUP BY 1
      ORDER BY 1
    `;

    const rowsByBucket = new Map(
      rows.map((row) => [
        row.bucket,
        { revenue: row.revenue, orders: Number(row.orders) },
      ]),
    );

    return generateBuckets(from, to, granularity).map((bucket) => {
      const row = rowsByBucket.get(bucket);
      return {
        bucket,
        revenue: row?.revenue ?? '0',
        orders: row?.orders ?? 0,
      };
    });
  }

  private toStatusCounts(
    groups: { status: OrderStatus; _count: { _all: number } }[],
  ): DashboardStatusCount[] {
    const counts = new Map(
      groups.map((group) => [group.status, group._count._all]),
    );

    return DASHBOARD_ORDER_STATUSES.map((status) => ({
      status,
      count: counts.get(status) ?? 0,
    }));
  }

  private async loadRecentOrders(
    period: PeriodInstants,
  ): Promise<DashboardRecentOrder[]> {
    const orders = await this.prisma.client.order.findMany({
      where: { createdAt: { gte: period.start, lt: period.end } },
      orderBy: { createdAt: 'desc' },
      take: DASHBOARD_LIMITS.recentOrders,
      select: {
        id: true,
        orderNumber: true,
        status: true,
        paymentStatus: true,
        totalAmount: true,
        currency: true,
        createdAt: true,
        shippingName: true,
        customer: { select: { name: true } },
      },
    });

    return orders.map((order) => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customerName: order.customer?.name ?? order.shippingName ?? null,
      createdAt: order.createdAt.toISOString(),
      totalAmount: order.totalAmount.toString(),
      currency: order.currency,
      paymentStatus: order.paymentStatus,
      status: order.status,
    }));
  }

  private async loadBestSellingProducts(
    period: PeriodInstants,
  ): Promise<DashboardBestSellingProduct[]> {
    const groups = await this.prisma.client.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          createdAt: { gte: period.start, lt: period.end },
          status: { not: OrderStatus.CANCELLED },
        },
      },
      _sum: { quantity: true, lineTotal: true },
      orderBy: [
        { _sum: { quantity: 'desc' } },
        { _sum: { lineTotal: 'desc' } },
      ],
      take: DASHBOARD_LIMITS.bestSellingProducts,
    });

    if (groups.length === 0) {
      return [];
    }

    const products: BestSellingProductRow[] =
      await this.prisma.client.product.findMany({
        where: { id: { in: groups.map((group) => group.productId) } },
        select: {
          id: true,
          name: true,
          sku: true,
          ...PRODUCT_IMAGE_SELECT,
        },
      });

    const productsById = new Map(
      products.map((product) => [product.id, product]),
    );

    return groups.flatMap((group) => {
      const product = productsById.get(group.productId);
      if (!product) {
        return [];
      }

      return [
        {
          productId: product.id,
          name: product.name,
          sku: product.sku,
          imageUrl: this.toImageUrl(product),
          unitsSold: group._sum.quantity ?? 0,
          revenue: (group._sum.lineTotal ?? new Prisma.Decimal(0)).toString(),
        },
      ];
    });
  }

  private async loadInventoryAlerts(): Promise<DashboardInventoryAlert[]> {
    const products: InventoryAlertProduct[] =
      await this.prisma.client.product.findMany({
        where: {
          isActive: true,
          OR: [
            {
              trackInventory: true,
              stockQuantity: { lte: 0 },
            },
            {
              trackInventory: true,
              lowStockThreshold: { not: null },
              stockQuantity: {
                gt: 0,
                lte: this.prisma.client.product.fields.lowStockThreshold,
              },
            },
          ],
        },
        orderBy: [{ stockQuantity: 'asc' }, { name: 'asc' }],
        take: DASHBOARD_LIMITS.inventoryAlerts,
        select: {
          id: true,
          name: true,
          sku: true,
          stockQuantity: true,
          lowStockThreshold: true,
          ...PRODUCT_IMAGE_SELECT,
        },
      });

    return products.map((product) => ({
      productId: product.id,
      name: product.name,
      sku: product.sku,
      imageUrl: this.toImageUrl(product),
      stockQuantity: product.stockQuantity,
      lowStockThreshold: product.lowStockThreshold,
    }));
  }

  private toImageUrl(product: ProductImageSelection): string | null {
    const imageId = product.images[0]?.image.id;
    return imageId ? `${IMAGE_API_ROUTE}/${imageId}/file` : null;
  }
}
