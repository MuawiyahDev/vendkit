import type { OrderStatus, PaymentStatus } from '@repo/database';
import type {
  DashboardGranularity,
  DashboardPreset,
} from './dashboard.constants.js';

export interface LocalDateParts {
  year: number;
  month: number;
  day: number;
}

export interface ZonedDateTimeParts extends LocalDateParts {
  hour: number;
  minute: number;
  second: number;
}

export interface DatePeriod {
  from: LocalDateParts;
  to: LocalDateParts;
}

export interface ResolvedDashboardRange {
  preset: DashboardPreset;
  current: DatePeriod;
  previous: DatePeriod;
  granularity: DashboardGranularity;
}

export interface PeriodInstants {
  start: Date;
  end: Date;
}

export interface DashboardRegionalSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: 'BEFORE' | 'AFTER';
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export interface DashboardMetricChange<TValue> {
  current: TValue;
  previous: TValue;
  changePercent: number | null;
}

export interface DashboardRangeResponse {
  preset: DashboardPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  granularity: DashboardGranularity;
}

export interface DashboardSummary {
  revenue: DashboardMetricChange<string>;
  orders: DashboardMetricChange<number>;
  averageOrderValue: DashboardMetricChange<string>;
  customers: {
    total: number;
    newInPeriod: number;
  };
  inventory: {
    totalProducts: number;
    lowStock: number;
    outOfStock: number;
  };
}

export interface DashboardSeriesPoint {
  bucket: string;
  revenue: string;
  orders: number;
}

export interface DashboardStatusCount {
  status: OrderStatus;
  count: number;
}

export interface DashboardRecentOrder {
  id: string;
  orderNumber: string;
  customerName: string | null;
  createdAt: string;
  totalAmount: string;
  currency: string;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
}

export interface DashboardBestSellingProduct {
  productId: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  unitsSold: number;
  revenue: string;
}

export interface DashboardInventoryAlert {
  productId: string;
  name: string;
  sku: string | null;
  imageUrl: string | null;
  stockQuantity: number;
  lowStockThreshold: number | null;
}

export interface DashboardSetupStep {
  key: string;
  title: string;
  description: string;
  href: string;
  completed: boolean;
}

export interface DashboardSetup {
  completed: number;
  total: number;
  steps: DashboardSetupStep[];
}

export interface DashboardResponse {
  generatedAt: string;
  range: DashboardRangeResponse;
  regional: DashboardRegionalSettings;
  summary: DashboardSummary;
  series: DashboardSeriesPoint[];
  statusCounts: DashboardStatusCount[];
  recentOrders: DashboardRecentOrder[];
  bestSellingProducts: DashboardBestSellingProduct[];
  inventoryAlerts: DashboardInventoryAlert[];
  setup: DashboardSetup;
}
