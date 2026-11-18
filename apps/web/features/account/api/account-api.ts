import { apiFetch } from "@/lib/api/client";
import type { SessionUser } from "@/lib/auth/types";

interface UpdateProfileInput {
  name: string | null;
}

interface ChangePasswordInput {
  currentPassword: string;
  newPassword: string;
}

export async function updateProfileName(
  input: UpdateProfileInput,
): Promise<SessionUser> {
  return apiFetch<SessionUser>("/api/account/profile", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}

export async function changePassword(
  input: ChangePasswordInput,
): Promise<void> {
  await apiFetch<void>("/api/account/password", {
    method: "PATCH",
    body: JSON.stringify(input),
  });
}
