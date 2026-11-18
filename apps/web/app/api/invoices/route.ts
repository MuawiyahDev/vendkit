import { NextResponse, type NextRequest } from "next/server";

import {
  INVOICE_STATUSES,
  type InvoiceListResponse,
} from "@/features/invoices/invoices-api";
import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

const MAX_PAGE_SIZE = 100;
const MAX_SEARCH_LENGTH = 100;

function buildListQuery(searchParams: URLSearchParams): string | null {
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
    if (!(INVOICE_STATUSES as readonly string[]).includes(status)) {
      return null;
    }
    params.set("status", status);
  }

  const sortOrder = searchParams.get("sortOrder");
  if (sortOrder !== null) {
    if (sortOrder !== "asc" && sortOrder !== "desc") {
      return null;
    }
    params.set("sortOrder", sortOrder);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildListQuery(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<InvoiceListResponse>(`/invoices${suffix}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}
