import { NextResponse, type NextRequest } from "next/server";

import type { InvoiceDetail } from "@/features/invoices/invoices-api";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const invoice = await nestFetch<InvoiceDetail>(`/invoices/${id}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(invoice, { status: 200 });
  });
}
