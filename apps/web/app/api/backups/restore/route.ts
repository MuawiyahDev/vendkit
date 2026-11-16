import { NextResponse, type NextRequest } from "next/server";

import type { RestoreJobSummary } from "@/features/backups/backups.types";
import { badRequest } from "@/lib/server/auth-route";
import { nestFormData } from "@/lib/server/nest-api";
import { handleProtectedRoute } from "@/lib/server/protected-route";

const CONFIRMATION_PHRASE = "RESTORE";

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
      return badRequest("A backup archive file is required");
    }

    const confirmation = formData.get("confirmation");
    if (confirmation !== CONFIRMATION_PHRASE) {
      return badRequest("Restore confirmation is required");
    }

    const upstream = new FormData();
    upstream.set("file", file, file.name);
    upstream.set("confirmation", CONFIRMATION_PHRASE);

    const result = await nestFormData<RestoreJobSummary>(
      "/backups/restore",
      upstream,
      { accessToken },
    );

    return NextResponse.json(result, { status: 202 });
  });
}
