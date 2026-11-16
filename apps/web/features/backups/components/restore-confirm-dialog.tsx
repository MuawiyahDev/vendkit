"use client";

import { AlertCircle, LoaderCircle, TriangleAlert } from "lucide-react";
import { useState } from "react";

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RESTORE_CONFIRMATION_PHRASE } from "../backups.types";
import { BackupProgress } from "./backup-progress";

interface RestoreConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  fileName: string;
  fileMeta: string;
  isSubmitting: boolean;
  uploadProgress?: number;
  error: string | null;
  onConfirm: () => void;
}

export function RestoreConfirmDialog({
  open,
  onOpenChange,
  title,
  description,
  fileName,
  fileMeta,
  isSubmitting,
  uploadProgress = 0,
  error,
  onConfirm,
}: RestoreConfirmDialogProps) {
  const [confirmation, setConfirmation] = useState("");
  const [wasOpen, setWasOpen] = useState(open);

  // Reset the typed phrase when the dialog opens without an effect-driven
  // cascading render.
  if (open !== wasOpen) {
    setWasOpen(open);
    if (open) {
      setConfirmation("");
    }
  }

  const isConfirmed = confirmation === RESTORE_CONFIRMATION_PHRASE;

  return (
    <AlertDialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!isSubmitting) {
          onOpenChange(nextOpen);
        }
      }}
    >
      <AlertDialogContent className="gap-5 sm:max-w-lg">
        <div className="flex items-start gap-4">
          <span className="bg-warning-soft text-warning-soft-foreground ring-warning/15 flex size-10 shrink-0 items-center justify-center rounded-full ring-1 ring-inset">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <AlertDialogHeader className="gap-1.5 text-left">
            <AlertDialogTitle>{title}</AlertDialogTitle>
            <AlertDialogDescription className="leading-relaxed">
              {description}
            </AlertDialogDescription>
          </AlertDialogHeader>
        </div>

        <div className="border-border-subtle bg-surface-muted/60 rounded-lg border px-3.5 py-3">
          <p className="text-foreground truncate text-sm font-medium">
            {fileName}
          </p>
          <p className="text-muted-foreground mt-0.5 text-xs">{fileMeta}</p>
        </div>

        {isSubmitting && uploadProgress > 0 ? (
          <div className="border-border-subtle rounded-lg border p-4">
            <BackupProgress
              label="Uploading backup"
              progress={uploadProgress * 100}
            />
          </div>
        ) : null}

        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription className="leading-relaxed">
            Current products, categories, brands, customers, orders, payments,
            settings and media will be replaced by the contents of this backup.
            Administrator accounts and the backup history are kept. The restore
            runs in a database transaction and is rolled back if it fails.
          </AlertDescription>
        </Alert>

        <div className="flex flex-col gap-2">
          <Label htmlFor="restore-confirmation">
            Type{" "}
            <span className="text-foreground font-mono font-semibold">
              {RESTORE_CONFIRMATION_PHRASE}
            </span>{" "}
            to confirm
          </Label>
          <Input
            id="restore-confirmation"
            value={confirmation}
            autoComplete="off"
            autoCapitalize="none"
            spellCheck={false}
            disabled={isSubmitting}
            onChange={(event) => setConfirmation(event.target.value)}
            aria-invalid={error ? true : undefined}
          />
        </div>

        {error ? (
          <Alert variant="destructive">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        <AlertDialogFooter>
          <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={!isConfirmed || isSubmitting}
            onClick={(event) => {
              event.preventDefault();
              onConfirm();
            }}
          >
            {isSubmitting ? (
              <LoaderCircle className="animate-spin" aria-hidden="true" />
            ) : (
              <TriangleAlert aria-hidden="true" />
            )}
            {isSubmitting ? "Starting restore…" : "Restore backup"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
