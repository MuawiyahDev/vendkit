import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { StorageModule } from '../storage/storage.module.js';
import { ImagesController } from './images.controller.js';
import { ImagesService } from './images.service.js';
import { IMAGE_MAX_FILE_SIZE, resolveImageMaxFileSize } from './images.constants.js';

@Module({
  imports: [
    StorageModule,
    MulterModule.registerAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        limits: {
          fileSize: resolveImageMaxFileSize(config),
          files: 1,
        },
      }),
    }),
  ],
  controllers: [ImagesController],
  providers: [
    ImagesService,
    {
      provide: IMAGE_MAX_FILE_SIZE,
      useFactory: resolveImageMaxFileSize,
      inject: [ConfigService],
    },
  ],
})
export class ImagesModule {}
