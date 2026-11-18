import type { Metadata } from "next";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { SignUpForm } from "@/features/auth/components/sign-up-form";
import type { RegistrationStatus } from "@/features/auth/api/auth-api";
import { nestFetch } from "@/lib/server/nest-api";

export const metadata: Metadata = {
  title: "Create account",
};

// The registration policy lives in the API, so this page must read it per
// request instead of caching a build-time answer.
export const dynamic = "force-dynamic";

export default async function SignUpPage() {
  const status = await readRegistrationStatus();

  if (status && !status.open) {
    return (
      <AuthFormCard
        title="Registration closed"
        description="This VendKit installation already has an administrator."
      >
        <div className="flex flex-col gap-4">
          <p className="text-muted-foreground text-sm leading-relaxed">
            Ask an administrator to create your account. If you already have
            one, sign in with your email and password.
          </p>
          <Button asChild>
            <Link href="/sign-in">Go to sign in</Link>
          </Button>
        </div>
      </AuthFormCard>
    );
  }

  return <SignUpForm isFirstUser={status?.isFirstUser ?? false} />;
}

async function readRegistrationStatus(): Promise<RegistrationStatus | null> {
  try {
    return await nestFetch<RegistrationStatus>("/auth/registration-status", {
      method: "GET",
    });
  } catch {
    // If the API cannot be reached, fall back to the form and let the
    // server-side registration check return the authoritative error.
    return null;
  }
}
