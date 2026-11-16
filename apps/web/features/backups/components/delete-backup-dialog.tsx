"use client";

import { AlertCircle, LoaderCircle, Trash2, TriangleAlert } from "lucide-react";

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
import type { BackupSummary } from "../backups.types";
import { formatBytes } from "../utils/backups.utils";

interface DeleteBackupDialogProps {
  backup: BackupSummary | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isDeleting: boolean;
  error: string | null;
  onConfirm: () => void;
}

export function DeleteBackupDialog({
  backup,
  open,
  onOpenChange,
  isDeleting,
  error,
  onConfirm,
}: DeleteBackupDialogProps) {
  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isDeleting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent className="gap-5 sm:max-w-md">
        <div className="flex items-start gap-4">
          <span className="bg-destructive-soft text-destructive-soft-foreground ring-destructive/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>Delete this backup?</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              The archive will be permanently deleted from the server. This
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        {backup ? (
          <div className="border-border-subtle bg-surface-muted/60 rounded-lg border px-3.5 py-3">
            <p className="text-foreground truncate text-sm font-medium">
              {backup.fileName}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {formatBytes(Number(backup.sizeBytes))} ·{" "}
              {backup.status === "FAILED"
                ? "Failed backup"
                : "Completed backup"}
            </p>
          </div>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isDeleting || !backup}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isDeleting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 aria-hidden="true" />
            )}
            {isDeleting ? "Deleting…" : "Delete backup"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
