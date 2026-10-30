import { NextResponse, type NextRequest } from "next/server";

import { badRequest } from "@/lib/server/auth-route";
import { nestFetch, nestFormData } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";
import type {
  Image,
  ImageListResponse,
} from "@/features/images/api/images-api";

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

  return params.toString();
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    const queryString = buildListQueryString(request.nextUrl.searchParams);
    if (queryString === null) {
      return badRequest("Invalid list query parameters");
    }

    const suffix = queryString ? `?${queryString}` : "";
    const result = await nestFetch<ImageListResponse>(`/images${suffix}`, {
      method: "GET",
      accessToken,
    });

    return NextResponse.json(result, { status: 200 });
  });
}

/**
 * Proxies a multipart image upload to the NestJS images endpoint. The file
 * field name (`file`) matches the `FileInterceptor('file')` used by the
 * images controller.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  return handleProtectedRoute(request, async ({ accessToken }) => {
    let formData: FormData;
    try {
      formData = await request.formData();
    } catch {
      return badRequest("Expected a multipart/form-data request");
    }

    const file = formData.get("file");
    if (!(file instanceof File) || file.size === 0) {
      return badRequest("An image file is required");
    }

    const altText = formData.get("altText");
    if (altText !== null && typeof altText !== "string") {
      return badRequest("Invalid alt text");
    }

    const upstream = new FormData();
    upstream.set("file", file, file.name);
    if (altText && altText.trim().length > 0) {
      upstream.set("altText", altText.trim());
    }

    const image = await nestFormData<Image>("/images", upstream, {
      accessToken,
    });

    return NextResponse.json(image, { status: 201 });
  });
}
