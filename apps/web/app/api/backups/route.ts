import { NextResponse, type NextRequest } from "next/server";

import type {
  BackupListResponse,
  BackupSummary,
} from "@/features/backups/backups.types";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const result = await nestFetch<BackupListResponse>("/backups", {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const result = await nestFetch<BackupSummary>("/backups", {
      method: "POST",
      accessToken,
    });

    return NextResponse.json(result, { status: 201 });
  });
}
