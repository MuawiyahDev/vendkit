import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { clearSessionCookies, getSessionTokens } from "@/lib/server/session";
import { handleAuthRoute } from "@/lib/server/auth-route";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleAuthRoute(async () => {
    const { accessToken } = getSessionTokens(request.cookies);

    if (accessToken) {
      try {
        await nestFetch<void>("/auth/logout", {
          method: "POST",
          accessToken,
        });
      } catch {
        // The local session is cleared even when the API cannot revoke the
        // refresh token, so sign-out never leaves a half-cleared session.
      }
    }

    const response = NextResponse.json({ success: true }, { status: 200 });
    clearSessionCookies(response);
    return response;
  });
}
