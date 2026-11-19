import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type {
  Order,
  OrderListResponse,
} from "@/features/orders/api/orders-api";

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

const ORDER_SORT_FIELDS = new Set([
  "createdAt",
  "updatedAt",
  "orderNumber",
  "totalAmount",
]);
const ORDER_SORT_ORDERS = new Set(["asc", "desc"]);
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
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}(T[\d:.]+Z?)?$/;

function buildListQueryString(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const page = searchParams.get("page");
  if (page !== null) {
    const parsed = Number(page);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return null;
    }
    params.set("page", String(parsed));
  }

  const limit = searchParams.get("limit");
  if (limit !== null) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
      return null;
    }
    params.set("limit", String(parsed));
  }

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

/**
 * Orders list and creation. Query/body validation for writes happens in the
 * NestJS DTOs; this proxy only normalizes the list query so malformed
 * filters fail fast with a consistent 400 contract.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildListQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<OrderListResponse>(`/orders${suffix}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const order = await nestFetch<Order>("/orders", {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(order, { status: 201 });
  });
}
