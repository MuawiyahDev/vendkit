import type { NextResponse } from "next/server";

import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
  accessTokenCookieOptions,
  refreshTokenCookieOptions,
} from "@/lib/auth/session-cookies";
import type { AuthTokens, SessionUser } from "@/lib/auth/types";
import { decodeAccessToken, isTokenExpired } from "@/lib/auth/jwt";
import { NestApiError, nestFetch } from "./nest-api";

export function setSessionCookies(
  response: NextResponse,
  tokens: AuthTokens,
): void {
  response.cookies.set(
    ACCESS_TOKEN_COOKIE,
    tokens.accessToken,
    accessTokenCookieOptions(),
  );
  response.cookies.set(
    REFRESH_TOKEN_COOKIE,
    tokens.refreshToken,
    refreshTokenCookieOptions(),
  );
}

export function clearSessionCookies(response: NextResponse): void {
  response.cookies.set(ACCESS_TOKEN_COOKIE, "", {
    ...accessTokenCookieOptions(),
    maxAge: 0,
  });
  response.cookies.set(REFRESH_TOKEN_COOKIE, "", {
    ...refreshTokenCookieOptions(),
    maxAge: 0,
  });
}

export function getSessionTokens(requestCookies: {
  get: (name: string) => { value: string } | undefined;
}): { accessToken?: string; refreshToken?: string } {
  return {
    accessToken: requestCookies.get(ACCESS_TOKEN_COOKIE)?.value,
    refreshToken: requestCookies.get(REFRESH_TOKEN_COOKIE)?.value,
  };
}

export interface ResolvedSession {
  user: SessionUser | null;
  rotatedTokens: AuthTokens | null;
}

/**
 * Resolves the current user from the session cookies, silently rotating the
 * refresh token when the access token has expired.
 */
export async function resolveSession(
  accessToken: string | undefined,
  refreshToken: string | undefined,
): Promise<ResolvedSession> {
  if (accessToken) {
    const payload = decodeAccessToken(accessToken);
    if (payload && !isTokenExpired(payload)) {
      const user = await fetchSessionUser(accessToken);
      if (user) {
        return { user, rotatedTokens: null };
      }
    }
  }

  if (refreshToken) {
    const tokens = await refreshTokens(refreshToken);
    if (tokens) {
      return { user: tokens.user, rotatedTokens: tokens };
    }
  }

  return { user: null, rotatedTokens: null };
}

export async function refreshTokens(
  refreshToken: string,
): Promise<AuthTokens | null> {
  try {
    return await nestFetch<AuthTokens>("/auth/refresh", {
      method: "POST",
      body: { refreshToken },
    });
  } catch {
    return null;
  }
}

export async function fetchSessionUser(
  accessToken: string,
): Promise<SessionUser | null> {
  const payload = decodeAccessToken(accessToken);
  if (!payload) {
    return null;
  }

  try {
    return await nestFetch<SessionUser>(`/users/${payload.sub}`, {
      method: "GET",
      accessToken,
    });
  } catch (error) {
    if (error instanceof NestApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}
