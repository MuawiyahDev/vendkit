import { ConfigService } from '@nestjs/config';

export const BACKUP_FORMAT = 'vendkit-backup';
export const BACKUP_FORMAT_VERSION = 1;
export const BACKUP_ARCHIVE_EXTENSION = 'tar.gz';
export const BACKUP_MANIFEST_ENTRY = 'manifest.json';
export const BACKUP_DATA_ENTRY = 'data.json';
export const BACKUP_MEDIA_PREFIX = 'media/';

export const DEFAULT_BACKUP_STORAGE_DIR = 'uploads/backups';
export const DEFAULT_BACKUP_MAX_FILE_SIZE = 1024 * 1024 * 1024;
export const DEFAULT_BACKUP_MAX_EXTRACTED_SIZE = 2 * 1024 * 1024 * 1024;
export const DEFAULT_BACKUP_MAX_ARCHIVE_ENTRIES = 100_000;
export const DEFAULT_BACKUP_MAX_RECORDS = 1_000_000;
export const DEFAULT_BACKUP_MAX_DATA_BYTES = 512 * 1024 * 1024;
export const DEFAULT_BACKUP_MAX_MANIFEST_BYTES = 1024 * 1024;
export const DEFAULT_RESTORE_TRANSACTION_TIMEOUT_MS = 10 * 60 * 1000;
export const DEFAULT_BACKUP_SAFETY_SNAPSHOT = true;

export const DEFAULT_APP_VERSION = '0.0.1';

export const BACKUP_HISTORY_LIMIT = 50;

/**
 * Tables that make up the portable business dataset. Order matters: records
 * are inserted in this order during a restore so foreign keys always point at
 * rows that already exist. Deliberately excluded: User, RefreshToken, Backup
 * and RestoreJob (identity, sessions and backup history are installation
 * specific and must survive a restore).
 */
export const BACKUP_TABLE_NAMES = [
  'categories',
  'brands',
  'images',
  'products',
  'productImages',
  'customers',
  'orders',
  'orderItems',
  'orderPayments',
  'stockMovements',
  'businessProfileSettings',
  'invoiceSettings',
  'regionalSettings',
  'taxSettings',
  'orderSettings',
  'paymentSettings',
  'shippingSettings',
  'notificationSettings',
  'documentSequences',
] as const;

export type BackupTableName = (typeof BACKUP_TABLE_NAMES)[number];

/** Child-first order used inside the restore transaction. */
export const BACKUP_DELETE_ORDER: readonly BackupTableName[] = [
  'stockMovements',
  'orderPayments',
  'orderItems',
  'productImages',
  'orders',
  'products',
  'customers',
  'businessProfileSettings',
  'invoiceSettings',
  'regionalSettings',
  'taxSettings',
  'orderSettings',
  'paymentSettings',
  'shippingSettings',
  'notificationSettings',
  'images',
  'categories',
  'brands',
  'documentSequences',
];

export type BackupCounts = Partial<Record<BackupTableName, number>> & {
  mediaFiles?: number;
  mediaBytes?: number;
  totalRecords?: number;
};

export const BACKUP_STORAGE_KEY_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.tar\.gz$/i;

export const MEDIA_STORAGE_KEY_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function resolveAppVersion(config: ConfigService): string {
  const configured = config.get<string>('APP_VERSION')?.trim();
  return (
    configured && configured.length > 0 ? configured : DEFAULT_APP_VERSION
  ).slice(0, 50);
}

export function resolveBackupStorageDir(config: ConfigService): string {
  const configured = config.get<string>('BACKUP_STORAGE_DIR')?.trim();
  return configured && configured.length > 0
    ? configured
    : DEFAULT_BACKUP_STORAGE_DIR;
}

export function resolveBackupMaxFileSize(config: ConfigService): number {
  return resolvePositiveInteger(
    config,
    'BACKUP_MAX_FILE_SIZE',
    DEFAULT_BACKUP_MAX_FILE_SIZE,
  );
}

export function resolveBackupMaxExtractedSize(config: ConfigService): number {
  return resolvePositiveInteger(
    config,
    'BACKUP_MAX_EXTRACTED_SIZE',
    DEFAULT_BACKUP_MAX_EXTRACTED_SIZE,
  );
}

export function resolveRestoreTransactionTimeout(
  config: ConfigService,
): number {
  return resolvePositiveInteger(
    config,
    'BACKUP_RESTORE_TRANSACTION_TIMEOUT_MS',
    DEFAULT_RESTORE_TRANSACTION_TIMEOUT_MS,
  );
}

export function resolveBackupSafetySnapshot(config: ConfigService): boolean {
  const raw = config.get<string>('BACKUP_SAFETY_SNAPSHOT');

  if (raw === undefined || raw.trim() === '') {
    return DEFAULT_BACKUP_SAFETY_SNAPSHOT;
  }

  const normalized = raw.trim().toLowerCase();
  if (['true', '1', 'yes', 'on'].includes(normalized)) {
    return true;
  }
  if (['false', '0', 'no', 'off'].includes(normalized)) {
    return false;
  }

  throw new Error(
    `Invalid BACKUP_SAFETY_SNAPSHOT value: "${raw}". Expected true or false.`,
  );
}

function resolvePositiveInteger(
  config: ConfigService,
  key: string,
  fallback: number,
): number {
  const raw = config.get<string>(key);

  if (raw === undefined || raw.trim() === '') {
    return fallback;
  }

  const parsed = Number(raw);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(
      `Invalid ${key} value: "${raw}". Expected a positive integer.`,
    );
  }

  return parsed;
}
