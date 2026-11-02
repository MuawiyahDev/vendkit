import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { Order } from "@/features/orders/api/orders-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Order status transitions (including cancellation with a reason).
 * Allowed transitions are enforced by the NestJS orders service.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const order = await nestFetch<Order>(`/orders/${id}/status`, {
      method: "PATCH",
      body,
      accessToken,
    });

    return NextResponse.json(order, { status: 200 });
  });
}
