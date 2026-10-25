import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type {
  CustomerOrderHistoryResponse,
} from "@/features/customers/api/customers-api";

const ORDER_HISTORY_PAGE_SIZE = 10;

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Order history for a customer. Backed by the NestJS orders list endpoint
 * filtered by customerId — the only supported way to query orders per customer.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const searchParams = request.nextUrl.searchParams;

    const query = new URLSearchParams({ customerId: id });
    const page = searchParams.get("page");
    if (page !== null && /^\d+$/.test(page) && Number(page) >= 1) {
      query.set("page", page);
    }
    query.set("limit", String(ORDER_HISTORY_PAGE_SIZE));

    const result = await nestFetch<CustomerOrderHistoryResponse>(
      `/orders?${query.toString()}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
