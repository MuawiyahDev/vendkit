import { NextResponse, type NextRequest } from "next/server";

import type { AuthTokens } from "@/lib/auth/types";
import {
  badRequest,
  handleAuthRoute,
  readJsonBody,
} from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { setSessionCookies } from "@/lib/server/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleAuthRoute(async () => {
    const body = await readJsonBody(request);
    const email = typeof body?.email === "string" ? body.email : null;
    const password = typeof body?.password === "string" ? body.password : null;
    const name =
      typeof body?.name === "string" && body.name.trim().length > 0
        ? body.name.trim()
        : undefined;

    if (!email || !password) {
      return badRequest();
    }

    const tokens = await nestFetch<AuthTokens>("/auth/register", {
      method: "POST",
      body: { email, password, ...(name ? { name } : {}) },
    });

    const response = NextResponse.json({ user: tokens.user }, { status: 201 });
    setSessionCookies(response, tokens);
    return response;
  });
}
