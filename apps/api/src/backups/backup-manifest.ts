import {
  BACKUP_DATA_ENTRY,
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BACKUP_MANIFEST_ENTRY,
  BACKUP_MEDIA_PREFIX,
  type BackupCounts,
} from './backups.constants.js';
import type { BackupArchiveFile, BackupManifest } from './backups.types.js';
import {
  BackupValidationError,
  isPlainObject,
  parseJsonBuffer,
  toDictionary,
} from './backups.utils.js';

export function parseManifest(buffer: Buffer): BackupManifest {
  const value = toDictionary(parseJsonBuffer(buffer, 'Backup manifest'));

  if (value.format !== BACKUP_FORMAT) {
    throw new BackupValidationError(
      'This file is not a VendKit backup archive',
    );
  }

  if (value.formatVersion !== BACKUP_FORMAT_VERSION) {
    throw new BackupValidationError(
      `Backup format version ${String(value.formatVersion)} is not supported by this VendKit version.`,
    );
  }

  if (typeof value.appVersion !== 'string' || value.appVersion.length > 50) {
    throw new BackupValidationError(
      'Backup manifest has an invalid app version',
    );
  }

  if (
    typeof value.createdAt !== 'string' ||
    !Number.isFinite(Date.parse(value.createdAt))
  ) {
    throw new BackupValidationError(
      'Backup manifest has an invalid creation date',
    );
  }

  if (
    !isPlainObject(value.database) ||
    value.database.provider !== 'postgresql'
  ) {
    throw new BackupValidationError(
      'Backup manifest has an invalid database type',
    );
  }

  if (!Array.isArray(value.files)) {
    throw new BackupValidationError('Backup manifest has no file list');
  }

  const files: BackupArchiveFile[] = value.files.map((entry) => {
    if (!isPlainObject(entry)) {
      throw new BackupValidationError(
        'Backup manifest has a malformed file entry',
      );
    }

    const { path, size, sha256: digest } = entry;
    if (
      typeof path !== 'string' ||
      typeof size !== 'number' ||
      !Number.isInteger(size) ||
      size < 0 ||
      typeof digest !== 'string' ||
      !/^[0-9a-f]{64}$/.test(digest)
    ) {
      throw new BackupValidationError(
        'Backup manifest has a malformed file entry',
      );
    }

    return { path, size, sha256: digest };
  });

  return {
    format: BACKUP_FORMAT,
    formatVersion: BACKUP_FORMAT_VERSION,
    appVersion: value.appVersion,
    createdAt: value.createdAt,
    database: { provider: 'postgresql' },
    included: (isPlainObject(value.included)
      ? value.included
      : {}) as BackupCounts,
    files,
  };
}

export function verifyManifestFiles(
  manifest: BackupManifest,
  entries: ReadonlyMap<string, BackupArchiveFile>,
): void {
  const declared = new Set<string>();

  for (const file of manifest.files) {
    if (declared.has(file.path)) {
      throw new BackupValidationError('Backup manifest lists a file twice');
    }
    declared.add(file.path);

    if (
      file.path !== BACKUP_DATA_ENTRY &&
      !file.path.startsWith(BACKUP_MEDIA_PREFIX)
    ) {
      throw new BackupValidationError(
        'Backup manifest references an unsupported file path',
      );
    }

    const actual = entries.get(file.path);
    if (!actual || actual.size !== file.size || actual.sha256 !== file.sha256) {
      throw new BackupValidationError(
        'Backup archive contents do not match the manifest checksums',
      );
    }
  }

  for (const path of entries.keys()) {
    if (path !== BACKUP_MANIFEST_ENTRY && !declared.has(path)) {
      throw new BackupValidationError(
        'Backup archive contains files that are not listed in the manifest',
      );
    }
  }
}
