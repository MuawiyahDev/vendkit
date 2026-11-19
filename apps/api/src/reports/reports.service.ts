import { BadRequestException, Injectable } from '@nestjs/common';
import { OrderStatus, Prisma } from '@repo/database';
import { DASHBOARD_ORDER_STATUSES } from '../dashboard/dashboard.constants.js';
import type {
  DashboardRegionalSettings,
  LocalDateParts,
} from '../dashboard/dashboard.types.js';
import {
  addLocalDays,
  compareLocalDates,
  daysBetweenInclusive,
  formatLocalDate,
  getPeriodInstants,
  getTodayInTimeZone,
  parseLocalDate,
} from '../dashboard/dashboard.utils.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { SettingsService } from '../settings/settings.service.js';
import type { QueryReportsDto } from './dto/query-reports.dto.js';
import type {
  ReportsResponse,
  ReportsSeriesPoint,
  ReportsSourceBreakdown,
  ReportsStatusBreakdown,
  ReportsTopCustomer,
  ReportsTopProduct,
} from './reports.types.js';

export const MAX_REPORT_RANGE_DAYS = 366;
const TOP_PRODUCTS_LIMIT = 8;
const TOP_CUSTOMERS_LIMIT = 5;

interface SeriesRow {
  date: string;
  revenue: string;
  orders: number;
}

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  async getReport(query: QueryReportsDto): Promise<ReportsResponse> {
    const regionalSettings = await this.settings.getRegionalSettings();
    const regional: DashboardRegionalSettings = {
      currency: regionalSettings.currency,
      currencySymbol: regionalSettings.currencySymbol,
      currencyPosition: regionalSettings.currencyPosition,
      decimalPrecision: regionalSettings.decimalPrecision,
      thousandSeparator: regionalSettings.thousandSeparator,
      decimalSeparator: regionalSettings.decimalSeparator,
      timezone: regionalSettings.timezone,
      dateFormat: regionalSettings.dateFormat,
      timeFormat: regionalSettings.timeFormat,
    };

    const today = getTodayInTimeZone(new Date(), regional.timezone);
    const to = query.to ? parseLocalDate(query.to) : today;
    const from = query.from ? parseLocalDate(query.from) : addLocalDays(to, -29);

    if (compareLocalDates(from, to) > 0) {
      throw new BadRequestException('Report from date must be before to date');
    }

    const days = daysBetweenInclusive(from, to);

    if (days > MAX_REPORT_RANGE_DAYS) {
      throw new BadRequestException(
        `Report ranges cannot exceed ${MAX_REPORT_RANGE_DAYS} days`,
      );
    }

    const period = getPeriodInstants({ from, to }, regional.timezone);
    const rangeWhere: Prisma.OrderWhereInput = {
      createdAt: { gte: period.start, lt: period.end },
    };
    const salesWhere: Prisma.OrderWhereInput = {
      ...rangeWhere,
      status: { not: OrderStatus.CANCELLED },
    };

    const [
      salesTotals,
      orderCount,
      cancelledOrders,
      newCustomers,
      statusGroups,
      sourceGroups,
      topProductGroups,
      topCustomerGroups,
      series,
    ] = await Promise.all([
      this.prisma.client.order.aggregate({
        where: salesWhere,
        _sum: { totalAmount: true, amountPaid: true },
        _count: { _all: true },
      }),
      this.prisma.client.order.count({ where: rangeWhere }),
      this.prisma.client.order.count({
        where: { ...rangeWhere, status: OrderStatus.CANCELLED },
      }),
      this.prisma.client.customer.count({
        where: { createdAt: { gte: period.start, lt: period.end } },
      }),
      this.prisma.client.order.groupBy({
        by: ['status'],
        where: rangeWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.client.order.groupBy({
        by: ['source'],
        where: salesWhere,
        _count: { _all: true },
        _sum: { totalAmount: true },
      }),
      this.prisma.client.orderItem.groupBy({
        by: ['productId'],
        where: { order: salesWhere },
        _sum: { quantity: true, lineTotal: true },
        orderBy: [
          { _sum: { quantity: 'desc' } },
          { _sum: { lineTotal: 'desc' } },
        ],
        take: TOP_PRODUCTS_LIMIT,
      }),
      this.prisma.client.order.groupBy({
        by: ['customerId'],
        where: { ...salesWhere, customerId: { not: null } },
        _count: { _all: true },
        _sum: { totalAmount: true },
        orderBy: [{ _sum: { totalAmount: 'desc' } }],
        take: TOP_CUSTOMERS_LIMIT,
      }),
      this.loadSeries(from, to, period.start, period.end, regional.timezone),
    ]);

    const revenue = salesTotals._sum.totalAmount ?? new Prisma.Decimal(0);
    const paidAmount = salesTotals._sum.amountPaid ?? new Prisma.Decimal(0);
    const salesOrders = salesTotals._count._all;

    const [topProducts, topCustomers] = await Promise.all([
      this.resolveTopProducts(topProductGroups),
      this.resolveTopCustomers(topCustomerGroups),
    ]);

    return {
      generatedAt: new Date().toISOString(),
      range: {
        from: formatLocalDate(from),
        to: formatLocalDate(to),
        days,
      },
      regional,
      totals: {
        revenue: revenue.toString(),
        paidAmount: paidAmount.toString(),
        outstandingAmount: revenue.minus(paidAmount).toString(),
        orders: orderCount,
        salesOrders,
        cancelledOrders,
        averageOrderValue:
          salesOrders > 0
            ? revenue.div(salesOrders).toFixed(2)
            : '0.00',
        newCustomers,
      },
      statuses: this.buildStatusBreakdown(statusGroups),
      sources: this.buildSourceBreakdown(sourceGroups),
      series,
      topProducts,
      topCustomers,
    };
  }

  private async loadSeries(
    from: LocalDateParts,
    to: LocalDateParts,
    start: Date,
    end: Date,
    timeZone: string,
  ): Promise<ReportsSeriesPoint[]> {
    const rows = await this.prisma.client.$queryRaw<SeriesRow[]>`
      SELECT
        to_char(o."createdAt" AT TIME ZONE ${timeZone}, 'YYYY-MM-DD') AS date,
        COALESCE(SUM(o."totalAmount"), 0)::text AS revenue,
        COUNT(o.id)::int AS orders
      FROM "Order" o
      WHERE o."createdAt" >= ${start}
        AND o."createdAt" < ${end}
        AND o.status::text <> 'CANCELLED'
      GROUP BY 1
      ORDER BY 1
    `;

    const rowsByDate = new Map(rows.map((row) => [row.date, row]));
    const series: ReportsSeriesPoint[] = [];
    let date = from;

    while (compareLocalDates(date, to) <= 0) {
      const key = formatLocalDate(date);
      const row = rowsByDate.get(key);
      series.push({
        date: key,
        revenue: row?.revenue ?? '0',
        orders: row ? Number(row.orders) : 0,
      });
      date = addLocalDays(date, 1);
    }

    return series;
  }

  private buildStatusBreakdown(
    groups: {
      status: OrderStatus;
      _count: { _all: number };
      _sum: { totalAmount: Prisma.Decimal | null };
    }[],
  ): ReportsStatusBreakdown[] {
    const byStatus = new Map(
      groups.map((group) => [group.status, group]),
    );

    return DASHBOARD_ORDER_STATUSES.map((status) => {
      const group = byStatus.get(status);
      return {
        status,
        count: group?._count._all ?? 0,
        revenue: (
          group?._sum.totalAmount ?? new Prisma.Decimal(0)
        ).toString(),
      };
    });
  }

  private buildSourceBreakdown(
    groups: {
      source: ReportsSourceBreakdown['source'];
      _count: { _all: number };
      _sum: { totalAmount: Prisma.Decimal | null };
    }[],
  ): ReportsSourceBreakdown[] {
    return groups
      .map((group) => ({
        source: group.source,
        count: group._count._all,
        revenue: (
          group._sum.totalAmount ?? new Prisma.Decimal(0)
        ).toString(),
      }))
      .sort((left, right) => right.count - left.count);
  }

  private async resolveTopProducts(
    groups: {
      productId: string;
      _sum: { quantity: number | null; lineTotal: Prisma.Decimal | null };
    }[],
  ): Promise<ReportsTopProduct[]> {
    if (groups.length === 0) {
      return [];
    }

    const products = await this.prisma.client.product.findMany({
      where: { id: { in: groups.map((group) => group.productId) } },
      select: { id: true, name: true, sku: true },
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
          unitsSold: group._sum.quantity ?? 0,
          revenue: (group._sum.lineTotal ?? new Prisma.Decimal(0)).toString(),
        },
      ];
    });
  }

  private async resolveTopCustomers(
    groups: {
      customerId: string | null;
      _count: { _all: number };
      _sum: { totalAmount: Prisma.Decimal | null };
    }[],
  ): Promise<ReportsTopCustomer[]> {
    const customerIds = groups
      .map((group) => group.customerId)
      .filter((id): id is string => id !== null);

    if (customerIds.length === 0) {
      return [];
    }

    const customers = await this.prisma.client.customer.findMany({
      where: { id: { in: customerIds } },
      select: { id: true, name: true, phone: true },
    });
    const customersById = new Map(
      customers.map((customer) => [customer.id, customer]),
    );

    return groups.flatMap((group) => {
      const customer = group.customerId
        ? customersById.get(group.customerId)
        : null;
      if (!customer) {
        return [];
      }

      return [
        {
          customerId: customer.id,
          name: customer.name,
          phone: customer.phone,
          ordersCount: group._count._all,
          revenue: (
            group._sum.totalAmount ?? new Prisma.Decimal(0)
          ).toString(),
        },
      ];
    });
  }
}
