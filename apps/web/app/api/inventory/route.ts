import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { InventoryListResponse } from "@/features/inventory/api/inventory-api";

const MAX_PAGE_SIZE = 100;

const STATUSES = [
  "all",
  "in-stock",
  "low-stock",
  "out-of-stock",
  "untracked",
] as const;

const SORT_FIELDS = [
  "name",
  "sku",
  "stockQuantity",
  "lowStockThreshold",
  "updatedAt",
] as const;

const SORT_ORDERS = ["asc", "desc"] as const;

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

  const status = searchParams.get("status");
  if (status !== null) {
    if (!(STATUSES as readonly string[]).includes(status)) return null;
    params.set("status", status);
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy !== null) {
    if (!(SORT_FIELDS as readonly string[]).includes(sortBy)) return null;
    params.set("sortBy", sortBy);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (!(SORT_ORDERS as readonly string[]).includes(sortOrder)) return null;
    params.set("sortOrder", sortOrder);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<InventoryListResponse>(
      `/inventory${suffix}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
