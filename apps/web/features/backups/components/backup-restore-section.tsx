"use client";

import { AlertCircle, HardDriveDownload, Upload } from "lucide-react";
import { useRef } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import type { RestoreJobSummary } from "../backups.types";
import { formatBytes } from "../utils/backups.utils";
import { SettingsSection } from "../../settings/components/settings-section";
import { BackupProgress } from "./backup-progress";

const ACCEPTED_ARCHIVE_TYPES =
  ".tar.gz,.tgz,.gz,application/gzip,application/x-gzip";

interface BackupRestoreSectionProps {
  maxUploadBytes: number;
  activeRestore: RestoreJobSummary | null;
  disabled: boolean;
  onFileSelected: (file: File) => void;
}

export function BackupRestoreSection({
  maxUploadBytes,
  activeRestore,
  disabled,
  onFileSelected,
}: BackupRestoreSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <SettingsSection
      title="Restore"
      description="Restore replaces the current business dataset with a backup archive. The archive is validated, checksums are verified and the database is replaced in a single transaction."
    >
      <Alert className="border-warning/25 bg-warning-soft text-warning-soft-foreground [&>svg]:text-warning-soft-foreground">
        <AlertCircle aria-hidden="true" />
        <AlertDescription className="text-warning-soft-foreground leading-relaxed">
          Restoring overwrites current products, customers, orders, payments,
          settings and media. Only restore a backup you trust. A safety backup
          is created first when the server allows it.
        </AlertDescription>
      </Alert>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-surface-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <Upload className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">Restore from a file</p>
            <p className="text-muted-foreground mt-0.5 max-w-md text-xs leading-relaxed">
              Select a VendKit backup archive ({formatBytes(maxUploadBytes)}{" "}
              maximum).
            </p>
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept={ACCEPTED_ARCHIVE_TYPES}
          className="sr-only"
          aria-label="Select a backup archive"
          onChange={(event) => {
            const file = event.target.files?.[0];
            if (file) {
              onFileSelected(file);
            }
            event.target.value = "";
          }}
        />
        <Button
          type="button"
          variant="destructive-outline"
          disabled={disabled}
          onClick={() => fileInputRef.current?.click()}
        >
          <HardDriveDownload aria-hidden="true" />
          Choose backup file
        </Button>
      </div>

      {activeRestore ? (
        <div className="border-border-subtle rounded-lg border p-4">
          <BackupProgress
            label="Restoring backup"
            progress={activeRestore.progress}
            detail={
              activeRestore.sourceFileName
                ? `Source: ${activeRestore.sourceFileName}. The database transaction is atomic; a failure rolls everything back.`
                : undefined
            }
          />
        </div>
      ) : null}
    </SettingsSection>
  );
}
