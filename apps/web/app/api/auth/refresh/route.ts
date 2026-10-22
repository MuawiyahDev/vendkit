import { NextResponse, type NextRequest } from "next/server";

import { REFRESH_TOKEN_COOKIE } from "@/lib/auth/session-cookies";
import { badRequest, handleAuthRoute } from "@/lib/server/auth-route";
import { refreshTokens, setSessionCookies } from "@/lib/server/session";

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleAuthRoute(async () => {
    const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;
    if (!refreshToken) {
      return badRequest("Missing refresh token");
    }

    const tokens = await refreshTokens(refreshToken);
    if (!tokens) {
      return NextResponse.json(
        {
          statusCode: 401,
          message: "Your session has expired. Please sign in again.",
        },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user: tokens.user }, { status: 200 });
    setSessionCookies(response, tokens);
    return response;
  });
}
