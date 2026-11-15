import { NextResponse, type NextRequest } from "next/server";

import {
  DASHBOARD_PRESETS,
  type DashboardResponse,
} from "@/features/dashboard/dashboard.types";
import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

const PRESETS = new Set<string>(DASHBOARD_PRESETS);

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function buildDashboardQueryString(
  searchParams: URLSearchParams,
): string | null {
  const preset = searchParams.get("preset");
  const params = new URLSearchParams();

  if (preset !== null) {
    if (!PRESETS.has(preset)) {
      return null;
    }
    params.set("preset", preset);
  }

  if (preset === "custom") {
    const from = searchParams.get("from");
    const to = searchParams.get("to");

    if (
      from === null ||
      to === null ||
      !DATE_PATTERN.test(from) ||
      !DATE_PATTERN.test(to) ||
      Number.isNaN(Date.parse(from)) ||
      Number.isNaN(Date.parse(to)) ||
      from > to
    ) {
      return null;
    }

    params.set("from", from);
    params.set("to", to);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildDashboardQueryString(request.nextUrl.searchParams);

    if (queryString === null) {
      return badRequest("Invalid dashboard query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const dashboard = await nestFetch<DashboardResponse>(
      `/dashboard${suffix}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(dashboard, { status: 200 });
  });
}
