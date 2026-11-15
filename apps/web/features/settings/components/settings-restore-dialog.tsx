"use client";

import { AlertCircle, LoaderCircle, RotateCcw } from "lucide-react";

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface SettingsRestoreDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  isRestoring: boolean;
  error: string | null;
  onConfirm: () => void;
}

/**
 * Explicit confirmation before restoring a category to backend defaults.
 * Restoring is intentionally a separate action from discarding unsaved edits.
 */
export function SettingsRestoreDialog({
  open,
  onOpenChange,
  title,
  description,
  isRestoring,
  error,
  onConfirm,
}: SettingsRestoreDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isRestoring) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent className="gap-5 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-warning-soft text-warning-soft-foreground ring-warning/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <RotateCcw className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isRestoring}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isRestoring}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isRestoring ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <RotateCcw aria-hidden="true" />
            )}
            {isRestoring ? "Restoring…" : "Restore defaults"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
