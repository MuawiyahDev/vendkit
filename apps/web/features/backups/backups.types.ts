export type BackupKind = "MANUAL" | "PRE_RESTORE";
export type BackupStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";
export type RestoreStatus = "IN_PROGRESS" | "COMPLETED" | "FAILED";

export interface BackupCounts {
  [key: string]: number | undefined;
  mediaFiles?: number;
  mediaBytes?: number;
  totalRecords?: number;
}

export interface BackupSummary {
  id: string;
  kind: BackupKind;
  fileName: string;
  sizeBytes: string;
  status: BackupStatus;
  progress: number;
  formatVersion: number;
  appVersion: string;
  counts: BackupCounts | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface RestoreJobSummary {
  id: string;
  status: RestoreStatus;
  progress: number;
  sourceFileName: string;
  sourceBackupId: string | null;
  formatVersion: number | null;
  appVersion: string | null;
  sizeBytes: string | null;
  counts: BackupCounts | null;
  errorMessage: string | null;
  createdAt: string;
  completedAt: string | null;
}

export interface BackupListResponse {
  backups: BackupSummary[];
  activeBackup: BackupSummary | null;
  activeRestore: RestoreJobSummary | null;
  latestRestore: RestoreJobSummary | null;
  formatVersion: number;
  appVersion: string;
  maxUploadBytes: number;
}

export const RESTORE_CONFIRMATION_PHRASE = "RESTORE";
