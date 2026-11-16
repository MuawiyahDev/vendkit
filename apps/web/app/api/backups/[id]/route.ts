import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function DELETE(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;

    await nestFetch<void>(`/backups/${id}`, {
      method: "DELETE",
      accessToken,
    });

    return new NextResponse(null, { status: 204 });
  });
}
