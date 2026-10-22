export interface AccessTokenPayload {
  sub: string;
  email: string;
  role: string;
  type: "access";
  iat?: number;
  exp?: number;
}

/**
 * Decodes a JWT payload without verifying the signature.
 *
 * Only use this for non-authoritative checks such as token expiry or reading
 * the subject id before forwarding the token to the API for real validation.
 */
export function decodeAccessToken(token: string): AccessTokenPayload | null {
  const parts = token.split(".");
  if (parts.length !== 3 || !parts[1]) {
    return null;
  }

  try {
    const payload = JSON.parse(base64UrlDecode(parts[1])) as unknown;
    if (!isAccessTokenPayload(payload)) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export function isTokenExpired(
  payload: AccessTokenPayload,
  now = Date.now(),
): boolean {
  if (typeof payload.exp !== "number") {
    return true;
  }
  return payload.exp * 1000 <= now;
}

function base64UrlDecode(value: string): string {
  const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
  return atob(padded);
}

function isAccessTokenPayload(value: unknown): value is AccessTokenPayload {
  if (typeof value !== "object" || value === null) {
    return false;
  }
  const payload = value as Record<string, unknown>;
  return typeof payload.sub === "string" && typeof payload.email === "string";
}
