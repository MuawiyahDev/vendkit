"use client";

import { AlertCircle, CalendarClock, DatabaseBackup } from "lucide-react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { formatDateTime } from "@/lib/format";
import type { BackupSummary } from "../backups.types";
import { formatBytes, totalRecords } from "../utils/backups.utils";
import { SettingsSection } from "../../settings/components/settings-section";
import { BackupProgress } from "./backup-progress";

interface BackupCreateSectionProps {
  lastBackup: BackupSummary | null;
  activeBackup: BackupSummary | null;
  isCreating: boolean;
  disabled: boolean;
  error: string | null;
  onCreate: () => void;
}

export function BackupCreateSection({
  lastBackup,
  activeBackup,
  isCreating,
  disabled,
  error,
  onCreate,
}: BackupCreateSectionProps) {
  return (
    <SettingsSection
      title="Create a backup"
      description="Creates a versioned archive with a consistent database snapshot and every uploaded media file. No environment variables, passwords or account credentials are included."
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="bg-surface-muted text-muted-foreground flex size-9 shrink-0 items-center justify-center rounded-lg">
            <CalendarClock className="size-4" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium">
              {lastBackup
                ? `Last backup ${formatDateTime(lastBackup.createdAt)}`
                : "No completed backup yet"}
            </p>
            <p className="text-muted-foreground mt-0.5 text-xs">
              {lastBackup
                ? `${formatBytes(Number(lastBackup.sizeBytes))} · ${
                    totalRecords(lastBackup.counts)?.toLocaleString() ?? "—"
                  } records`
                : "Create your first backup before making large changes."}
            </p>
          </div>
        </div>

        <Button type="button" onClick={onCreate} disabled={disabled}>
          <DatabaseBackup aria-hidden="true" />
          {isCreating ? "Starting…" : "Create backup"}
        </Button>
      </div>

      {activeBackup ? (
        <div className="border-border-subtle rounded-lg border p-4">
          <BackupProgress
            label="Creating backup"
            progress={activeBackup.progress}
            detail="Reading a consistent database snapshot and archiving media files. Normal dashboard requests continue to work."
          />
        </div>
      ) : null}

      {error ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}
    </SettingsSection>
  );
}
