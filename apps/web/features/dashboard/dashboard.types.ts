import type {
  OrderStatus,
  PaymentStatus,
} from "@/features/orders/api/orders-api";

/** Date ranges offered by the dashboard filter. */
export const DASHBOARD_PRESETS = [
  "today",
  "yesterday",
  "last-7-days",
  "last-30-days",
  "this-month",
  "last-month",
  "custom",
] as const;

export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export type DashboardGranularity = "hour" | "day" | "week" | "month";

export type CurrencyPosition = "BEFORE" | "AFTER";

export interface DashboardRegionalSettings {
  currency: string;
  currencySymbol: string;
  currencyPosition: CurrencyPosition;
  decimalPrecision: number;
  thousandSeparator: string;
  decimalSeparator: string;
  timezone: string;
  dateFormat: string;
  timeFormat: string;
}

export interface DashboardRange {
  preset: DashboardPreset;
  from: string;
  to: string;
  previousFrom: string;
  previousTo: string;
  granularity: DashboardGranularity;
}

export interface DashboardMetricChange<TValue> {
  current: TValue;
  previous: TValue;
  changePercent: number | null;
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
  range: DashboardRange;
  regional: DashboardRegionalSettings;
  summary: DashboardSummary;
  series: DashboardSeriesPoint[];
  statusCounts: DashboardStatusCount[];
  recentOrders: DashboardRecentOrder[];
  bestSellingProducts: DashboardBestSellingProduct[];
  inventoryAlerts: DashboardInventoryAlert[];
  setup: DashboardSetup;
}

/** Selection state owned by the date filter. */
export type DashboardRangeSelection =
  | { preset: Exclude<DashboardPreset, "custom"> }
  | { preset: "custom"; from: string; to: string };
