import { NextResponse, type NextRequest } from "next/server";

import type { Order } from "@/features/orders/api/orders-api";
import { renderOrderInvoicePdf } from "@/features/invoices/invoice-render";
import { buildInvoiceFileName } from "@/features/invoices/invoice.utils";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Generates and downloads a PDF invoice for an order. The order is fetched
 * through the authenticated server-to-server client so browser sessions and
 * the internal API key are never exposed.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const order = await nestFetch<Order>(`/orders/${id}`, {
      method: "GET",
      accessToken,
    });

    const pdf = await renderOrderInvoicePdf(order);
    const fileName = buildInvoiceFileName(order.orderNumber);

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "Content-Length": String(pdf.length),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
