import type {
  Backup as BackupRecord,
  RestoreJob as RestoreJobRecord,
} from '@repo/database';
import type { BackupCounts } from './backups.constants.js';
import type { BackupSummary, RestoreJobSummary } from './backups.types.js';
import { isPlainObject } from './backups.utils.js';

export function toBackupSummary(record: BackupRecord): BackupSummary {
  return {
    id: record.id,
    kind: record.kind,
    fileName: record.fileName,
    sizeBytes: record.sizeBytes.toString(),
    status: record.status,
    progress: record.progress,
    formatVersion: record.formatVersion,
    appVersion: record.appVersion,
    counts: toCounts(record.dataCounts),
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
  };
}

export function toRestoreJobSummary(
  record: RestoreJobRecord,
): RestoreJobSummary {
  return {
    id: record.id,
    status: record.status,
    progress: record.progress,
    sourceFileName: record.sourceFileName,
    sourceBackupId: record.sourceBackupId,
    formatVersion: record.formatVersion,
    appVersion: record.appVersion,
    sizeBytes: record.sizeBytes?.toString() ?? null,
    counts: toCounts(record.dataCounts),
    errorMessage: record.errorMessage,
    createdAt: record.createdAt.toISOString(),
    completedAt: record.completedAt?.toISOString() ?? null,
  };
}

function toCounts(value: unknown): BackupCounts | null {
  if (!isPlainObject(value)) {
    return null;
  }

  const counts: BackupCounts = {};

  for (const [key, entry] of Object.entries(value)) {
    if (typeof entry === 'number' && Number.isFinite(entry)) {
      (counts as Record<string, number>)[key] = entry;
    }
  }

  return counts;
}
