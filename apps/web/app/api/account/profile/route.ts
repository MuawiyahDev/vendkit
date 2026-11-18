import { NextResponse, type NextRequest } from "next/server";

import type { SessionUser } from "@/lib/auth/types";
import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export async function PATCH(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const body = await readJsonBody(request);
    const name = typeof body?.name === "string" ? body.name.trim() : "";

    if (name.length === 0) {
      return badRequest("Name is required");
    }

    if (name.length > 100) {
      return badRequest("Name must be 100 characters or fewer");
    }

    const user = await nestFetch<SessionUser>("/users/me", {
      method: "PATCH",
      body: { name },
      accessToken,
    });

    return NextResponse.json(user, { status: 200 });
  });
}
