import { createHash } from 'node:crypto';
import { createReadStream, createWriteStream } from 'node:fs';
import { mkdir, open, rename, rm, stat } from 'node:fs/promises';
import { join } from 'node:path';
import { createGunzip, createGzip } from 'node:zlib';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Image } from '@repo/database';
import {
  BACKUP_DATA_ENTRY,
  BACKUP_FORMAT,
  BACKUP_FORMAT_VERSION,
  BACKUP_MANIFEST_ENTRY,
  BACKUP_MEDIA_PREFIX,
  BACKUP_TABLE_NAMES,
  resolveAppVersion,
  DEFAULT_BACKUP_MAX_ARCHIVE_ENTRIES,
  DEFAULT_BACKUP_MAX_DATA_BYTES,
  DEFAULT_BACKUP_MAX_MANIFEST_BYTES,
  DEFAULT_BACKUP_MAX_RECORDS,
  MEDIA_STORAGE_KEY_PATTERN,
  type BackupCounts,
} from './backups.constants.js';
import type {
  ArchiveBuildResult,
  BackupArchiveFile,
  BackupData,
  BackupManifest,
  ExtractedMediaFile,
  ValidatedBackup,
} from './backups.types.js';
import {
  BackupOperationError,
  BackupValidationError,
  parseJsonBuffer,
  sha256,
} from './backups.utils.js';
import {
  validateBackupData,
  validateBackupRelations,
} from './backup-data.validator.js';
import { parseManifest, verifyManifestFiles } from './backup-manifest.js';
import { TarReader, TarWriter } from './tar-archive.js';
import { IMAGE_STORAGE, type ImageStorage } from '../storage/image-storage.js';

type BackupImage = Pick<
  Image,
  'id' | 'storageKey' | 'size' | 'mimeType' | 'createdAt'
>;

@Injectable()
export class BackupArchiveService {
  private readonly appVersion: string;

  constructor(
    @Inject(IMAGE_STORAGE) private readonly storage: ImageStorage,
    config: ConfigService,
  ) {
    this.appVersion = resolveAppVersion(config);
  }

  async createArchive(
    targetPath: string,
    data: BackupData,
    images: BackupImage[],
    counts: BackupCounts,
    maxExtractedBytes: number,
    onProgress: (progress: number) => Promise<void>,
  ): Promise<ArchiveBuildResult> {
    const temporaryPath = `${targetPath}.part`;
    const createdAt = new Date();
    const dataBuffer = Buffer.from(JSON.stringify(data), 'utf8');

    if (dataBuffer.length > DEFAULT_BACKUP_MAX_DATA_BYTES) {
      throw new BackupOperationError(
        'The database data exceeds the maximum size supported by the restore format.',
      );
    }
    if ((counts.totalRecords ?? 0) > DEFAULT_BACKUP_MAX_RECORDS) {
      throw new BackupOperationError(
        'The database contains more records than the restore format supports.',
      );
    }
    if (images.length + 2 > DEFAULT_BACKUP_MAX_ARCHIVE_ENTRIES) {
      throw new BackupOperationError(
        'There are too many media files for the restore format.',
      );
    }

    const expectedMediaBytes = images.reduce(
      (total, image) => total + image.size,
      0,
    );
    if (dataBuffer.length + expectedMediaBytes > maxExtractedBytes) {
      throw new BackupOperationError(
        'The backup would exceed the configured uncompressed size limit and could not be restored.',
      );
    }

    const files: BackupArchiveFile[] = [
      {
        path: BACKUP_DATA_ENTRY,
        size: dataBuffer.length,
        sha256: sha256(dataBuffer),
      },
    ];

    let mediaFiles = 0;
    let mediaBytes = 0;

    const output = createWriteStream(temporaryPath, { mode: 0o600 });
    const gzip = createGzip({ level: 6 });
    gzip.pipe(output);

    try {
      const writer = new TarWriter(gzip);

      await writer.addFile(BACKUP_DATA_ENTRY, dataBuffer, createdAt);
      await onProgress(40);

      for (const [index, image] of images.entries()) {
        const entryPath = `${BACKUP_MEDIA_PREFIX}${image.storageKey}`;
        const buffer = await this.readMediaFile(image);

        const entry: BackupArchiveFile = {
          path: entryPath,
          size: buffer.length,
          sha256: sha256(buffer),
        };
        files.push(entry);

        await writer.addFile(entryPath, buffer, image.createdAt);
        mediaFiles += 1;
        mediaBytes += buffer.length;

        const fraction = images.length === 0 ? 1 : (index + 1) / images.length;
        await onProgress(40 + Math.round(fraction * 50));
      }

      const manifest: BackupManifest = {
        format: BACKUP_FORMAT,
        formatVersion: BACKUP_FORMAT_VERSION,
        appVersion: this.appVersion,
        createdAt: createdAt.toISOString(),
        database: { provider: 'postgresql' },
        included: {
          ...counts,
          mediaFiles,
          mediaBytes,
        },
        files,
      };
      const manifestBuffer = Buffer.from(JSON.stringify(manifest), 'utf8');

      if (manifestBuffer.length > DEFAULT_BACKUP_MAX_MANIFEST_BYTES) {
        throw new BackupOperationError(
          'The backup manifest exceeds the supported size.',
        );
      }
      if (
        dataBuffer.length + mediaBytes + manifestBuffer.length >
        maxExtractedBytes
      ) {
        throw new BackupOperationError(
          'The backup would exceed the configured uncompressed size limit and could not be restored.',
        );
      }

      await writer.addFile(BACKUP_MANIFEST_ENTRY, manifestBuffer, createdAt);
      await writer.finish();

      await new Promise<void>((resolve, reject) => {
        const handleError = (error: Error) => {
          reject(error);
        };
        gzip.once('error', handleError);
        output.once('error', handleError);
        output.once('finish', () => {
          gzip.off('error', handleError);
          output.off('error', handleError);
          resolve();
        });
        gzip.end();
      });

      const archiveStat = await stat(temporaryPath);
      if (archiveStat.size === 0) {
        throw new BackupOperationError('The backup archive was written empty.');
      }

      await rename(temporaryPath, targetPath);

      return {
        filePath: targetPath,
        sizeBytes: archiveStat.size,
        counts: {
          ...counts,
          mediaFiles,
          mediaBytes,
        },
      };
    } catch (error) {
      gzip.destroy();
      output.destroy();
      await rm(temporaryPath, { force: true }).catch(() => undefined);

      if (
        error instanceof BackupValidationError ||
        error instanceof BackupOperationError
      ) {
        throw error;
      }

      throw new BackupOperationError(
        'The backup archive could not be created.',
        error,
      );
    }
  }

  async readAndValidateArchive(
    archivePath: string,
    stagingDirectory: string,
    maxExtractedBytes: number,
  ): Promise<ValidatedBackup> {
    const mediaDirectory = join(stagingDirectory, 'media');
    await mkdir(mediaDirectory, { recursive: true });

    const entries = new Map<string, BackupArchiveFile>();
    const media: ExtractedMediaFile[] = [];
    const manifestChunks: Buffer[] = [];
    const dataChunks: Buffer[] = [];
    let manifestBytes = 0;
    let dataBytes = 0;

    const source = createReadStream(archivePath);
    const gunzip = createGunzip();
    const reader = new TarReader(source.pipe(gunzip), {
      maxEntries: DEFAULT_BACKUP_MAX_ARCHIVE_ENTRIES,
      maxExtractedBytes,
    });

    try {
      for (;;) {
        const header = await reader.next();
        if (!header) {
          break;
        }

        if (entries.has(header.name)) {
          throw new BackupValidationError(
            'The backup archive contains duplicate entries',
          );
        }

        if (header.name === BACKUP_MANIFEST_ENTRY) {
          const collected = await collectEntry(
            reader,
            manifestChunks,
            DEFAULT_BACKUP_MAX_MANIFEST_BYTES,
            'Backup manifest',
          );
          manifestBytes += collected.size;
          entries.set(header.name, {
            path: header.name,
            size: collected.size,
            sha256: collected.sha256,
          });
          continue;
        }

        if (header.name === BACKUP_DATA_ENTRY) {
          const collected = await collectEntry(
            reader,
            dataChunks,
            DEFAULT_BACKUP_MAX_DATA_BYTES,
            'Backup data',
          );
          dataBytes += collected.size;
          entries.set(header.name, {
            path: header.name,
            size: collected.size,
            sha256: collected.sha256,
          });
          continue;
        }

        if (!header.name.startsWith(BACKUP_MEDIA_PREFIX)) {
          throw new BackupValidationError(
            'The backup archive contains an unexpected entry',
          );
        }

        const storageKey = header.name.slice(BACKUP_MEDIA_PREFIX.length);
        if (
          !MEDIA_STORAGE_KEY_PATTERN.test(storageKey) ||
          storageKey.includes('/') ||
          storageKey.includes('\\')
        ) {
          throw new BackupValidationError(
            'The backup archive contains an unsafe media path',
          );
        }

        const filePath = join(mediaDirectory, storageKey);
        const hash = createHash('sha256');
        const handle = await open(filePath, 'wx', 0o600);
        let written = 0;

        try {
          const received = await reader.readData(async (chunk) => {
            hash.update(chunk);

            let offset = 0;
            while (offset < chunk.length) {
              const { bytesWritten } = await handle.write(
                chunk,
                offset,
                chunk.length - offset,
                written + offset,
              );
              offset += bytesWritten;
            }

            written += chunk.length;
          });

          if (received !== header.size) {
            throw new BackupValidationError(
              'The backup archive contains a truncated media file',
            );
          }
        } finally {
          await handle.close();
        }

        const digest = hash.digest('hex');
        entries.set(header.name, {
          path: header.name,
          size: header.size,
          sha256: digest,
        });
        media.push({
          storageKey,
          path: filePath,
          size: header.size,
          sha256: digest,
        });
      }

      if (manifestBytes === 0 || dataBytes === 0) {
        throw new BackupValidationError(
          'The backup archive is missing its manifest or data file',
        );
      }

      const manifest = parseManifest(Buffer.concat(manifestChunks));
      verifyManifestFiles(manifest, entries);

      const data = validateBackupData(
        parseJsonBuffer(Buffer.concat(dataChunks), 'Backup data'),
        { maxRecords: DEFAULT_BACKUP_MAX_RECORDS },
      );
      validateBackupRelations(data, media);

      return {
        manifest,
        data,
        media,
        stagingDirectory,
      };
    } catch (error) {
      if (error instanceof BackupValidationError) {
        throw error;
      }
      throw new BackupValidationError(
        'The file is not a valid VendKit backup archive or it is corrupted.',
      );
    } finally {
      source.destroy();
      gunzip.destroy();
    }
  }

  private async readMediaFile(image: BackupImage): Promise<Buffer> {
    try {
      const buffer = await this.storage.read(image.storageKey);

      if (buffer.length !== image.size) {
        throw new BackupOperationError(
          `Media file "${image.storageKey}" is inconsistent with the database record.`,
        );
      }

      return buffer;
    } catch (error) {
      if (error instanceof BackupOperationError) {
        throw error;
      }

      throw new BackupOperationError(
        'A media file referenced by the database is missing. The backup was not created.',
        error,
      );
    }
  }
}

async function collectEntry(
  reader: TarReader,
  chunks: Buffer[],
  maxBytes: number,
  label: string,
): Promise<{ size: number; sha256: string }> {
  const hash = createHash('sha256');
  let total = 0;

  await reader.readData(async (chunk) => {
    total += chunk.length;
    if (total > maxBytes) {
      throw new BackupValidationError(`${label} exceeds the supported size`);
    }

    chunks.push(chunk);
    hash.update(chunk);
  });

  return { size: total, sha256: hash.digest('hex') };
}

export function summarizeTableCounts(data: BackupData): BackupCounts {
  const counts: BackupCounts = {};
  let total = 0;

  for (const table of BACKUP_TABLE_NAMES) {
    const count = data.tables[table]?.length ?? 0;
    counts[table] = count;
    total += count;
  }

  return { ...counts, totalRecords: total };
}
