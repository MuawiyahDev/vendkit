"use client";

import { AlertCircle, RefreshCw, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";

import { SuccessAlert } from "@/components/shared/success-alert";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ApiError } from "@/lib/api/client";
import { formatDateTime } from "@/lib/format";
import {
  createBackup,
  deleteBackup,
  getBackupOverview,
  getRestoreJob,
  restoreBackup,
  restoreBackupFromFile,
} from "../api/backups-api";
import type {
  BackupListResponse,
  BackupSummary,
  RestoreJobSummary,
} from "../backups.types";
import { formatBytes, findLastCompletedBackup } from "../utils/backups.utils";
import { getSettingsCategoryMeta } from "../../settings/constants/settings-categories";
import { useSettingsData } from "../../settings/components/settings-provider";
import { BackupCreateSection } from "./backup-create-section";
import { BackupHistorySection } from "./backup-history-section";
import { BackupIncludedSection } from "./backup-included-section";
import { BackupRestoreSection } from "./backup-restore-section";
import { DeleteBackupDialog } from "./delete-backup-dialog";
import { RestoreConfirmDialog } from "./restore-confirm-dialog";

type PendingRestore =
  { kind: "file"; file: File } | { kind: "backup"; backup: BackupSummary };

export function BackupsSettings() {
  const { canEdit } = useSettingsData();
  const [overview, setOverview] = useState<BackupListResponse | null>(null);
  const [loadStatus, setLoadStatus] = useState<"loading" | "success" | "error">(
    "loading",
  );
  const [loadError, setLoadError] = useState<string | null>(null);
  const [refreshNonce, setRefreshNonce] = useState(0);
  const [isCreating, setIsCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [trackedRestore, setTrackedRestore] =
    useState<RestoreJobSummary | null>(null);
  const [restoreFailure, setRestoreFailure] = useState<string | null>(null);
  const [restoreCompleted, setRestoreCompleted] = useState(false);
  const [pendingRestore, setPendingRestore] = useState<PendingRestore | null>(
    null,
  );
  const [isStartingRestore, setIsStartingRestore] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [restoreDialogError, setRestoreDialogError] = useState<string | null>(
    null,
  );
  const [deleteTarget, setDeleteTarget] = useState<BackupSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const meta = getSettingsCategoryMeta("backup");
  const Icon = meta.icon;

  const activeBackup = overview?.activeBackup ?? null;
  const activeRestore =
    trackedRestore?.status === "IN_PROGRESS"
      ? trackedRestore
      : (overview?.activeRestore ?? null);
  const lastBackup = overview
    ? findLastCompletedBackup(overview.backups)
    : null;
  const latestFailedRestore =
    !trackedRestore && overview?.latestRestore?.status === "FAILED"
      ? overview.latestRestore
      : null;
  const hasActiveOperation = activeBackup !== null || activeRestore !== null;
  const busy =
    isCreating || isStartingRestore || isDeleting || hasActiveOperation;

  useEffect(() => {
    if (!canEdit) {
      return;
    }

    const controller = new AbortController();
    let cancelled = false;

    void (async () => {
      try {
        const data = await getBackupOverview({ signal: controller.signal });
        if (cancelled) {
          return;
        }
        setOverview(data);
        setLoadStatus("success");
        setLoadError(null);
      } catch (error) {
        if (cancelled || controller.signal.aborted) {
          return;
        }
        setLoadStatus("error");
        setLoadError(
          error instanceof ApiError
            ? error.message
            : "The backup history could not be loaded.",
        );
      }
    })();

    return () => {
      cancelled = true;
      controller.abort();
    };
  }, [canEdit, refreshNonce]);

  useEffect(() => {
    if (!hasActiveOperation) {
      return;
    }

    const timer = window.setInterval(() => {
      setRefreshNonce((nonce) => nonce + 1);
    }, 2000);

    return () => window.clearInterval(timer);
  }, [hasActiveOperation]);

  const trackedRestoreId =
    trackedRestore?.status === "IN_PROGRESS" ? trackedRestore.id : null;

  useEffect(() => {
    if (!trackedRestoreId) {
      return;
    }

    let cancelled = false;
    const timer = window.setInterval(() => {
      void (async () => {
        try {
          const job = await getRestoreJob(trackedRestoreId);
          if (cancelled) {
            return;
          }

          setTrackedRestore(job);
          setRefreshNonce((nonce) => nonce + 1);

          if (job.status === "COMPLETED") {
            setRestoreCompleted(true);
            setRestoreFailure(null);
          } else if (job.status === "FAILED") {
            setRestoreFailure(
              job.errorMessage ??
                "The restore failed. Existing data was left unchanged.",
            );
          }
        } catch (error) {
          if (cancelled) {
            return;
          }
          setRestoreFailure(
            error instanceof ApiError
              ? error.message
              : "The restore status could not be checked.",
          );
        }
      })();
    }, 2000);

    return () => {
      cancelled = true;
      window.clearInterval(timer);
    };
  }, [trackedRestoreId]);

  const pendingFileName = pendingRestore
    ? pendingRestore.kind === "file"
      ? pendingRestore.file.name
      : pendingRestore.backup.fileName
    : "";
  const pendingFileMeta = pendingRestore
    ? pendingRestore.kind === "file"
      ? `${formatBytes(pendingRestore.file.size)} · selected file`
      : `${formatBytes(Number(pendingRestore.backup.sizeBytes))} · created ${formatDateTime(pendingRestore.backup.createdAt)}`
    : "";

  async function handleCreateBackup() {
    if (busy) {
      return;
    }

    setIsCreating(true);
    setCreateError(null);
    setSuccessMessage(null);

    try {
      await createBackup();
      setSuccessMessage(
        "Backup started. It will appear here when it is ready.",
      );
      setRefreshNonce((nonce) => nonce + 1);
    } catch (error) {
      setCreateError(
        error instanceof ApiError
          ? error.message
          : "The backup could not be started.",
      );
    } finally {
      setIsCreating(false);
    }
  }

  function handleSelectFile(file: File) {
    setRestoreDialogError(null);
    setPendingRestore({ kind: "file", file });
  }

  function handleRestoreBackup(backup: BackupSummary) {
    setRestoreDialogError(null);
    setPendingRestore({ kind: "backup", backup });
  }

  function handleDeleteBackup(backup: BackupSummary) {
    setDeleteError(null);
    setDeleteTarget(backup);
  }

  async function handleConfirmRestore() {
    if (!pendingRestore || isStartingRestore) {
      return;
    }

    setIsStartingRestore(true);
    setRestoreDialogError(null);
    setUploadProgress(0);
    setRestoreFailure(null);
    setRestoreCompleted(false);

    try {
      const job =
        pendingRestore.kind === "file"
          ? await restoreBackupFromFile(pendingRestore.file, {
              onProgress: setUploadProgress,
            })
          : await restoreBackup(pendingRestore.backup.id);

      setTrackedRestore(job);
      setPendingRestore(null);
      setSuccessMessage(
        "Restore started. VendKit will report progress below and validate the archive before replacing any data.",
      );
      setRefreshNonce((nonce) => nonce + 1);
    } catch (error) {
      setRestoreDialogError(
        error instanceof ApiError
          ? error.message
          : "The restore could not be started.",
      );
    } finally {
      setIsStartingRestore(false);
      setUploadProgress(0);
    }
  }

  async function handleConfirmDelete() {
    if (!deleteTarget || isDeleting) {
      return;
    }

    setIsDeleting(true);
    setDeleteError(null);

    try {
      await deleteBackup(deleteTarget.id);
      setDeleteTarget(null);
      setSuccessMessage("Backup deleted.");
      setRefreshNonce((nonce) => nonce + 1);
    } catch (error) {
      setDeleteError(
        error instanceof ApiError
          ? error.message
          : "The backup could not be deleted.",
      );
    } finally {
      setIsDeleting(false);
    }
  }

  if (!canEdit) {
    return (
      <Alert className="border-warning/25 bg-warning-soft text-warning-soft-foreground [&>svg]:text-warning-soft-foreground">
        <ShieldCheck aria-hidden="true" />
        <AlertDescription className="text-warning-soft-foreground">
          Backup and restore operations are restricted to administrators.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-start gap-3">
        <span className="bg-primary-soft text-primary-soft-foreground mt-0.5 flex size-9 shrink-0 items-center justify-center rounded-lg">
          <Icon className="size-4.5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <h2 className="text-lg leading-tight font-semibold tracking-tight">
            {meta.title}
          </h2>
          <p className="text-muted-foreground mt-1 max-w-2xl text-sm leading-relaxed">
            {meta.description}
          </p>
        </div>
      </div>

      {successMessage ? (
        <SuccessAlert
          message={successMessage}
          onDismiss={() => setSuccessMessage(null)}
        />
      ) : null}

      {restoreCompleted ? (
        <Alert className="border-success/25 bg-success-soft text-success-soft-foreground [&>svg]:text-success-soft-foreground">
          <ShieldCheck aria-hidden="true" />
          <AlertDescription className="flex flex-col items-start gap-2 text-success-soft-foreground sm:flex-row sm:items-center sm:justify-between">
            <span className="font-medium">
              Restore completed. The database and media files match this backup.
            </span>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => window.location.reload()}
            >
              <RefreshCw aria-hidden="true" />
              Reload dashboard
            </Button>
          </AlertDescription>
        </Alert>
      ) : null}

      {restoreFailure ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>{restoreFailure}</AlertDescription>
        </Alert>
      ) : null}

      {latestFailedRestore ? (
        <Alert variant="destructive">
          <AlertCircle aria-hidden="true" />
          <AlertDescription>
            The most recent restore attempt (
            {formatDateTime(latestFailedRestore.createdAt)}) failed:{" "}
            {latestFailedRestore.errorMessage ??
              "Existing data was left unchanged."}
          </AlertDescription>
        </Alert>
      ) : null}

      {loadStatus === "error" ? (
        <div className="flex flex-col items-start gap-3 rounded-xl border border-destructive/20 bg-destructive-soft/40 p-6">
          <Alert variant="destructive" className="w-full">
            <AlertCircle aria-hidden="true" />
            <AlertDescription>
              {loadError ?? "The backup history could not be loaded."}
            </AlertDescription>
          </Alert>
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setLoadStatus("loading");
              setRefreshNonce((nonce) => nonce + 1);
            }}
          >
            Try again
          </Button>
        </div>
      ) : null}

      {loadStatus === "loading" ? (
        <div className="flex flex-col gap-3 rounded-xl border p-6">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-56" />
          <Skeleton className="h-24 w-full" />
        </div>
      ) : null}

      {loadStatus === "success" && overview ? (
        <>
          <Card className="gap-0 overflow-hidden py-0">
            <BackupCreateSection
              lastBackup={lastBackup}
              activeBackup={activeBackup}
              isCreating={isCreating}
              disabled={busy}
              error={createError}
              onCreate={() => void handleCreateBackup()}
            />
            <BackupRestoreSection
              maxUploadBytes={overview.maxUploadBytes}
              activeRestore={activeRestore}
              disabled={busy}
              onFileSelected={handleSelectFile}
            />
            <BackupIncludedSection
              formatVersion={overview.formatVersion}
              appVersion={overview.appVersion}
            />
          </Card>

          <BackupHistorySection
            backups={overview.backups}
            busy={busy}
            isCreating={isCreating}
            onRestore={handleRestoreBackup}
            onDelete={handleDeleteBackup}
            onRefresh={() => setRefreshNonce((nonce) => nonce + 1)}
            onCreate={() => void handleCreateBackup()}
          />
        </>
      ) : null}

      <RestoreConfirmDialog
        open={pendingRestore !== null}
        onOpenChange={(open) => {
          if (!open) {
            setPendingRestore(null);
            setRestoreDialogError(null);
          }
        }}
        title={
          pendingRestore?.kind === "backup"
            ? "Restore this backup?"
            : "Restore from file?"
        }
        description={
          pendingRestore?.kind === "backup"
            ? "This replaces the current business data with the selected archive."
            : "The selected archive will be uploaded, validated and then restored."
        }
        fileName={pendingFileName}
        fileMeta={pendingFileMeta}
        isSubmitting={isStartingRestore}
        uploadProgress={
          pendingRestore?.kind === "file" ? uploadProgress : undefined
        }
        error={restoreDialogError}
        onConfirm={() => void handleConfirmRestore()}
      />

      {isStartingRestore && pendingRestore?.kind === "file" ? (
        <span className="sr-only" aria-live="polite">
          Uploading backup {Math.round(uploadProgress * 100)} percent
        </span>
      ) : null}

      <DeleteBackupDialog
        backup={deleteTarget}
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
        isDeleting={isDeleting}
        error={deleteError}
        onConfirm={() => void handleConfirmDelete()}
      />
    </div>
  );
}
