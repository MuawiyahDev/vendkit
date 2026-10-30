"use client";

import { LoaderCircle, TriangleAlert, CircleDot } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { ProductFormMode } from "./product-form.types";

interface ProductFormActionsProps {
  mode: ProductFormMode;
  isSubmitting: boolean;
  /** True while the form holds unsaved changes. */
  isDirty: boolean;
  /** True when the user asked to cancel a dirty form. */
  confirmDiscard: boolean;
  /** Blocks submission while catalog options are still loading/failing. */
  submitDisabled: boolean;
  onCancel: () => void;
  onKeepEditing: () => void;
  onDiscard: () => void;
}

/**
 * Sticky action bar for the full-page product editor. Sits at the end of
 * the main form column so Create/Save and Cancel stay reachable while
 * scrolling, and doubles as the discard-confirmation prompt when the form
 * is dirty.
 */
export function ProductFormActions({
  mode,
  isSubmitting,
  isDirty,
  confirmDiscard,
  submitDisabled,
  onCancel,
  onKeepEditing,
  onDiscard,
}: ProductFormActionsProps) {
  const createMode = mode === "create";

  if (confirmDiscard) {
    return (
      <div
        role="group"
        aria-label="Discard unsaved changes"
        className="sticky bottom-5 z-20 overflow-hidden rounded-2xl border border-amber-200/60 bg-gradient-to-r from-amber-50/80 to-amber-50/40 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-all duration-300 ease-out animate-in fade-in slide-in-from-bottom-2"
      >
        {/* Top accent line */}
        <div className="h-[3px] w-full bg-gradient-to-r from-amber-300 via-amber-400 to-amber-300" />

        <div className="flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:gap-5">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amber-100 text-amber-600 shadow-sm">
              <TriangleAlert className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="flex flex-col gap-0.5">
              <p className="text-sm font-semibold text-foreground leading-snug">
                Discard unsaved changes?
              </p>
              <p className="text-xs text-muted-foreground leading-snug">
                This cannot be undone.
              </p>
            </div>
          </div>

          <div className="ml-auto flex shrink-0 items-center gap-2.5">
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
              className="shadow-[0_1px_2px_rgba(0,0,0,0.06)] hover:shadow-[0_3px_6px_rgba(220,38,38,0.15)] active:translate-y-px"
            >
              <TriangleAlert aria-hidden="true" className="h-3.5 w-3.5" />
              Discard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="sticky bottom-5 z-20 overflow-hidden rounded-2xl border border-border-subtle/60 bg-card/85 shadow-[0_8px_30px_rgba(0,0,0,0.06),0_2px_8px_rgba(0,0,0,0.04)] backdrop-blur-xl transition-shadow duration-300 hover:shadow-[0_12px_40px_rgba(0,0,0,0.08),0_4px_12px_rgba(0,0,0,0.05)]">
      {/* Subtle top decorative line */}
      <div className="h-[2px] w-full bg-gradient-to-r from-primary/20 via-primary/40 to-primary/20" />

      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
        {/* Left: Status indicator */}
        <div className="flex items-center gap-3 min-w-0">
          {isDirty ? (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-700 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.8)] border border-amber-200/50 transition-all duration-200 hover:bg-amber-100/60"
              aria-live="polite"
            >
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-amber-500" />
              </span>
              You have unsaved changes.
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-2 rounded-full bg-success-soft px-3 py-1.5 text-xs font-medium text-success-soft-foreground shadow-[inset_0_1px_0_0_rgba(255,255,255,0.4)] border border-success-soft/30"
              aria-live="polite"
            >
              <CircleDot className="h-3 w-3" aria-hidden="true" />
              Ready to save
            </span>
          )}
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5 sm:gap-3">
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
            form="product-form"
            disabled={submitDisabled}
            className="relative overflow-hidden shadow-[0_2px_6px_rgba(0,0,0,0.08),0_1px_2px_rgba(0,0,0,0.04)] hover:shadow-[0_4px_10px_rgba(0,0,0,0.12),0_2px_4px_rgba(0,0,0,0.06)] active:translate-y-px active:shadow-[0_1px_2px_rgba(0,0,0,0.06)] transition-all duration-150 disabled:shadow-none"
          >
            <span className="absolute inset-0 bg-gradient-to-r from-primary-hover/10 to-transparent opacity-0 hover:opacity-100 transition-opacity" />
            <span className="relative z-10 inline-flex items-center gap-2">
              {isSubmitting ? (
                <LoaderCircle
                  className="h-4 w-4 animate-spin"
                  aria-hidden="true"
                />
              ) : null}
              {isSubmitting
                ? createMode
                  ? "Adding…"
                  : "Saving…"
                : createMode
                  ? "Add product"
                  : "Save changes"}
            </span>
          </Button>
        </div>
      </div>
    </div>
  );
}
