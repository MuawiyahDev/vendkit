import { NextResponse, type NextRequest } from "next/server";

import {
  isSettingsCategory,
  type SettingsResponseMap,
} from "@/features/settings/settings.types";
import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ category: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { category } = await params;

    if (!isSettingsCategory(category)) {
      return badRequest("Unknown settings category");
    }

    const result = await nestFetch<SettingsResponseMap[typeof category]>(
      `/settings/${category}/reset`,
      { method: "POST", body: {}, accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
