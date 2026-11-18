import { NextResponse, type NextRequest } from "next/server";

import type { InvoiceDetail } from "@/features/invoices/invoices-api";
import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/** Returns the invoice already issued for an order. */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const invoice = await nestFetch<InvoiceDetail>(`/orders/${id}/invoice`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(invoice, { status: 200 });
  });
}

/** Creates (and numbers) the invoice for an order. */
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

    const invoice = await nestFetch<InvoiceDetail>(`/orders/${id}/invoice`, {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(invoice, { status: 201 });
  });
}
