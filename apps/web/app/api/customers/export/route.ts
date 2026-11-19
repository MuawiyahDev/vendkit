import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { CsvExport } from "@/features/orders/api/orders-api";

const CUSTOMER_SORT_FIELDS = new Set(["createdAt", "updatedAt", "name"]);
const CUSTOMER_SORT_ORDERS = new Set(["asc", "desc"]);

function buildExportQuery(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const search = searchParams.get("search")?.trim();
  if (search) {
    if (search.length > 100) {
      return null;
    }
    params.set("search", search);
  }

  const sortBy = searchParams.get("sortBy");
  if (sortBy !== null) {
    if (!CUSTOMER_SORT_FIELDS.has(sortBy)) {
      return null;
    }
    params.set("sortBy", sortBy);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (!CUSTOMER_SORT_ORDERS.has(sortOrder)) {
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
    const result = await nestFetch<CsvExport>(`/customers/export${suffix}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}
