import type { OrderSource, OrderStatus } from '@repo/database';
import type { DashboardRegionalSettings } from '../dashboard/dashboard.types.js';

export interface ReportsRange {
  from: string;
  to: string;
  days: number;
}

export interface ReportsTotals {
  revenue: string;
  paidAmount: string;
  outstandingAmount: string;
  orders: number;
  salesOrders: number;
  cancelledOrders: number;
  averageOrderValue: string;
  newCustomers: number;
}

export interface ReportsStatusBreakdown {
  status: OrderStatus;
  count: number;
  revenue: string;
}

export interface ReportsSourceBreakdown {
  source: OrderSource;
  count: number;
  revenue: string;
}

export interface ReportsSeriesPoint {
  date: string;
  revenue: string;
  orders: number;
}

export interface ReportsTopProduct {
  productId: string;
  name: string;
  sku: string | null;
  unitsSold: number;
  revenue: string;
}

export interface ReportsTopCustomer {
  customerId: string;
  name: string;
  phone: string;
  ordersCount: number;
  revenue: string;
}

export interface ReportsResponse {
  generatedAt: string;
  range: ReportsRange;
  regional: DashboardRegionalSettings;
  totals: ReportsTotals;
  statuses: ReportsStatusBreakdown[];
  sources: ReportsSourceBreakdown[];
  series: ReportsSeriesPoint[];
  topProducts: ReportsTopProduct[];
  topCustomers: ReportsTopCustomer[];
}
