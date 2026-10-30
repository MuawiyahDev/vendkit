import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { Product } from "@/features/products/api/products-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Replaces the full ordered image list of a product. The first image id
 * becomes the primary image on the backend.
 */
export async function PUT(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body || !Array.isArray(body.imageIds)) {
      return badRequest();
    }

    const product = await nestFetch<Product>(`/products/${id}/images`, {
      method: "PUT",
      body,
      accessToken,
    });

    return NextResponse.json(product, { status: 200 });
  });
}
