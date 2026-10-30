"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { AuthFormCard } from "@/features/auth/components/auth-form-card";
import { AuthFormFooter } from "@/features/auth/components/auth-form-footer";
import { FieldError } from "@/components/shared/field-error";
import { signUp } from "@/features/auth/api/auth-api";
import {
  signUpSchema,
  type SignUpValues,
} from "@/features/auth/schemas/auth.schemas";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";

const NAME_ERROR_ID = "sign-up-name-error";
const EMAIL_ERROR_ID = "sign-up-email-error";
const PASSWORD_ERROR_ID = "sign-up-password-error";
const CONFIRM_PASSWORD_ERROR_ID = "sign-up-confirm-password-error";

export function SignUpForm() {
  const router = useRouter();
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<SignUpValues>({
    resolver: zodResolver(signUpSchema),
    defaultValues: { name: "", email: "", password: "", confirmPassword: "" },
  });

  async function onSubmit(values: SignUpValues) {
    setServerError(null);

    try {
      await signUp({
        email: values.email,
        password: values.password,
        ...(values.name ? { name: values.name } : {}),
      });
      router.replace("/dashboard");
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
        title="Create your account"
        description="Start managing orders for your business with VendKit."
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
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              type="text"
              autoComplete="name"
              placeholder="Your name (optional)"
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? NAME_ERROR_ID : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError id={NAME_ERROR_ID} message={errors.name?.message} />
          </div>

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
              autoComplete="new-password"
              placeholder="At least 8 characters"
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

          <div className="flex flex-col gap-2">
            <Label htmlFor="confirmPassword">Confirm password</Label>
            <Input
              id="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="Re-enter your password"
              aria-invalid={Boolean(errors.confirmPassword)}
              aria-describedby={
                errors.confirmPassword ? CONFIRM_PASSWORD_ERROR_ID : undefined
              }
              disabled={isSubmitting}
              {...register("confirmPassword")}
            />
            <FieldError
              id={CONFIRM_PASSWORD_ERROR_ID}
              message={errors.confirmPassword?.message}
            />
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Creating account…" : "Create account"}
          </Button>
        </form>
      </AuthFormCard>

      <AuthFormFooter
        prompt="Already have an account?"
        actionLabel="Sign in"
        href="/sign-in"
      />
    </div>
  );
}
