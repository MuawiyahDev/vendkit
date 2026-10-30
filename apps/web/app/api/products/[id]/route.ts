import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { Product } from "@/features/products/api/products-api";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const product = await nestFetch<Product>(`/products/${id}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(product, { status: 200 });
  });
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const product = await nestFetch<Product>(`/products/${id}`, {
      method: "PATCH",
      body,
      accessToken,
    });

    return NextResponse.json(product, { status: 200 });
  });
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;

    await nestFetch<undefined>(`/products/${id}`, {
      method: "DELETE",
      accessToken,
    });

    return new NextResponse(null, { status: 204 });
  });
}
