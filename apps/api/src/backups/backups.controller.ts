import { createReadStream } from 'node:fs';
import {
  BadRequestException,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Post,
  Res,
  UploadedFile,
  UseInterceptors,
  Body,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../auth/decorators/current-user.decorator.js';
import { Permissions } from '../auth/decorators/permissions.decorator.js';
import { BackupsService } from './backups.service.js';
import { RestoreBackupDto } from './dto/restore-backup.dto.js';

interface UploadedBackupFile {
  path: string;
  originalname: string;
  size: number;
}

@Controller('backups')
export class BackupsController {
  constructor(private readonly backupsService: BackupsService) {}

  @Permissions('backup:read')
  @Get()
  getOverview() {
    return this.backupsService.getOverview();
  }

  @Permissions('backup:create')
  @Post()
  create(@CurrentUser('id') userId: string) {
    return this.backupsService.createBackup(userId);
  }

  @Permissions('backup:restore')
  @Post('restore')
  @HttpCode(HttpStatus.ACCEPTED)
  @UseInterceptors(FileInterceptor('file'))
  restoreFromUpload(
    @UploadedFile() file: UploadedBackupFile | undefined,
    @Body() dto: RestoreBackupDto,
    @CurrentUser('id') userId: string,
  ) {
    if (!file) {
      throw new BadRequestException('A backup archive file is required');
    }

    return this.backupsService.restoreFromUpload({
      filePath: file.path,
      originalName: file.originalname,
      sizeBytes: file.size,
      userId,
    });
  }

  @Permissions('backup:read')
  @Get('restore/:id')
  getRestoreJob(@Param('id', ParseUUIDPipe) id: string) {
    return this.backupsService.getRestoreJob(id);
  }

  @Permissions('backup:restore')
  @Post(':id/restore')
  @HttpCode(HttpStatus.ACCEPTED)
  restoreFromBackup(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() _dto: RestoreBackupDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.backupsService.restoreFromBackup(id, userId);
  }

  @Permissions('backup:read')
  @Get(':id/download')
  async download(
    @Param('id', ParseUUIDPipe) id: string,
    @Res() response: Response,
  ): Promise<void> {
    const download = await this.backupsService.getDownload(id);

    response.setHeader('Content-Type', 'application/gzip');
    response.setHeader('Content-Length', String(download.sizeBytes));
    response.setHeader(
      'Content-Disposition',
      `attachment; filename="${download.fileName}"`,
    );
    response.setHeader('Cache-Control', 'private, no-store');
    response.setHeader('X-Content-Type-Options', 'nosniff');

    const stream = createReadStream(download.filePath);
    stream.once('error', (error) => {
      if (!response.headersSent) {
        response.status(500).json({
          statusCode: 500,
          message: 'The backup file could not be read',
        });
        return;
      }
      response.destroy(error);
    });
    stream.pipe(response);
  }

  @Permissions('backup:delete')
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  delete(@Param('id', ParseUUIDPipe) id: string) {
    return this.backupsService.deleteBackup(id);
  }
}
