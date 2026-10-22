import { NextResponse, type NextRequest } from "next/server";

import { handleAuthRoute } from "@/lib/server/auth-route";
import {
  getSessionTokens,
  resolveSession,
  setSessionCookies,
} from "@/lib/server/session";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleAuthRoute(async () => {
    const { accessToken, refreshToken } = getSessionTokens(request.cookies);
    const { user, rotatedTokens } = await resolveSession(
      accessToken,
      refreshToken,
    );

    if (!user) {
      return NextResponse.json(
        { statusCode: 401, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const response = NextResponse.json({ user }, { status: 200 });
    if (rotatedTokens) {
      setSessionCookies(response, rotatedTokens);
    }
    return response;
  });
}
