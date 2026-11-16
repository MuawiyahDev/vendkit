import { Module } from '@nestjs/common';
import { IMAGE_STORAGE } from './image-storage.js';
import { LocalImageStorage } from './local-image-storage.js';

/**
 * Provides the configured media storage implementation. Kept separate from
 * the images module so other features (for example backups) can read the same
 * files without importing HTTP upload concerns.
 */
@Module({
  providers: [
    LocalImageStorage,
    { provide: IMAGE_STORAGE, useExisting: LocalImageStorage },
  ],
  exports: [LocalImageStorage, IMAGE_STORAGE],
})
export class StorageModule {}
