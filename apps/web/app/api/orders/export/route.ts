import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { CsvExport } from "@/features/orders/api/orders-api";

const MAX_SEARCH_LENGTH = 100;

const ORDER_STATUSES = new Set([
  "PENDING",
  "CONFIRMED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
]);
const PAYMENT_STATUSES = new Set(["UNPAID", "PARTIALLY_PAID", "PAID"]);
const ORDER_SOURCES = new Set([
  "FACEBOOK",
  "INSTAGRAM",
  "WHATSAPP",
  "TIKTOK",
  "WEBSITE",
  "PHONE",
  "WALK_IN",
  "OTHER",
]);
const ORDER_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "orderNumber",
  "totalAmount",
]);
const ORDER_SORT_ORDERS = new Set(["asc", "desc"]);
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

function buildExportQuery(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const search = searchParams.get("search")?.trim();
  if (search) {
    if (search.length > MAX_SEARCH_LENGTH) {
      return null;
    }
    params.set("search", search);
  }

  const status = searchParams.get("status");
  if (status !== null) {
    if (!ORDER_STATUSES.has(status)) {
      return null;
    }
    params.set("status", status);
  }

  const paymentStatus = searchParams.get("paymentStatus");
  if (paymentStatus !== null) {
    if (!PAYMENT_STATUSES.has(paymentStatus)) {
      return null;
    }
    params.set("paymentStatus", paymentStatus);
  }

  const source = searchParams.get("source");
  if (source !== null) {
    if (!ORDER_SOURCES.has(source)) {
      return null;
    }
    params.set("source", source);
  }

  const customerId = searchParams.get("customerId");
  if (customerId !== null) {
    if (!UUID_PATTERN.test(customerId)) {
      return null;
    }
    params.set("customerId", customerId);
  }

  for (const param of ["dateFrom", "dateTo"] as const) {
    const value = searchParams.get(param);
    if (value !== null) {
      if (!DATE_PATTERN.test(value) || Number.isNaN(Date.parse(value))) {
        return null;
      }
      params.set(param, value);
    }
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy !== null) {
    if (!ORDER_SORT_FIELDS.has(sortBy)) {
      return null;
    }
    params.set("sortBy", sortBy);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (!ORDER_SORT_ORDERS.has(sortOrder)) {
      return null;
    }
    params.set("sortOrder", sortOrder);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildExportQuery(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid export query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<CsvExport>(`/orders/export${suffix}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}
