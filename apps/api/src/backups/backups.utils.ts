import { createHash, randomUUID } from 'node:crypto';
import { basename } from 'node:path';
import type { BackupKind } from '@repo/database';
import { BACKUP_ARCHIVE_EXTENSION } from './backups.constants.js';

const MAX_FILENAME_LENGTH = 200;

export class BackupValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BackupValidationError';
  }
}

export class BackupOperationError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown,
  ) {
    super(message);
    this.name = 'BackupOperationError';
  }
}

export function sha256(data: Buffer | Uint8Array): string {
  return createHash('sha256').update(data).digest('hex');
}

export function createArchiveIdentity(
  kind: BackupKind,
  createdAt: Date = new Date(),
): { fileName: string; storageKey: string } {
  const stamp = createdAt
    .toISOString()
    .replace(/[-:]/g, '')
    .replace(/\.\d{3}Z$/, 'Z');
  const prefix = kind === 'PRE_RESTORE' ? 'pre-restore-' : '';
  const baseName = `vendkit-${prefix}backup-${stamp}`;

  return {
    fileName: `${baseName}.${BACKUP_ARCHIVE_EXTENSION}`,
    storageKey: `${randomUUID()}.${BACKUP_ARCHIVE_EXTENSION}`,
  };
}

export function sanitizeOriginalFileName(
  originalName: string | undefined,
): string {
  const baseName = basename((originalName ?? '').split('\\').pop() ?? '')
    // oxlint-disable-next-line no-control-regex
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .replace(/[\\/]/g, '')
    .trim();

  if (!baseName) {
    return 'backup.tar.gz';
  }

  return baseName.slice(0, MAX_FILENAME_LENGTH);
}

export function toDictionary(value: unknown): Record<string, unknown> {
  if (!isPlainObject(value)) {
    throw new BackupValidationError('Backup data is not a valid object');
  }
  return value;
}

export function isPlainObject(
  value: unknown,
): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isMissingFileError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: unknown }).code === 'ENOENT'
  );
}

export function parseJsonBuffer(buffer: Buffer, label: string): unknown {
  try {
    return JSON.parse(buffer.toString('utf8')) as unknown;
  } catch {
    throw new BackupValidationError(`${label} is not valid JSON`);
  }
}
