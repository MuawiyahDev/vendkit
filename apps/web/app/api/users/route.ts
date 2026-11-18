import { NextResponse, type NextRequest } from "next/server";

import type { TeamUser } from "@/features/users/users-api";
import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const users = await nestFetch<TeamUser[]>("/users", {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(users, { status: 200 });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const user = await nestFetch<TeamUser>("/users", {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(user, { status: 201 });
  });
}
