import { NextResponse, type NextRequest } from "next/server";

import { nestFetchFile } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Streams a stored image file from the NestJS API. This mirrors the backend
 * `/images/:id/file` route and lets `<img>` tags load library images through
 * the same authenticated cookie session as the rest of the dashboard.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const file = await nestFetchFile(`/images/${id}/file`, { accessToken });

    return new NextResponse(file.stream, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        ...(file.contentLength
          ? { "Content-Length": file.contentLength }
          : {}),
        "Content-Disposition": "inline",
        "Cache-Control": "private, max-age=86400",
      },
    });
  });
}
