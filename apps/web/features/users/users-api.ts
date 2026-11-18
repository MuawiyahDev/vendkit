import { apiFetch } from "@/lib/api/client";

export const USER_ROLES = ["USER", "ADMIN"] as const;
export type UserRole = (typeof USER_ROLES)[number];

export interface TeamUser {
  id: string;
  email: string;
  name: string | null;
  role: UserRole;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTeamUserInput {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
}

export async function listUsers({
  signal,
}: { signal?: AbortSignal } = {}): Promise<TeamUser[]> {
  return apiFetch<TeamUser[]>("/api/users", { signal });
}

export async function createUser(
  input: CreateTeamUserInput,
): Promise<TeamUser> {
  return apiFetch<TeamUser>("/api/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export async function setUserPassword(
  userId: string,
  password: string,
): Promise<void> {
  await apiFetch<void>(`/api/users/${userId}/password`, {
    method: "PATCH",
    body: JSON.stringify({ password }),
  });
}
