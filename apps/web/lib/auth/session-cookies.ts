export const ACCESS_TOKEN_COOKIE = "oo_access_token";
export const REFRESH_TOKEN_COOKIE = "oo_refresh_token";

/** Mirrors the API access token lifetime (15 minutes). */
const ACCESS_TOKEN_MAX_AGE_SECONDS = 15 * 60;
/** Mirrors the API refresh token lifetime (7 days). */
const REFRESH_TOKEN_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

interface SessionCookieOptions {
  httpOnly: true;
  sameSite: "lax";
  secure: boolean;
  path: string;
  maxAge: number;
}

function buildOptions(maxAge: number): SessionCookieOptions {
  return {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function accessTokenCookieOptions(): SessionCookieOptions {
  return buildOptions(ACCESS_TOKEN_MAX_AGE_SECONDS);
}

export function refreshTokenCookieOptions(): SessionCookieOptions {
  return buildOptions(REFRESH_TOKEN_MAX_AGE_SECONDS);
}
