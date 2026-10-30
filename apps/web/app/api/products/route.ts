import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type {
  Product,
  ProductListResponse,
} from "@/features/products/api/products-api";

const MAX_PAGE_SIZE = 100;

const PRODUCT_SORT_FIELDS = [
  "createdAt",
  "updatedAt",
  "name",
  "sellingPrice",
  "stockQuantity",
] as const;

const PRODUCT_SORT_ORDERS = ["asc", "desc"] as const;

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

function readPriceParam(raw: string): string | null {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed < 0) {
    return null;
  }
  const [, decimals] = raw.split(".");
  if (decimals !== undefined && decimals.length > 2) {
    return null;
  }
  return raw;
}

function buildListQueryString(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const page = searchParams.get("page");
  if (page !== null) {
    const parsed = readIntegerParam(page, { min: 1 });
    if (parsed === null) {
      return null;
    }
    params.set("page", parsed);
  }

  const limit = searchParams.get("limit");
  if (limit !== null) {
    const parsed = readIntegerParam(limit, { min: 1, max: MAX_PAGE_SIZE });
    if (parsed === null) {
      return null;
    }
    params.set("limit", parsed);
  }

  const search = searchParams.get("search")?.trim();
  if (search) {
    if (search.length > 100) {
      return null;
    }
    params.set("search", search);
  }

  for (const param of ["categoryId", "brandId"] as const) {
    const value = searchParams.get(param)?.trim();
    if (value) {
      params.set(param, value);
    }
  }

  for (const param of ["isActive", "lowStock"] as const) {
    const value = searchParams.get(param);
    if (value !== null) {
      if (value !== "true" && value !== "false") {
        return null;
      }
      params.set(param, value);
    }
  }

  for (const param of ["minPrice", "maxPrice"] as const) {
    const value = searchParams.get(param);
    if (value !== null) {
      const parsed = readPriceParam(value);
      if (parsed === null) {
        return null;
      }
      params.set(param, parsed);
    }
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy !== null) {
    if (!(PRODUCT_SORT_FIELDS as readonly string[]).includes(sortBy)) {
      return null;
    }
    params.set("sortBy", sortBy);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (!(PRODUCT_SORT_ORDERS as readonly string[]).includes(sortOrder)) {
      return null;
    }
    params.set("sortOrder", sortOrder);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildListQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<ProductListResponse>(`/products${suffix}`, {
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

    const product = await nestFetch<Product>("/products", {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(product, { status: 201 });
  });
}
