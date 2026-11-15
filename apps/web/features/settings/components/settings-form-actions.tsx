"use client";

import { LoaderCircle, RotateCcw } from "lucide-react";

import { Button } from "@/components/ui/button";

interface SettingsFormActionsProps {
  formId: string;
  isDirty: boolean;
  isSubmitting: boolean;
  isRestoring: boolean;
  readOnly: boolean;
  onDiscard: () => void;
  onRestoreDefaults: () => void;
}

/**
 * Sticky save bar shared by every settings form. Save stays disabled until
 * the form is dirty, and the bar always communicates whether changes are
 * pending.
 */
export function SettingsFormActions({
  formId,
  isDirty,
  isSubmitting,
  isRestoring,
  readOnly,
  onDiscard,
  onRestoreDefaults,
}: SettingsFormActionsProps) {
  if (readOnly) {
    return null;
  }

  const busy = isSubmitting || isRestoring;

  return (
    <div className="bg-card/95 supports-[backdrop-filter]:bg-card/85 sticky bottom-4 z-20 rounded-xl border border-border-subtle shadow-lg backdrop-blur">
      <div className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div
          className="flex items-center gap-2 text-xs"
          aria-live="polite"
        >
          {isDirty ? (
            <>
              <span className="size-1.5 rounded-full bg-amber-500" />
              <span className="font-medium text-amber-700 dark:text-amber-400">
                Unsaved changes
              </span>
            </>
          ) : (
            <>
              <span className="bg-success size-1.5 rounded-full" />
              <span className="text-muted-foreground">All changes saved</span>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onDiscard}
            disabled={!isDirty || busy}
          >
            Discard
          </Button>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={onRestoreDefaults}
            disabled={busy}
          >
            <RotateCcw aria-hidden="true" />
            Restore defaults
          </Button>
          <Button
            type="submit"
            form={formId}
            size="sm"
            disabled={!isDirty || busy}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : null}
            {isSubmitting ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </div>
    </div>
  );
}
