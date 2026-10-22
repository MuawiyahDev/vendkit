import { ApiError, apiFetch } from "@/lib/api/client";
import type { SessionUser } from "@/lib/auth/types";

interface SignInInput {
  email: string;
  password: string;
}

interface SignUpInput {
  email: string;
  password: string;
  name?: string;
}

export async function signIn(input: SignInInput): Promise<SessionUser> {
  const data = await apiFetch<{ user: SessionUser }>("/api/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function signUp(input: SignUpInput): Promise<SessionUser> {
  const data = await apiFetch<{ user: SessionUser }>("/api/auth/register", {
    method: "POST",
    body: JSON.stringify(input),
  });
  return data.user;
}

export async function fetchSession(): Promise<SessionUser | null> {
  try {
    const data = await apiFetch<{ user: SessionUser }>("/api/auth/session");
    return data.user;
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      return null;
    }
    throw error;
  }
}

export async function signOut(): Promise<void> {
  await apiFetch("/api/auth/logout", { method: "POST" });
}
