import { NextResponse, type NextRequest } from "next/server";

import { NestApiError } from "./nest-api";
import {
  getSessionTokens,
  resolveSession,
  setSessionCookies,
} from "./session";

export interface ProtectedRouteContext {
  accessToken: string;
  userId: string;
}

/**
 * Wraps an authenticated Next.js route handler that proxies user-scoped
 * requests to the NestJS API. Resolves (and, when needed, silently rotates)
 * the session from cookies, forwards a valid access token, and normalizes
 * NestJS API errors into the `{ statusCode, message }` contract used by the
 * browser-facing API client.
 */
export async function handleProtectedRoute(
  request: NextRequest,
  handler: (context: ProtectedRouteContext) => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    const { accessToken, refreshToken } = getSessionTokens(request.cookies);
    const session = await resolveSession(accessToken, refreshToken);

    if (!session.user) {
      return NextResponse.json(
        { statusCode: 401, message: "Not authenticated" },
        { status: 401 },
      );
    }

    const activeAccessToken =
      session.rotatedTokens?.accessToken ?? accessToken ?? "";

    const response = await handler({
      accessToken: activeAccessToken,
      userId: session.user.id,
    });

    if (session.rotatedTokens) {
      setSessionCookies(response, session.rotatedTokens);
    }

    return response;
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json(
        { statusCode: error.status, message: error.message },
        { status: error.status },
      );
    }

    console.error("[api] Unhandled proxy error", error);
    return NextResponse.json(
      { statusCode: 500, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}
