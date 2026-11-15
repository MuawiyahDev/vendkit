import { NextResponse, type NextRequest } from "next/server";

import type { AllSettings } from "@/features/settings/settings.types";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const settings = await nestFetch<AllSettings>("/settings", {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(settings, { status: 200 });
  });
}
