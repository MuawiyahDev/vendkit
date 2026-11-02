"use client";

import { CircleDot, LoaderCircle, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface OrderFormActionsProps {
  mode: "create" | "edit";
  isSubmitting: boolean;
  /** True while the form holds unsaved changes. */
  isDirty: boolean;
  /** True when the user asked to cancel a dirty form. */
  confirmDiscard: boolean;
  onCancel: () => void;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * Sticky action bar for the full-page order editor. Doubles as the
 * discard-confirmation prompt when the form is dirty.
 */
export function OrderFormActions({
  mode,
  isSubmitting,
  isDirty,
  confirmDiscard,
  onCancel,
  onKeepEditing,
  onDiscard,
}: OrderFormActionsProps) {
  const createMode = mode === "create";

  if (confirmDiscard) {
    return (
      <div
        role="group"
        aria-label="Discard unsaved changes"
        className="border-warning/40 bg-warning-soft/60 sticky bottom-5 z-20 flex flex-col gap-3 rounded-xl border px-5 py-4 shadow-lg sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex items-center gap-3">
          <span className="bg-warning-soft text-warning-soft-foreground ring-warning/20 flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-4" aria-hidden="true" />
          </span>
          <div className="flex flex-col gap-0.5">
            <p className="text-sm font-semibold">Discard unsaved changes?</p>
            <p className="text-muted-foreground text-xs">
              This cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2.5">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onKeepEditing}
            disabled={isSubmitting}
          >
            Keep editing
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={onDiscard}
            disabled={isSubmitting}
          >
            <TriangleAlert aria-hidden="true" />
            Discard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="border-border-subtle bg-card/90 sticky bottom-5 z-20 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-5 py-4 shadow-lg backdrop-blur">
      <span
        aria-live="polite"
        className={cn(
          "inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium",
          isDirty
            ? "border-warning/30 bg-warning-soft text-warning-soft-foreground"
            : "border-success-soft/30 bg-success-soft text-success-soft-foreground",
        )}
      >
        {isDirty ? (
          <>
            <span className="relative flex size-1.5">
              <span className="absolute inline-flex size-full animate-ping rounded-full bg-warning opacity-75" />
              <span className="relative inline-flex size-1.5 rounded-full bg-warning" />
            </span>
            You have unsaved changes.
          </>
        ) : (
          <>
            <CircleDot className="size-3" aria-hidden="true" />
            {createMode ? "Ready to create" : "Ready to save"}
          </>
        )}
      </span>

      <div className="flex items-center gap-2.5">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          form="order-editor-form"
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <LoaderCircle className="animate-spin" aria-hidden="true" />
          ) : null}
          {isSubmitting
            ? createMode
              ? "Creating…"
              : "Saving…"
            : createMode
              ? "Create order"
              : "Save changes"}
        </Button>
      </div>
    </div>
  );
}
