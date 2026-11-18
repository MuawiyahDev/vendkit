import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function PATCH(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const body = await readJsonBody(request);
    const password =
      typeof body?.password === "string" ? body.password.trim() : "";

    if (password.length < 8) {
      return badRequest("Password must be at least 8 characters");
    }

    await nestFetch<undefined>(`/users/${id}/password`, {
      method: "PATCH",
      body: { password },
      accessToken,
    });

    return new NextResponse(null, { status: 204 });
  });
}
