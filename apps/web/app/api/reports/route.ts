import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { ReportsResponse } from "@/features/reports/api/reports-api";

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const params = new URLSearchParams();

    for (const key of ["from", "to"] as const) {
      const value = request.nextUrl.searchParams.get(key);
      if (value !== null) {
        if (!DATE_PATTERN.test(value)) {
          return badRequest("Report dates must use YYYY-MM-DD");
        }
        params.set(key, value);
      }
    }

    const query = params.toString();
    const result = await nestFetch<ReportsResponse>(
      `/reports${query ? `?${query}` : ""}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
