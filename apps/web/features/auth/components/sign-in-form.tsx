"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { AuthFormFooter } from "@/features/auth/components/auth-form-footer";
import { FieldError } from "@/components/shared/field-error";
import {
  signInSchema,
  type SignInValues,
} from "@/features/auth/schemas/auth.schemas";
import { signIn } from "@/features/auth/api/auth-api";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";
import { sanitizeNextPath } from "@/lib/navigation";

const EMAIL_ERROR_ID = "sign-in-email-error";
const PASSWORD_ERROR_ID = "sign-in-password-error";

export function SignInForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignInValues>({
    resolver: zodResolver(signInSchema),
    defaultValues: { email: "", password: "" },
  });

  async function onSubmit(values: SignInValues) {
    setServerError(null);

    try {
      await signIn(values);
      const next = sanitizeNextPath(searchParams.get("next"));
      router.replace(next);
      router.refresh();
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <AuthFormCard
        title="Welcome back"
        description="Sign in to your VendKit workspace."
      >
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
          noValidate
        >
          {serverError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? EMAIL_ERROR_ID : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
            <FieldError id={EMAIL_ERROR_ID} message={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="password">Password</Label>
            <Input
              id="password"
              type="password"
              autoComplete="current-password"
              placeholder="Enter your password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={errors.password ? PASSWORD_ERROR_ID : undefined}
              disabled={isSubmitting}
              {...register("password")}
            />
            <FieldError
              id={PASSWORD_ERROR_ID}
              message={errors.password?.message}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Signing in…" : "Sign in"}
          </Button>
        </form>
      </AuthFormCard>

      <AuthFormFooter
        prompt="Don't have an account?"
        actionLabel="Create one"
        href="/sign-up"
      />
    </div>
  );
}
