import { NextResponse, type NextRequest } from "next/server";

import { NestApiError } from "./nest-api";

/**
 * Wraps an auth route handler with consistent error handling.
 * Internal failures are logged server-side and never leaked to the client.
 */
export async function handleAuthRoute(
  handler: () => Promise<NextResponse>,
): Promise<NextResponse> {
  try {
    return await handler();
  } catch (error) {
    if (error instanceof NestApiError) {
      return NextResponse.json(
        { statusCode: error.status, message: error.message },
        { status: error.status },
      );
    }

    console.error("[auth] Unhandled error", error);
    return NextResponse.json(
      { statusCode: 500, message: "Something went wrong. Please try again." },
      { status: 500 },
    );
  }
}

export async function readJsonBody(
  request: NextRequest,
): Promise<Record<string, unknown> | null> {
  try {
    const body: unknown = await request.json();
    if (typeof body !== "object" || body === null || Array.isArray(body)) {
      return null;
    }
    return body as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function badRequest(message = "Invalid request body"): NextResponse {
  return NextResponse.json({ statusCode: 400, message }, { status: 400 });
}
