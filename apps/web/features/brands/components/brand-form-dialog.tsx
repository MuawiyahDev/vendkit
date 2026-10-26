"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, LoaderCircle } from "lucide-react";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";

import { FieldError } from "@/components/shared/field-error";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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

import { createBrand, updateBrand, type Brand } from "../api/brands-api";
import {
  brandFormSchema,
  type BrandFormPayload,
  type BrandFormValues,
} from "../schemas/brands.schemas";

const NAME_ERROR_ID = "brand-form-name-error";
const SLUG_ERROR_ID = "brand-form-slug-error";
const IS_ACTIVE_DESCRIPTION_ID = "brand-form-is-active-description";

function toDefaultValues(brand?: Brand | null): BrandFormValues {
  return {
    name: brand?.name ?? "",
    slug: brand?.slug ?? "",
    isActive: brand?.isActive ?? true,
  };
}

interface BrandFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** When present the dialog edits this brand; otherwise it creates one. */
  brand?: Brand | null;
  onSuccess: (brand: Brand, mode: "create" | "edit") => void;
}

export function BrandFormDialog({
  open,
  onOpenChange,
  brand,
  onSuccess,
}: BrandFormDialogProps) {
  const mode: "create" | "edit" = brand ? "edit" : "create";
  const [serverError, setServerError] = useState<string | null>(null);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const [prevOpen, setPrevOpen] = useState(open);

  // Reset transient state as soon as the dialog opens (render-time
  // adjustment so a previously mounted dialog never shows stale errors).
  if (open !== prevOpen) {
    setPrevOpen(open);
    if (open) {
      setServerError(null);
      setConfirmDiscard(false);
    }
  }

  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<BrandFormValues, unknown, BrandFormPayload>({
    resolver: zodResolver(brandFormSchema),
    defaultValues: toDefaultValues(brand),
  });

  useEffect(() => {
    if (open) {
      reset(toDefaultValues(brand));
    }
  }, [open, brand, reset]);

  function close() {
    setServerError(null);
    setConfirmDiscard(false);
    onOpenChange(false);
  }

  function requestClose() {
    if (isSubmitting) {
      return;
    }
    if (isDirty) {
      setConfirmDiscard(true);
      return;
    }
    close();
  }

  function handleOpenChange(nextOpen: boolean) {
    if (!nextOpen) {
      requestClose();
      return;
    }
    onOpenChange(true);
  }

  async function onSubmit(values: BrandFormPayload) {
    setServerError(null);

    const input = {
      name: values.name,
      isActive: values.isActive,
      ...(values.slug ? { slug: values.slug } : {}),
    };

    try {
      const saved = brand
        ? await updateBrand(brand.id, input)
        : await createBrand(input);
      onSuccess(saved, mode);
    } catch (error) {
      setServerError(
        error instanceof ApiError
          ? error.message
          : "Something went wrong. Please try again.",
      );
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent
        className="gap-0 p-0 sm:max-w-lg"
        closeButtonDisabled={isSubmitting}
        onInteractOutside={(event) => {
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          if (isDirty) {
            event.preventDefault();
            setConfirmDiscard(true);
          }
        }}
        onEscapeKeyDown={(event) => {
          if (isSubmitting) {
            event.preventDefault();
            return;
          }
          if (isDirty) {
            event.preventDefault();
            setConfirmDiscard(true);
          }
        }}
      >
        <DialogHeader className="border-border-subtle border-b px-6 py-5 pr-14 text-left">
          <DialogTitle>
            {mode === "create" ? "Add brand" : "Edit brand"}
          </DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Create a brand to group your products by manufacturer or label."
              : "Update this brand's name, slug, or availability."}
          </DialogDescription>
        </DialogHeader>

        <form
          id="brand-form"
          onSubmit={handleSubmit(onSubmit)}
          noValidate
          className="flex flex-col"
        >
          <div className="flex flex-col gap-5 px-6 py-5">
            {serverError ? (
              <Alert variant="destructive">
                <AlertCircle aria-hidden="true" />
                <AlertDescription>{serverError}</AlertDescription>
              </Alert>
            ) : null}

            <div className="flex flex-col gap-2">
              <Label htmlFor="brand-name">
                Name
                <span className="text-destructive" aria-hidden="true">
                  *
                </span>
              </Label>
              <Input
                id="brand-name"
                placeholder="e.g. Northwind Goods"
                autoComplete="off"
                required
                aria-required="true"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? NAME_ERROR_ID : undefined}
                disabled={isSubmitting}
                {...register("name")}
              />
              <FieldError id={NAME_ERROR_ID} message={errors.name?.message} />
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="brand-slug">
                Slug{" "}
                <span className="text-muted-foreground font-normal">
                  (optional)
                </span>
              </Label>
              <Input
                id="brand-slug"
                placeholder="northwind-goods"
                autoComplete="off"
                spellCheck={false}
                aria-invalid={Boolean(errors.slug)}
                aria-describedby={errors.slug ? SLUG_ERROR_ID : undefined}
                disabled={isSubmitting}
                {...register("slug")}
              />
              <p className="text-muted-foreground text-xs">
                {mode === "create"
                  ? "Leave blank to generate one from the brand name."
                  : "Leave blank to keep the current slug."}
              </p>
              <FieldError id={SLUG_ERROR_ID} message={errors.slug?.message} />
            </div>

            <div className="border-border-subtle bg-surface-muted/50 flex items-start gap-3 rounded-lg border p-3.5">
              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <Checkbox
                    id="brand-is-active"
                    checked={field.value}
                    onCheckedChange={(checked) =>
                      field.onChange(checked === true)
                    }
                    onBlur={field.onBlur}
                    disabled={isSubmitting}
                    aria-describedby={IS_ACTIVE_DESCRIPTION_ID}
                    className="mt-0.5"
                  />
                )}
              />
              <div className="flex flex-col gap-1">
                <Label
                  htmlFor="brand-is-active"
                  className="cursor-pointer leading-snug"
                >
                  Active
                </Label>
                <p
                  id={IS_ACTIVE_DESCRIPTION_ID}
                  className="text-muted-foreground text-xs leading-relaxed"
                >
                  Use this to pause a brand without deleting it. Inactive
                  brands stay in your catalog.
                </p>
              </div>
            </div>
          </div>

          <DialogFooter className="border-border-subtle bg-surface-muted/40 rounded-b-xl border-t px-6 py-4">
            {confirmDiscard ? (
              <div className="flex w-full flex-col gap-2 sm:flex-row sm:items-center">
                <p className="text-muted-foreground mr-auto text-sm">
                  Discard unsaved changes?
                </p>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setConfirmDiscard(false)}
                >
                  Keep editing
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={close}
                >
                  Discard
                </Button>
              </div>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={requestClose}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" form="brand-form" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <LoaderCircle className="animate-spin" aria-hidden="true" />
                  ) : null}
                  {isSubmitting
                    ? mode === "create"
                      ? "Adding…"
                      : "Saving…"
                    : mode === "create"
                      ? "Add brand"
                      : "Save changes"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
