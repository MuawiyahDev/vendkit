import { NextResponse, type NextRequest } from "next/server";

import { nestFetchFile } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * Streams a completed backup archive through the authenticated dashboard
 * session. NestJS never exposes the internal file path; only the download
 * response headers cross the boundary.
 */
export async function GET(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;
    const file = await nestFetchFile(`/backups/${id}/download`, {
      accessToken,
    });

    return new NextResponse(file.stream, {
      status: 200,
      headers: {
        "Content-Type": file.mimeType,
        ...(file.contentLength ? { "Content-Length": file.contentLength } : {}),
        ...(file.contentDisposition
          ? { "Content-Disposition": file.contentDisposition }
          : { "Content-Disposition": "attachment" }),
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  });
}
