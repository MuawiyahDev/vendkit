import { NextResponse, type NextRequest } from "next/server";

import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { ImageLibraryStats } from "@/features/images/api/images-api";

/** Proxies the authenticated image-library statistics endpoint. */
export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const stats = await nestFetch<ImageLibraryStats>("/images/stats", {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(stats, { status: 200 });
  });
}
