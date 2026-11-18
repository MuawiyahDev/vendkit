import { NextResponse, type NextRequest } from "next/server";

import type { InvoiceDetail } from "@/features/invoices/invoices-api";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const invoice = await nestFetch<InvoiceDetail>(`/invoices/${id}/issue`, {
      method: "POST",
      body: {},
      accessToken,
    });

    return NextResponse.json(invoice, { status: 200 });
  });
}
