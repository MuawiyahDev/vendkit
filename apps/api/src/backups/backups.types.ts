import type { BackupKind, BackupStatus, RestoreStatus } from '@repo/database';
import type { BackupCounts, BackupTableName } from './backups.constants.js';

export interface BackupArchiveFile {
  /** Path inside the archive, using forward slashes only. */
  path: string;
  size: number;
  sha256: string;
}

export interface BackupManifest {
  format: 'vendkit-backup';
  formatVersion: number;
  appVersion: string;
  createdAt: string;
  database: {
    provider: 'postgresql';
  };
  included: BackupCounts;
  files: BackupArchiveFile[];
}

export interface BackupData {
  tables: Record<BackupTableName, Array<Record<string, unknown>>>;
}

export interface ExtractedMediaFile {
  storageKey: string;
  path: string;
  size: number;
  sha256: string;
}

export interface ValidatedBackup {
  manifest: BackupManifest;
  data: BackupData;
  media: ExtractedMediaFile[];
  stagingDirectory: string;
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

export interface BackupDownload {
  filePath: string;
  fileName: string;
  sizeBytes: number;
}

export interface ArchiveBuildResult {
  filePath: string;
  sizeBytes: number;
  counts: BackupCounts;
}

export interface RestoreUploadInput {
  filePath: string;
  originalName: string;
  sizeBytes: number;
  userId: string;
  sourceBackupId?: string;
}
