import { NextResponse, type NextRequest } from "next/server";

import type { RestoreJobSummary } from "@/features/backups/backups.types";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

interface RouteContext {
  params: Promise<{ id: string }>;
}

export async function POST(
  request: NextRequest,
  { params }: RouteContext,
): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const { id } = await params;

    const result = await nestFetch<RestoreJobSummary>(
      `/backups/${id}/restore`,
      {
        method: "POST",
        body: { confirmation: "RESTORE" },
        accessToken,
      },
    );

    return NextResponse.json(result, { status: 202 });
  });
}
