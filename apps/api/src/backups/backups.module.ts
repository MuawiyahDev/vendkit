import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../storage/storage.module.js';
import { BackupArchiveService } from './backup-archive.service.js';
import { BackupDataService } from './backup-data.service.js';
import { BackupFilesService } from './backup-files.service.js';
import { BackupsController } from './backups.controller.js';
import {
  resolveBackupMaxFileSize,
  resolveBackupStorageDir,
} from './backups.constants.js';
import { BackupsService } from './backups.service.js';

@Module({
  imports: [
    StorageModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const uploadDirectory = join(
          resolve(resolveBackupStorageDir(config)),
          '.tmp',
        );
        mkdirSync(uploadDirectory, { recursive: true, mode: 0o700 });

        return {
          dest: uploadDirectory,
          limits: {
            fileSize: resolveBackupMaxFileSize(config),
            files: 1,
            fields: 5,
          },
        };
      },
    }),
  ],
  controllers: [BackupsController],
  providers: [
    BackupsService,
    BackupDataService,
    BackupArchiveService,
    BackupFilesService,
  ],
})
export class BackupsModule {}
