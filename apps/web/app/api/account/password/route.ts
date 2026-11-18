import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const body = await readJsonBody(request);
    const currentPassword =
      typeof body?.currentPassword === "string" ? body.currentPassword : "";
    const newPassword =
      typeof body?.newPassword === "string" ? body.newPassword : "";

    if (!currentPassword || !newPassword) {
      return badRequest("Both the current and new password are required");
    }

    await nestFetch<undefined>("/auth/password", {
      method: "PATCH",
      body: { currentPassword, newPassword },
      accessToken,
    });

    return new NextResponse(null, { status: 204 });
  });
}
