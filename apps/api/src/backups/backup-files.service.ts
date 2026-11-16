import {
  access,
  cp,
  mkdir,
  mkdtemp,
  readdir,
  rename,
  rm,
  stat,
} from 'node:fs/promises';
import { dirname, join, resolve, sep } from 'node:path';
import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { LocalImageStorage } from '../storage/local-image-storage.js';
import {
  BACKUP_STORAGE_KEY_PATTERN,
  resolveBackupStorageDir,
} from './backups.constants.js';
import { isMissingFileError } from './backups.utils.js';

export interface ImageStorageSwap {
  /** Directory holding the previous media tree, or null when none existed. */
  safetyDirectory: string | null;
  imageDirectory: string;
}

@Injectable()
export class BackupFilesService implements OnModuleInit {
  private readonly logger = new Logger(BackupFilesService.name);
  private readonly baseDirectory: string;
  private readonly tempDirectory: string;
  private readonly imageDirectory: string;

  constructor(config: ConfigService, images: LocalImageStorage) {
    this.baseDirectory = resolve(resolveBackupStorageDir(config));
    this.tempDirectory = join(this.baseDirectory, '.tmp');
    this.imageDirectory = images.getStorageDirectory();
  }

  async onModuleInit(): Promise<void> {
    if (
      this.baseDirectory === this.imageDirectory ||
      this.baseDirectory.startsWith(`${this.imageDirectory}${sep}`)
    ) {
      throw new Error(
        'BACKUP_STORAGE_DIR must not be inside IMAGE_STORAGE_DIR. Restoring a backup would move the archive files along with the media tree.',
      );
    }

    await Promise.all([
      mkdir(this.baseDirectory, { recursive: true, mode: 0o700 }),
      mkdir(this.tempDirectory, { recursive: true, mode: 0o700 }),
      mkdir(dirname(this.imageDirectory), { recursive: true }),
    ]);
  }

  archivePathFor(storageKey: string): string {
    if (!BACKUP_STORAGE_KEY_PATTERN.test(storageKey)) {
      throw new Error('Invalid backup storage key');
    }

    const path = resolve(this.baseDirectory, storageKey);
    if (!path.startsWith(`${this.baseDirectory}${sep}`)) {
      throw new Error('Resolved backup path escapes the backup directory');
    }

    return path;
  }

  async createStagingDirectory(label: string): Promise<string> {
    const safeLabel = label.replace(/[^a-z0-9-]/gi, '').slice(0, 24) || 'job';
    await mkdir(this.tempDirectory, { recursive: true, mode: 0o700 });
    return mkdtemp(join(this.tempDirectory, `${safeLabel}-`));
  }

  async removeStagingDirectory(directory: string): Promise<void> {
    const resolved = resolve(directory);
    if (
      resolved !== this.tempDirectory &&
      !resolved.startsWith(`${this.tempDirectory}${sep}`)
    ) {
      this.logger.warn(
        'Refusing to remove a directory outside the backup temp root',
      );
      return;
    }

    await rm(resolved, { recursive: true, force: true });
  }

  async deleteArchive(storageKey: string): Promise<void> {
    await rm(this.archivePathFor(storageKey), { force: true });
  }

  async removeUploadedFile(filePath: string): Promise<void> {
    const resolved = resolve(filePath);
    if (!resolved.startsWith(`${this.tempDirectory}${sep}`)) {
      this.logger.warn(
        'Refusing to remove an upload outside the backup temp root',
      );
      return;
    }

    await rm(resolved, { force: true });
  }

  async removePartialArchive(storageKey: string): Promise<void> {
    await rm(`${this.archivePathFor(storageKey)}.part`, { force: true });
  }

  async backupExists(storageKey: string): Promise<boolean> {
    try {
      const info = await stat(this.archivePathFor(storageKey));
      return info.isFile();
    } catch (error) {
      if (isMissingFileError(error)) {
        return false;
      }
      throw error;
    }
  }

  async getArchiveSize(storageKey: string): Promise<number> {
    const info = await stat(this.archivePathFor(storageKey));
    return info.size;
  }

  async cleanupTemporaryArtifacts(): Promise<void> {
    await mkdir(this.tempDirectory, { recursive: true, mode: 0o700 });

    const [temporaryEntries, archiveEntries] = await Promise.all([
      readdir(this.tempDirectory).catch(() => []),
      readdir(this.baseDirectory).catch(() => []),
    ]);

    await Promise.all(
      temporaryEntries.map((entry) =>
        rm(join(this.tempDirectory, entry), { recursive: true, force: true }),
      ),
    );

    await Promise.all(
      archiveEntries
        .filter((entry) => entry.endsWith('.part'))
        .map((entry) => rm(join(this.baseDirectory, entry), { force: true })),
    );
  }

  /**
   * Swaps the live media directory for the validated staging directory. The
   * previous tree is moved to a deterministic location derived from the
   * restore job so an interrupted process can recover it on startup.
   */
  async replaceImageStorage(
    stagedMediaDirectory: string,
    operationId: string,
  ): Promise<ImageStorageSwap> {
    await mkdir(dirname(this.imageDirectory), { recursive: true });
    const safetyDirectory = this.safetyDirectoryFor(operationId);

    const hasExisting = await pathExists(this.imageDirectory);
    if (hasExisting) {
      await rename(this.imageDirectory, safetyDirectory);
    }

    try {
      await moveDirectory(stagedMediaDirectory, this.imageDirectory);
    } catch (error) {
      if (hasExisting) {
        await moveDirectory(safetyDirectory, this.imageDirectory).catch(
          (rollbackError: unknown) => {
            this.logger.error(
              'Failed to roll back media storage after a failed swap',
              rollbackError instanceof Error
                ? rollbackError.stack
                : String(rollbackError),
            );
          },
        );
      }
      throw error;
    }

    return {
      safetyDirectory: hasExisting ? safetyDirectory : null,
      imageDirectory: this.imageDirectory,
    };
  }

  async rollbackImageStorage(swap: ImageStorageSwap): Promise<void> {
    await rm(swap.imageDirectory, { recursive: true, force: true });

    if (swap.safetyDirectory) {
      await moveDirectory(swap.safetyDirectory, swap.imageDirectory);
      return;
    }

    await mkdir(swap.imageDirectory, { recursive: true });
  }

  async finalizeImageStorage(swap: ImageStorageSwap): Promise<void> {
    if (swap.safetyDirectory) {
      await rm(swap.safetyDirectory, { recursive: true, force: true });
    }
  }

  /**
   * Called at startup for jobs that did not finish cleanly. If the database
   * transaction committed, the new media tree is authoritative; otherwise the
   * previous tree is put back.
   */
  async recoverInterruptedSwap(
    operationId: string,
    keepCurrent: boolean,
  ): Promise<void> {
    const safetyDirectory = this.safetyDirectoryFor(operationId);

    if (!(await pathExists(safetyDirectory))) {
      return;
    }

    if (keepCurrent) {
      await rm(safetyDirectory, { recursive: true, force: true });
      return;
    }

    await rm(this.imageDirectory, { recursive: true, force: true });
    await moveDirectory(safetyDirectory, this.imageDirectory);
  }

  private safetyDirectoryFor(operationId: string): string {
    if (!/^[0-9a-f-]{36}$/i.test(operationId)) {
      throw new Error('Invalid restore operation identifier');
    }

    return join(
      dirname(this.imageDirectory),
      `.vendkit-media-restore-${operationId}`,
    );
  }
}

async function pathExists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function moveDirectory(
  source: string,
  destination: string,
): Promise<void> {
  try {
    await rename(source, destination);
  } catch (error) {
    if (
      typeof error !== 'object' ||
      error === null ||
      !('code' in error) ||
      (error as { code?: unknown }).code !== 'EXDEV'
    ) {
      throw error;
    }

    await cp(source, destination, {
      recursive: true,
      force: false,
      errorOnExist: true,
      preserveTimestamps: true,
    });
    await rm(source, { recursive: true, force: true });
  }
}
