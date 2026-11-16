import { join } from 'node:path';
import {
  ConflictException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  BackupKind,
  BackupStatus,
  Prisma,
  RestoreStatus,
  type Backup as BackupRecord,
  type RestoreJob as RestoreJobRecord,
} from '@repo/database';
import { PrismaService } from '../prisma/prisma.service.js';
import {
  BackupArchiveService,
  summarizeTableCounts,
} from './backup-archive.service.js';
import { BackupDataService } from './backup-data.service.js';
import {
  BackupFilesService,
  type ImageStorageSwap,
} from './backup-files.service.js';
import {
  BACKUP_FORMAT_VERSION,
  BACKUP_HISTORY_LIMIT,
  type BackupCounts,
  resolveAppVersion,
  resolveBackupMaxExtractedSize,
  resolveBackupMaxFileSize,
  resolveBackupSafetySnapshot,
  resolveRestoreTransactionTimeout,
} from './backups.constants.js';
import { toBackupSummary, toRestoreJobSummary } from './backups.mapper.js';
import type {
  BackupDownload,
  BackupListResponse,
  BackupSummary,
  RestoreJobSummary,
  RestoreUploadInput,
  ValidatedBackup,
} from './backups.types.js';
import {
  BackupOperationError,
  BackupValidationError,
  createArchiveIdentity,
  sanitizeOriginalFileName,
} from './backups.utils.js';

interface RestoreExecution {
  jobId: string;
  archivePath: string;
  sourceBackupId?: string;
  deleteSourceAfter: boolean;
  sizeBytes: number;
  userId: string;
}

@Injectable()
export class BackupsService implements OnModuleInit {
  private readonly logger = new Logger(BackupsService.name);
  private readonly maxUploadBytes: number;
  private readonly maxExtractedBytes: number;
  private readonly transactionTimeoutMs: number;
  private readonly createSafetySnapshot: boolean;
  private readonly appVersion: string;
  private operationActive = false;

  constructor(
    private readonly prisma: PrismaService,
    private readonly data: BackupDataService,
    private readonly archive: BackupArchiveService,
    private readonly files: BackupFilesService,
    config: ConfigService,
  ) {
    this.maxUploadBytes = resolveBackupMaxFileSize(config);
    this.maxExtractedBytes = resolveBackupMaxExtractedSize(config);
    this.transactionTimeoutMs = resolveRestoreTransactionTimeout(config);
    this.createSafetySnapshot = resolveBackupSafetySnapshot(config);
    this.appVersion = resolveAppVersion(config);
  }

  async onModuleInit(): Promise<void> {
    try {
      const [interruptedBackups, restoreJobs] = await Promise.all([
        this.prisma.client.backup.findMany({
          where: { status: BackupStatus.IN_PROGRESS },
          select: { id: true, storageKey: true },
        }),
        this.prisma.client.restoreJob.findMany({
          where: {
            status: {
              in: [
                RestoreStatus.IN_PROGRESS,
                RestoreStatus.COMPLETED,
                RestoreStatus.FAILED,
              ],
            },
          },
          select: { id: true, status: true },
          orderBy: { createdAt: 'desc' },
          take: BACKUP_HISTORY_LIMIT,
        }),
      ]);

      for (const job of restoreJobs) {
        try {
          await this.files.recoverInterruptedSwap(
            job.id,
            job.status === RestoreStatus.COMPLETED,
          );
        } catch (error) {
          this.logger.error(
            `Failed to recover media for restore job "${job.id}"`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }

      if (interruptedBackups.length > 0) {
        await Promise.all(
          interruptedBackups.map((backup) =>
            Promise.all([
              this.files
                .deleteArchive(backup.storageKey)
                .catch(() => undefined),
              this.files
                .removePartialArchive(backup.storageKey)
                .catch(() => undefined),
            ]),
          ),
        );

        await this.prisma.client.backup.updateMany({
          where: { status: BackupStatus.IN_PROGRESS },
          data: {
            status: BackupStatus.FAILED,
            progress: 0,
            completedAt: new Date(),
            errorMessage:
              'The backup was interrupted by a server restart. No backup file was saved.',
          },
        });
      }

      await this.prisma.client.restoreJob.updateMany({
        where: { status: RestoreStatus.IN_PROGRESS },
        data: {
          status: RestoreStatus.FAILED,
          completedAt: new Date(),
          errorMessage:
            'The restore was interrupted by a server restart. The database change was rolled back.',
        },
      });

      await this.files.cleanupTemporaryArtifacts();
    } catch (error) {
      this.logger.error(
        'Failed to clean up interrupted backup or restore operations',
        error instanceof Error ? error.stack : String(error),
      );
    }
  }

  async getOverview(): Promise<BackupListResponse> {
    const records = await this.prisma.client.backup.findMany({
      orderBy: { createdAt: 'desc' },
      take: BACKUP_HISTORY_LIMIT,
    });

    const activeBackupRecord = records.find(
      (record) => record.status === BackupStatus.IN_PROGRESS,
    );

    const [activeRestoreRecord, latestRestoreRecord] = await Promise.all([
      this.prisma.client.restoreJob.findFirst({
        where: { status: RestoreStatus.IN_PROGRESS },
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.client.restoreJob.findFirst({
        orderBy: { createdAt: 'desc' },
      }),
    ]);

    return {
      backups: records.map(toBackupSummary),
      activeBackup: activeBackupRecord
        ? toBackupSummary(activeBackupRecord)
        : null,
      activeRestore: activeRestoreRecord
        ? toRestoreJobSummary(activeRestoreRecord)
        : null,
      latestRestore: latestRestoreRecord
        ? toRestoreJobSummary(latestRestoreRecord)
        : null,
      formatVersion: BACKUP_FORMAT_VERSION,
      appVersion: this.appVersion,
      maxUploadBytes: this.maxUploadBytes,
    };
  }

  async createBackup(userId: string): Promise<BackupSummary> {
    this.beginOperation();

    try {
      await this.assertNoActiveOperation();
      const record = await this.createBackupRecord(userId, BackupKind.MANUAL);

      void this.executeBackup(record)
        .catch(() => undefined)
        .finally(() => this.endOperation());

      return toBackupSummary(record);
    } catch (error) {
      this.endOperation();
      throw error;
    }
  }

  async getRestoreJob(id: string): Promise<RestoreJobSummary> {
    const record = await this.prisma.client.restoreJob.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Restore job not found');
    }

    return toRestoreJobSummary(record);
  }

  async restoreFromUpload(
    input: RestoreUploadInput,
  ): Promise<RestoreJobSummary> {
    this.beginOperation();

    try {
      await this.assertNoActiveOperation();

      if (input.sizeBytes <= 0) {
        throw new BackupValidationError('The uploaded backup file is empty');
      }
      if (input.sizeBytes > this.maxUploadBytes) {
        throw new BackupValidationError(
          'The uploaded backup file exceeds the configured size limit',
        );
      }

      const record = await this.createRestoreRecord({
        userId: input.userId,
        sourceFileName: sanitizeOriginalFileName(input.originalName),
        sourceBackupId: input.sourceBackupId,
        sizeBytes: input.sizeBytes,
      });
      const summary = toRestoreJobSummary(record);

      this.startRestore({
        jobId: record.id,
        archivePath: input.filePath,
        sourceBackupId: input.sourceBackupId,
        deleteSourceAfter: true,
        sizeBytes: input.sizeBytes,
        userId: input.userId,
      });

      return summary;
    } catch (error) {
      await this.files
        .removeUploadedFile(input.filePath)
        .catch(() => undefined);
      this.endOperation();
      throw error;
    }
  }

  async restoreFromBackup(
    backupId: string,
    userId: string,
  ): Promise<RestoreJobSummary> {
    this.beginOperation();

    try {
      await this.assertNoActiveOperation();

      const backup = await this.prisma.client.backup.findUnique({
        where: { id: backupId },
      });

      if (!backup) {
        throw new NotFoundException('Backup not found');
      }
      if (backup.status !== BackupStatus.COMPLETED) {
        throw new ConflictException('Only a completed backup can be restored');
      }
      if (!(await this.files.backupExists(backup.storageKey))) {
        throw new NotFoundException('The backup file is no longer available');
      }

      const sizeBytes = await this.files.getArchiveSize(backup.storageKey);
      const record = await this.createRestoreRecord({
        userId,
        sourceFileName: backup.fileName,
        sourceBackupId: backup.id,
        sizeBytes,
      });
      const summary = toRestoreJobSummary(record);

      this.startRestore({
        jobId: record.id,
        archivePath: this.files.archivePathFor(backup.storageKey),
        sourceBackupId: backup.id,
        deleteSourceAfter: false,
        sizeBytes,
        userId,
      });

      return summary;
    } catch (error) {
      this.endOperation();
      throw error;
    }
  }

  async getDownload(id: string): Promise<BackupDownload> {
    const record = await this.prisma.client.backup.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Backup not found');
    }
    if (record.status !== BackupStatus.COMPLETED) {
      throw new ConflictException('This backup is not ready for download');
    }
    if (!(await this.files.backupExists(record.storageKey))) {
      throw new NotFoundException('The backup file is no longer available');
    }

    return {
      filePath: this.files.archivePathFor(record.storageKey),
      fileName: record.fileName,
      sizeBytes: await this.files.getArchiveSize(record.storageKey),
    };
  }

  async deleteBackup(id: string): Promise<void> {
    const record = await this.prisma.client.backup.findUnique({
      where: { id },
    });

    if (!record) {
      throw new NotFoundException('Backup not found');
    }
    if (record.status === BackupStatus.IN_PROGRESS) {
      throw new ConflictException(
        'A backup that is still running cannot be deleted',
      );
    }

    const activeRestore = await this.prisma.client.restoreJob.count({
      where: {
        status: RestoreStatus.IN_PROGRESS,
        sourceBackupId: record.id,
      },
    });
    if (activeRestore > 0) {
      throw new ConflictException(
        'This backup is currently being restored and cannot be deleted',
      );
    }

    await this.files.deleteArchive(record.storageKey);
    await this.prisma.client.backup.delete({ where: { id: record.id } });
  }

  private startRestore(execution: RestoreExecution): void {
    void this.executeRestore(execution)
      .catch(() => undefined)
      .finally(() => this.endOperation());
  }

  private async createBackupRecord(
    userId: string,
    kind: BackupKind,
  ): Promise<BackupRecord> {
    const identity = createArchiveIdentity(kind);

    return this.prisma.client.backup.create({
      data: {
        kind,
        fileName: identity.fileName,
        storageKey: identity.storageKey,
        status: BackupStatus.IN_PROGRESS,
        progress: 2,
        formatVersion: BACKUP_FORMAT_VERSION,
        appVersion: this.appVersion,
        createdById: userId,
      },
    });
  }

  private async createRestoreRecord(input: {
    userId: string;
    sourceFileName: string;
    sourceBackupId?: string;
    sizeBytes: number;
  }): Promise<RestoreJobRecord> {
    return this.prisma.client.restoreJob.create({
      data: {
        status: RestoreStatus.IN_PROGRESS,
        progress: 2,
        sourceFileName: input.sourceFileName,
        sourceBackupId: input.sourceBackupId,
        sizeBytes: BigInt(input.sizeBytes),
        createdById: input.userId,
      },
    });
  }

  private async executeBackup(record: BackupRecord): Promise<void> {
    const targetPath = this.files.archivePathFor(record.storageKey);

    try {
      await this.updateBackupProgress(record.id, 10);
      const snapshot = await this.data.createSnapshot(
        this.transactionTimeoutMs,
      );
      await this.updateBackupProgress(record.id, 25);

      const result = await this.archive.createArchive(
        targetPath,
        snapshot.data,
        snapshot.images,
        snapshot.counts,
        this.maxExtractedBytes,
        (progress) =>
          this.updateBackupProgress(record.id, Math.min(90, progress)),
      );

      await this.prisma.client.backup.update({
        where: { id: record.id },
        data: {
          status: BackupStatus.COMPLETED,
          progress: 100,
          sizeBytes: BigInt(result.sizeBytes),
          dataCounts: result.counts as unknown as Prisma.InputJsonValue,
          completedAt: new Date(),
          errorMessage: null,
        },
      });
    } catch (error) {
      this.logger.error(
        `Backup "${record.id}" failed`,
        error instanceof Error ? error.stack : String(error),
      );

      await Promise.all([
        this.files.deleteArchive(record.storageKey).catch(() => undefined),
        this.files
          .removePartialArchive(record.storageKey)
          .catch(() => undefined),
      ]);

      await this.prisma.client.backup
        .update({
          where: { id: record.id },
          data: {
            status: BackupStatus.FAILED,
            progress: 0,
            completedAt: new Date(),
            sizeBytes: BigInt(0),
            errorMessage: this.describeBackupFailure(error),
          },
        })
        .catch((updateError: unknown) => {
          this.logger.error(
            `Failed to persist backup failure for "${record.id}"`,
            updateError instanceof Error
              ? updateError.stack
              : String(updateError),
          );
        });

      throw error;
    }
  }

  private async executeRestore(execution: RestoreExecution): Promise<void> {
    const { jobId } = execution;
    let stagingDirectory: string | null = null;
    let swap: ImageStorageSwap | null = null;
    let dbCommitted = false;

    try {
      stagingDirectory = await this.files.createStagingDirectory('restore');
      await this.updateRestoreProgress(jobId, 5);

      const validated = await this.archive.readAndValidateArchive(
        execution.archivePath,
        stagingDirectory,
        this.maxExtractedBytes,
      );
      const counts = summarizeValidatedCounts(validated);

      await this.prisma.client.restoreJob.update({
        where: { id: jobId },
        data: {
          progress: 40,
          formatVersion: validated.manifest.formatVersion,
          appVersion: validated.manifest.appVersion,
          dataCounts: counts as unknown as Prisma.InputJsonValue,
        },
      });

      if (this.createSafetySnapshot) {
        await this.updateRestoreProgress(jobId, 45);
        try {
          await this.createSafetyBackup(execution.userId);
        } catch (error) {
          throw new BackupOperationError(
            'A safety backup of the current data could not be created, so the restore was cancelled and existing data was left unchanged.',
            error,
          );
        }
        await this.updateRestoreProgress(jobId, 60);
      }

      swap = await this.files.replaceImageStorage(
        join(stagingDirectory, 'media'),
        jobId,
      );
      await this.updateRestoreProgress(jobId, 75);

      // Progress is intentionally frozen while the transaction runs. Writing
      // the job row from another connection during the serializable
      // transaction would cause a write conflict at commit time.
      await this.data.restoreSnapshot(
        validated.data,
        this.transactionTimeoutMs,
        undefined,
        async (tx) => {
          await tx.restoreJob.update({
            where: { id: jobId },
            data: {
              status: RestoreStatus.COMPLETED,
              progress: 100,
              completedAt: new Date(),
              formatVersion: validated.manifest.formatVersion,
              appVersion: validated.manifest.appVersion,
              sizeBytes: BigInt(execution.sizeBytes),
              dataCounts: counts as unknown as Prisma.InputJsonValue,
              errorMessage: null,
            },
          });
        },
      );

      dbCommitted = true;

      if (swap) {
        try {
          await this.files.finalizeImageStorage(swap);
        } catch (error) {
          this.logger.warn(
            `Restore "${jobId}" committed but the previous media tree could not be removed`,
            error instanceof Error ? error.stack : String(error),
          );
        }
      }
    } catch (error) {
      this.logger.error(
        `Restore "${jobId}" failed`,
        error instanceof Error ? error.stack : String(error),
      );

      if (!dbCommitted) {
        try {
          if (swap) {
            await this.files.rollbackImageStorage(swap);
          } else {
            // A failure during the swap itself can leave the deterministic
            // safety directory behind before `swap` is assigned.
            await this.files.recoverInterruptedSwap(jobId, false);
          }
        } catch (rollbackError) {
          this.logger.error(
            `Restore "${jobId}" failed to roll back media storage`,
            rollbackError instanceof Error
              ? rollbackError.stack
              : String(rollbackError),
          );
        }
      }

      if (!dbCommitted) {
        await this.prisma.client.restoreJob
          .update({
            where: { id: jobId },
            data: {
              status: RestoreStatus.FAILED,
              completedAt: new Date(),
              errorMessage: this.describeRestoreFailure(error),
            },
          })
          .catch((updateError: unknown) => {
            this.logger.error(
              `Failed to persist restore failure for "${jobId}"`,
              updateError instanceof Error
                ? updateError.stack
                : String(updateError),
            );
          });
      }
    } finally {
      if (stagingDirectory) {
        await this.files
          .removeStagingDirectory(stagingDirectory)
          .catch(() => undefined);
      }
      if (execution.deleteSourceAfter) {
        await this.files
          .removeUploadedFile(execution.archivePath)
          .catch(() => undefined);
      }
    }
  }

  private async createSafetyBackup(userId: string): Promise<void> {
    const record = await this.createBackupRecord(
      userId,
      BackupKind.PRE_RESTORE,
    );
    await this.executeBackup(record);
  }

  private async updateBackupProgress(
    id: string,
    progress: number,
  ): Promise<void> {
    await this.prisma.client.backup
      .update({
        where: { id },
        data: { progress: Math.min(99, Math.max(0, Math.round(progress))) },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to update backup progress for "${id}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private async updateRestoreProgress(
    id: string,
    progress: number,
  ): Promise<void> {
    await this.prisma.client.restoreJob
      .update({
        where: { id },
        data: { progress: Math.min(99, Math.max(0, Math.round(progress))) },
      })
      .catch((error: unknown) => {
        this.logger.warn(
          `Failed to update restore progress for "${id}"`,
          error instanceof Error ? error.stack : String(error),
        );
      });
  }

  private beginOperation(): void {
    if (this.operationActive) {
      throw new ConflictException(
        'Another backup or restore operation is already running',
      );
    }
    this.operationActive = true;
  }

  private endOperation(): void {
    this.operationActive = false;
  }

  private async assertNoActiveOperation(): Promise<void> {
    const [backups, restores] = await Promise.all([
      this.prisma.client.backup.count({
        where: { status: BackupStatus.IN_PROGRESS },
      }),
      this.prisma.client.restoreJob.count({
        where: { status: RestoreStatus.IN_PROGRESS },
      }),
    ]);

    if (backups > 0 || restores > 0) {
      throw new ConflictException(
        'Another backup or restore operation is already running',
      );
    }
  }

  private describeBackupFailure(error: unknown): string {
    if (
      error instanceof BackupValidationError ||
      error instanceof BackupOperationError
    ) {
      return error.message;
    }

    return 'The backup could not be created. No complete backup file was saved.';
  }

  private describeRestoreFailure(error: unknown): string {
    if (error instanceof BackupValidationError) {
      return error.message;
    }
    if (error instanceof BackupOperationError) {
      return error.message;
    }

    return 'The restore failed and the database change was rolled back. Existing data was left unchanged.';
  }
}

function summarizeValidatedCounts(validated: ValidatedBackup): BackupCounts {
  const mediaBytes = validated.media.reduce(
    (total, file) => total + file.size,
    0,
  );
  return {
    ...summarizeTableCounts(validated.data),
    mediaFiles: validated.media.length,
    mediaBytes,
  };
}
