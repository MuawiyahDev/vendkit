import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string; imageId: string }>;
}

/**
 * Detaches one image from a product without touching the library file —
 * the backend only removes the association row.
 */
export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id, imageId } = await params;

    await nestFetch<undefined>(`/products/${id}/images/${imageId}`, {
      method: "DELETE",
      accessToken,
    });

    return new NextResponse(null, { status: 204 });
  });
}
