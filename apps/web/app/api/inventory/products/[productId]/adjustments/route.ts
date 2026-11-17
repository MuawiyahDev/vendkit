import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { StockAdjustmentResult } from "@/features/inventory/api/inventory-api";

interface RouteContext {
  params: Promise<{ productId: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { productId } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const result = await nestFetch<StockAdjustmentResult>(
      `/inventory/products/${productId}/adjustments`,
      { method: "POST", body, accessToken },
    );

    return NextResponse.json(result, { status: 201 });
  });
}
