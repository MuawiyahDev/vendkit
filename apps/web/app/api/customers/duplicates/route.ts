import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type { CustomerDuplicateResponse } from "@/features/customers/api/customers-api";

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const PHONE_SEARCH_PATTERN = /^\+?[\d\s\-().]{6,30}$/;

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const phone = request.nextUrl.searchParams.get("phone")?.trim() ?? "";
    const excludeId = request.nextUrl.searchParams.get("excludeId")?.trim();

    if (!PHONE_SEARCH_PATTERN.test(phone)) {
      return badRequest("Invalid phone number");
    }

    if (excludeId && !UUID_PATTERN.test(excludeId)) {
      return badRequest("Invalid customer id");
    }

    const params = new URLSearchParams({ phone });
    if (excludeId) {
      params.set("excludeId", excludeId);
    }

    const result = await nestFetch<CustomerDuplicateResponse>(
      `/customers/duplicates?${params.toString()}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}
