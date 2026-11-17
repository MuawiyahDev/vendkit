import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { StockMovementListResponse } from "@/features/inventory/api/inventory-api";

const MAX_PAGE_SIZE = 100;

const MOVEMENT_TYPES = [
  "INITIAL",
  "MANUAL_INCREASE",
  "MANUAL_DECREASE",
  "SET",
  "ORDER_PLACED",
  "ORDER_UPDATED",
  "ORDER_CANCELLED",
  "ORDER_DELETED",
  "RETURN",
  "DAMAGE",
] as const;

function readIntegerParam(
  raw: string,
  { min, max }: { min: number; max?: number },
): string | null {
  const parsed = Number(raw);
  if (!Number.isInteger(parsed) || parsed < min) {
    return null;
  }
  if (max !== undefined && parsed > max) {
    return null;
  }
  return String(parsed);
}

function buildQueryString(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const page = searchParams.get("page");
  if (page !== null) {
    const parsed = readIntegerParam(page, { min: 1 });
    if (parsed === null) return null;
    params.set("page", parsed);
  }

  const limit = searchParams.get("limit");
  if (limit !== null) {
    const parsed = readIntegerParam(limit, { min: 1, max: MAX_PAGE_SIZE });
    if (parsed === null) return null;
    params.set("limit", parsed);
  }

  const search = searchParams.get("search")?.trim();
  if (search) {
    if (search.length > 100) return null;
    params.set("search", search);
  }

  for (const param of ["productId", "orderId"] as const) {
    const value = searchParams.get(param)?.trim();
    if (value) {
      params.set(param, value);
    }
  }

  const type = searchParams.get("type");
  if (type !== null) {
    if (!(MOVEMENT_TYPES as readonly string[]).includes(type)) return null;
    params.set("type", type);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (sortOrder !== "asc" && sortOrder !== "desc") return null;
    params.set("sortOrder", sortOrder);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid movement query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<StockMovementListResponse>(
      `/inventory/movements${suffix}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
