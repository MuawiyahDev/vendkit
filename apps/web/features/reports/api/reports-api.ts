import type { DashboardRegionalSettings } from "@/features/dashboard/dashboard.types";
import type { OrderSource, OrderStatus } from "@/features/orders/api/orders-api";
import { apiFetch } from "@/lib/api/client";

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

export interface ReportsQuery {
  from?: string;
  to?: string;
}

export async function getReports(
  query: ReportsQuery = {},
  { signal }: { signal?: AbortSignal } = {},
): Promise<ReportsResponse> {
  const params = new URLSearchParams();

  if (query.from) {
    params.set("from", query.from);
  }
  if (query.to) {
    params.set("to", query.to);
  }

  const suffix = params.toString();
  return apiFetch<ReportsResponse>(
    `/api/reports${suffix ? `?${suffix}` : ""}`,
    { signal },
  );
}
