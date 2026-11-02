import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { OrderPayment } from "@/features/orders/api/orders-api";

interface RouteContext {
  params: Promise<{ id: string; paymentId: string }>;
}

/**
 * Payment status transitions (e.g. marking a pending payment completed or
 * failed). Allowed transitions are enforced by the NestJS orders service.
 */
export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id, paymentId } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const payment = await nestFetch<OrderPayment>(
      `/orders/${id}/payments/${paymentId}/status`,
      { method: "PATCH", body, accessToken },
    );

    return NextResponse.json(payment, { status: 200 });
  });
}
