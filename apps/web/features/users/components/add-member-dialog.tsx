"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle, UserPlus } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { NativeSelect } from "@/components/shared/native-select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ApiError } from "@/lib/api/client";

import { createUser, type TeamUser } from "../users-api";
import {
  addMemberSchema,
  type AddMemberValues,
} from "../schemas/users.schemas";

const NAME_ERROR_ID = "team-member-name-error";
const EMAIL_ERROR_ID = "team-member-email-error";
const PASSWORD_ERROR_ID = "team-member-password-error";

const ROLE_OPTIONS = [
  { value: "USER", label: "Member" },
  { value: "ADMIN", label: "Administrator" },
];

interface AddMemberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: (user: TeamUser) => void;
}

export function AddMemberDialog({
  open,
  onOpenChange,
  onCreated,
}: AddMemberDialogProps) {
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: { name: "", email: "", password: "", role: "USER" },
  });

  const onSubmit = handleSubmit(async (values) => {
    setServerError(null);

    try {
      const user = await createUser({
        email: values.email,
        password: values.password,
        ...(values.name ? { name: values.name } : {}),
        role: values.role,
      });
      reset();
      onOpenChange(false);
      onCreated(user);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Unable to create this member.",
      );
    }
  });

  function handleOpenChange(next: boolean) {
    if (!next) {
      reset();
      setServerError(null);
    }
    onOpenChange(next);
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add team member</DialogTitle>
          <DialogDescription>
            Create a separate sign-in for someone who helps run the business.
            Share the password with them and ask them to change it under
            Account.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit} className="flex flex-col gap-4" noValidate>
          {serverError ? (
            <Alert variant="destructive">
              <AlertCircle aria-hidden="true" />
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          ) : null}

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-member-name">Name (optional)</Label>
            <Input
              id="team-member-name"
              autoComplete="name"
              maxLength={100}
              aria-invalid={Boolean(errors.name)}
              aria-describedby={errors.name ? NAME_ERROR_ID : undefined}
              disabled={isSubmitting}
              {...register("name")}
            />
            <FieldError id={NAME_ERROR_ID} message={errors.name?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-member-email">Email</Label>
            <Input
              id="team-member-email"
              type="email"
              autoComplete="email"
              maxLength={254}
              aria-invalid={Boolean(errors.email)}
              aria-describedby={errors.email ? EMAIL_ERROR_ID : undefined}
              disabled={isSubmitting}
              {...register("email")}
            />
            <FieldError id={EMAIL_ERROR_ID} message={errors.email?.message} />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-member-password">Initial password</Label>
            <Input
              id="team-member-password"
              type="password"
              autoComplete="new-password"
              aria-invalid={Boolean(errors.password)}
              aria-describedby={
                errors.password ? PASSWORD_ERROR_ID : undefined
              }
              disabled={isSubmitting}
              {...register("password")}
            />
            <FieldError
              id={PASSWORD_ERROR_ID}
              message={errors.password?.message}
            />
          </div>

          <div className="flex flex-col gap-2">
            <Label htmlFor="team-member-role">Role</Label>
            <NativeSelect
              id="team-member-role"
              ariaLabel="Role"
              options={ROLE_OPTIONS}
              disabled={isSubmitting}
              {...register("role")}
            />
            <p className="text-muted-foreground text-xs leading-relaxed">
              Administrators can change settings, manage backups, and reset
              other passwords.
            </p>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <LoaderCircle className="animate-spin" aria-hidden="true" />
              ) : (
                <UserPlus aria-hidden="true" />
              )}
              {isSubmitting ? "Creating…" : "Create member"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
