import { OrderStatus } from '@repo/database';

/** Date ranges offered by the dashboard filter. */
export const DASHBOARD_PRESETS = [
  'today',
  'yesterday',
  'last-7-days',
  'last-30-days',
  'this-month',
  'last-month',
  'custom',
] as const;

export type DashboardPreset = (typeof DASHBOARD_PRESETS)[number];

export const DEFAULT_DASHBOARD_PRESET: DashboardPreset = 'last-7-days';

/** Bucket sizes used by the revenue/order time series. */
export const DASHBOARD_GRANULARITIES = [
  'hour',
  'day',
  'week',
  'month',
] as const;

export type DashboardGranularity = (typeof DASHBOARD_GRANULARITIES)[number];

export const DASHBOARD_BUCKET_FORMAT: Record<DashboardGranularity, string> = {
  hour: 'YYYY-MM-DD"T"HH24:00',
  day: 'YYYY-MM-DD',
  week: 'YYYY-MM-DD',
  month: 'YYYY-MM',
};

/** Calendar-safe upper bound for a custom dashboard range. */
export const MAX_CUSTOM_RANGE_DAYS = 366;

export const DASHBOARD_LIMITS = {
  recentOrders: 6,
  bestSellingProducts: 5,
  inventoryAlerts: 6,
} as const;

/** Display order for the order-status overview. */
export const DASHBOARD_ORDER_STATUSES = [
  OrderStatus.PENDING,
  OrderStatus.CONFIRMED,
  OrderStatus.PROCESSING,
  OrderStatus.SHIPPED,
  OrderStatus.DELIVERED,
  OrderStatus.CANCELLED,
] as const;

export const IMAGE_API_ROUTE = '/api/images';
