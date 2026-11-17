import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { InventoryOverview } from "@/features/inventory/api/inventory-api";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const result = await nestFetch<InventoryOverview>("/inventory/overview", {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}
