"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, KeyRound, LoaderCircle, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { PageHeader } from "@/components/shared/page-header";
import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useSession } from "@/features/auth/session/session-provider";
import { ApiError } from "@/lib/api/client";

import { changePassword, updateProfileName } from "../api/account-api";
import {
  passwordFormSchema,
  profileFormSchema,
  type PasswordFormValues,
  type ProfileFormValues,
} from "../schemas/account.schemas";

const NAME_ERROR_ID = "account-name-error";
const CURRENT_PASSWORD_ERROR_ID = "account-current-password-error";
const NEW_PASSWORD_ERROR_ID = "account-new-password-error";
const CONFIRM_PASSWORD_ERROR_ID = "account-confirm-password-error";

export function AccountPage() {
  const { status, user, refresh } = useSession();

  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: { name: "" },
  });

  const passwordForm = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const [profileError, setProfileError] = useState<string | null>(null);
  const [profileSaved, setProfileSaved] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const resetProfile = profileForm.reset;

  useEffect(() => {
    if (user?.name) {
      resetProfile({ name: user.name });
    }
  }, [user?.name, resetProfile]);

  if (status === "loading") {
    return (
      <div className="flex flex-col gap-6" role="status">
        <span className="sr-only">Loading account…</span>
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-52 w-full rounded-xl" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  const onSubmitProfile = profileForm.handleSubmit(async (values) => {
    setProfileError(null);
    setProfileSaved(false);

    try {
      await updateProfileName({ name: values.name });
      setProfileSaved(true);
      refresh();
    } catch (error) {
      setProfileError(
        error instanceof ApiError
          ? error.message
          : "Unable to update your profile.",
      );
    }
  });

  const onSubmitPassword = passwordForm.handleSubmit(async (values) => {
    setPasswordError(null);
    setPasswordSaved(false);

    try {
      await changePassword({
        currentPassword: values.currentPassword,
        newPassword: values.newPassword,
      });
      passwordForm.reset({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
      setPasswordSaved(true);
    } catch (error) {
      setPasswordError(
        error instanceof ApiError
          ? error.message
          : "Unable to change your password.",
      );
    }
  });

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Account"
        description="Update the profile shown in the sidebar and change the password used to sign in."
      />

      <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
        <Card className="py-0">
          <CardHeader className="border-border-subtle border-b py-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <UserRound className="size-4" aria-hidden="true" />
              Profile
            </CardTitle>
            <CardDescription>
              Your name appears in the sidebar and on activity records.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-5">
            <form
              onSubmit={onSubmitProfile}
              className="flex flex-col gap-4"
              noValidate
            >
              {profileSaved ? (
                <SuccessAlert
                  message="Profile updated."
                  onDismiss={() => setProfileSaved(false)}
                />
              ) : null}

              {profileError ? (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>{profileError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="account-email">Email</Label>
                <Input id="account-email" value={user.email} disabled readOnly />
                <p className="text-muted-foreground text-xs">
                  The sign-in email cannot be changed in the app.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="account-name">Name</Label>
                <Input
                  id="account-name"
                  autoComplete="name"
                  maxLength={100}
                  aria-invalid={Boolean(profileForm.formState.errors.name)}
                  aria-describedby={
                    profileForm.formState.errors.name
                      ? NAME_ERROR_ID
                      : undefined
                  }
                  disabled={profileForm.formState.isSubmitting}
                  {...profileForm.register("name")}
                />
                <FieldError
                  id={NAME_ERROR_ID}
                  message={profileForm.formState.errors.name?.message}
                />
              </div>

              <Button
                type="submit"
                className="self-start"
                disabled={profileForm.formState.isSubmitting}
              >
                {profileForm.formState.isSubmitting ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : null}
                {profileForm.formState.isSubmitting ? "Saving…" : "Save profile"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card className="py-0">
          <CardHeader className="border-border-subtle border-b py-5">
            <CardTitle className="flex items-center gap-2 text-base">
              <KeyRound className="size-4" aria-hidden="true" />
              Password
            </CardTitle>
            <CardDescription>
              Use at least 8 characters. You stay signed in after changing it.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-5">
            <form
              onSubmit={onSubmitPassword}
              className="flex flex-col gap-4"
              noValidate
            >
              {passwordSaved ? (
                <SuccessAlert
                  message="Password updated."
                  onDismiss={() => setPasswordSaved(false)}
                />
              ) : null}

              {passwordError ? (
                <Alert variant="destructive">
                  <AlertCircle aria-hidden="true" />
                  <AlertDescription>{passwordError}</AlertDescription>
                </Alert>
              ) : null}

              <div className="flex flex-col gap-2">
                <Label htmlFor="account-current-password">
                  Current password
                </Label>
                <Input
                  id="account-current-password"
                  type="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(
                    passwordForm.formState.errors.currentPassword,
                  )}
                  aria-describedby={
                    passwordForm.formState.errors.currentPassword
                      ? CURRENT_PASSWORD_ERROR_ID
                      : undefined
                  }
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("currentPassword")}
                />
                <FieldError
                  id={CURRENT_PASSWORD_ERROR_ID}
                  message={
                    passwordForm.formState.errors.currentPassword?.message
                  }
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="account-new-password">New password</Label>
                <Input
                  id="account-new-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(
                    passwordForm.formState.errors.newPassword,
                  )}
                  aria-describedby={
                    passwordForm.formState.errors.newPassword
                      ? NEW_PASSWORD_ERROR_ID
                      : undefined
                  }
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("newPassword")}
                />
                <FieldError
                  id={NEW_PASSWORD_ERROR_ID}
                  message={passwordForm.formState.errors.newPassword?.message}
                />
              </div>

              <div className="flex flex-col gap-2">
                <Label htmlFor="account-confirm-password">
                  Confirm new password
                </Label>
                <Input
                  id="account-confirm-password"
                  type="password"
                  autoComplete="new-password"
                  aria-invalid={Boolean(
                    passwordForm.formState.errors.confirmPassword,
                  )}
                  aria-describedby={
                    passwordForm.formState.errors.confirmPassword
                      ? CONFIRM_PASSWORD_ERROR_ID
                      : undefined
                  }
                  disabled={passwordForm.formState.isSubmitting}
                  {...passwordForm.register("confirmPassword")}
                />
                <FieldError
                  id={CONFIRM_PASSWORD_ERROR_ID}
                  message={
                    passwordForm.formState.errors.confirmPassword?.message
                  }
                />
              </div>

              <Button
                type="submit"
                className="self-start"
                disabled={passwordForm.formState.isSubmitting}
              >
                {passwordForm.formState.isSubmitting ? (
                  <LoaderCircle className="animate-spin" aria-hidden="true" />
                ) : null}
                {passwordForm.formState.isSubmitting
                  ? "Updating…"
                  : "Change password"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
