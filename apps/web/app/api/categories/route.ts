import { NextResponse, type NextRequest } from "next/server";

import { badRequest, readJsonBody } from "@/lib/server/auth-route";
import { nestFetch } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type {
  Category,
  CategoryListResponse,
} from "@/features/categories/api/categories-api";

const MAX_PAGE_SIZE = 100;

function buildListQueryString(searchParams: URLSearchParams): string | null {
  const params = new URLSearchParams();

  const page = searchParams.get("page");
  if (page !== null) {
    const parsed = Number(page);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return null;
    }
    params.set("page", String(parsed));
  }

  const limit = searchParams.get("limit");
  if (limit !== null) {
    const parsed = Number(limit);
    if (!Number.isInteger(parsed) || parsed < 1 || parsed > MAX_PAGE_SIZE) {
      return null;
    }
    params.set("limit", String(parsed));
  }

  const search = searchParams.get("search")?.trim();
  if (search) {
    if (search.length > 100) {
      return null;
    }
    params.set("search", search);
  }

  const isActive = searchParams.get("isActive");
  if (isActive !== null) {
    if (isActive !== "true" && isActive !== "false") {
      return null;
    }
    params.set("isActive", isActive);
  }

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildListQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<CategoryListResponse>(
      `/categories${suffix}`,
      { method: "GET", accessToken },
    );

    return NextResponse.json(result, { status: 200 });
  });
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const body = await readJsonBody(request);
    if (!body) {
      return badRequest();
    }

    const category = await nestFetch<Category>("/categories", {
      method: "POST",
      body,
      accessToken,
    });

    return NextResponse.json(category, { status: 201 });
  });
}
