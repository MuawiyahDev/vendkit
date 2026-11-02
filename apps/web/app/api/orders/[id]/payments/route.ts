import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { OrderPayment } from "@/features/orders/api/orders-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Payments recorded against an order. Creating a payment recalculates the
 * order's paid total and payment status inside the NestJS transactions.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const payments = await nestFetch<OrderPayment[]>(`/orders/${id}/payments`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(payments, { status: 200 });
  });
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const payment = await nestFetch<OrderPayment>(`/orders/${id}/payments`, {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(payment, { status: 201 });
  });
}
