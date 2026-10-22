import { cookies } from "next/headers";

import { decodeAccessToken, isTokenExpired } from "@/lib/auth/jwt";
import {
  ACCESS_TOKEN_COOKIE,
  REFRESH_TOKEN_COOKIE,
} from "@/lib/auth/session-cookies";

export type SessionGateState =
  "authenticated" | "refresh-required" | "anonymous";

/**
 * Cheap, server-side session check for layouts.
 *
 * The access token is only decoded (not verified) to decide whether the page
 * can render; real validation always happens against the API in the session
 * route handler.
 */
export async function getSessionGateState(): Promise<SessionGateState> {
  const cookieStore = await cookies();

  const accessToken = cookieStore.get(ACCESS_TOKEN_COOKIE)?.value;
  if (accessToken) {
    const payload = decodeAccessToken(accessToken);
    if (payload && !isTokenExpired(payload)) {
      return "authenticated";
    }
  }

  if (cookieStore.get(REFRESH_TOKEN_COOKIE)?.value) {
    return "refresh-required";
  }

  return "anonymous";
}
