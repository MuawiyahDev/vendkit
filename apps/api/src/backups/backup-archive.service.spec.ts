import { createWriteStream } from 'node:fs';
import { mkdtemp, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import type { ConfigService } from '@nestjs/config';
import { BACKUP_TABLE_NAMES } from './backups.constants.js';
import type { BackupData, BackupManifest } from './backups.types.js';
import {
  BackupArchiveService,
  summarizeTableCounts,
} from './backup-archive.service.js';
import { sha256 } from './backups.utils.js';
import { TarWriter } from './tar-archive.js';
import type { ImageStorage } from '../storage/image-storage.js';

function emptyTables(): BackupData['tables'] {
  return Object.fromEntries(
    BACKUP_TABLE_NAMES.map((table) => [table, []]),
  ) as unknown as BackupData['tables'];
}

const imageRecord = {
  id: '11111111-1111-4111-8111-111111111111',
  originalName: 'logo.png',
  storageKey: '22222222-2222-4222-8222-222222222222.png',
  mimeType: 'image/png',
  size: 4,
  width: 1,
  height: 1,
  altText: null,
  createdAt: new Date('2026-01-01T00:00:00.000Z'),
  updatedAt: new Date('2026-01-01T00:00:00.000Z'),
};

function buildData(): BackupData {
  const tables = emptyTables();
  tables.images.push(imageRecord as unknown as Record<string, unknown>);
  tables.categories.push({
    id: '33333333-3333-4333-8333-333333333333',
    name: 'Shirts',
    slug: 'shirts',
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  tables.products.push({
    id: '44444444-4444-4444-8444-444444444444',
    name: 'Shirt',
    slug: 'shirt',
    description: null,
    shortDescription: null,
    sku: null,
    categoryId: '33333333-3333-4333-8333-333333333333',
    brandId: null,
    unit: null,
    sellingPrice: '10.00',
    compareAtPrice: null,
    stockQuantity: 5,
    lowStockThreshold: null,
    weight: null,
    length: null,
    width: null,
    height: null,
    isActive: true,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  });
  return { tables };
}

function createService(storage: ImageStorage): BackupArchiveService {
  return new BackupArchiveService(storage, {
    get: () => undefined,
  } as unknown as ConfigService);
}

function createStorage(): {
  storage: ImageStorage;
  files: Map<string, Buffer>;
} {
  const files = new Map<string, Buffer>();
  const storage: ImageStorage = {
    async save(key, data) {
      files.set(key, Buffer.from(data));
    },
    async read(key) {
      const data = files.get(key);
      if (!data) {
        throw new Error(`missing ${key}`);
      }
      return data;
    },
    async delete(key) {
      files.delete(key);
    },
  };
  return { storage, files };
}

async function writeRawArchive(
  path: string,
  manifest: BackupManifest,
  dataBuffer: Buffer,
): Promise<void> {
  const gzip = createGzip();
  const output = createWriteStream(path);
  gzip.pipe(output);
  const writer = new TarWriter(gzip);

  await writer.addFile('data.json', dataBuffer);
  await writer.addFile('manifest.json', Buffer.from(JSON.stringify(manifest)));
  await writer.finish();

  await new Promise<void>((resolve, reject) => {
    output.once('finish', resolve);
    output.once('error', reject);
    gzip.once('error', reject);
    gzip.end();
  });
}

describe('BackupArchiveService', () => {
  let directory: string;

  beforeEach(async () => {
    directory = await mkdtemp(join(tmpdir(), 'backup-archive-'));
  });

  afterEach(async () => {
    await rm(directory, { recursive: true, force: true });
  });

  it('creates and validates a complete archive with media', async () => {
    const { storage, files } = createStorage();
    files.set(imageRecord.storageKey, Buffer.from([0x89, 0x50, 0x4e, 0x47]));
    const service = createService(storage);
    const data = buildData();
    const archivePath = join(directory, 'backup.tar.gz');

    const result = await service.createArchive(
      archivePath,
      data,
      [imageRecord],
      summarizeTableCounts(data),
      1024 * 1024,
      async () => undefined,
    );

    expect(result.sizeBytes).toBeGreaterThan(0);
    expect(result.counts.mediaFiles).toBe(1);

    const staging = join(directory, 'staging');
    const validated = await service.readAndValidateArchive(
      archivePath,
      staging,
      1024 * 1024,
    );

    expect(validated.manifest.formatVersion).toBe(1);
    expect(validated.manifest.files).toHaveLength(2);
    expect(validated.data.tables.products).toHaveLength(1);
    expect(validated.media).toHaveLength(1);
    await expect(
      readFile(join(staging, 'media', imageRecord.storageKey)),
    ).resolves.toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47]));
  });

  it('refuses to create an archive when a media file is missing', async () => {
    const { storage } = createStorage();
    const service = createService(storage);
    const data = buildData();

    await expect(
      service.createArchive(
        join(directory, 'backup.tar.gz'),
        data,
        [imageRecord],
        summarizeTableCounts(data),
        1024 * 1024,
        async () => undefined,
      ),
    ).rejects.toThrow('media file referenced by the database is missing');
  });

  it('rejects corrupted archives', async () => {
    const { storage, files } = createStorage();
    files.set(imageRecord.storageKey, Buffer.from([1, 2, 3, 4]));
    const service = createService(storage);
    const data = buildData();
    const archivePath = join(directory, 'backup.tar.gz');

    await service.createArchive(
      archivePath,
      data,
      [imageRecord],
      summarizeTableCounts(data),
      1024 * 1024,
      async () => undefined,
    );

    const buffer = await readFile(archivePath);
    buffer[Math.floor(buffer.length / 2)] =
      buffer[Math.floor(buffer.length / 2)]! ^ 0xff;
    await writeFile(archivePath, buffer);

    await expect(
      service.readAndValidateArchive(
        archivePath,
        join(directory, 'staging'),
        1024 * 1024,
      ),
    ).rejects.toThrow();
  });

  it('detects an unsupported backup format version', async () => {
    const { storage } = createStorage();
    const service = createService(storage);
    const data = buildData();
    const dataBuffer = Buffer.from(JSON.stringify(data));
    const manifest: BackupManifest = {
      format: 'vendkit-backup',
      formatVersion: 999,
      appVersion: '9.9.9',
      createdAt: new Date().toISOString(),
      database: { provider: 'postgresql' },
      included: {},
      files: [
        {
          path: 'data.json',
          size: dataBuffer.length,
          sha256: sha256(dataBuffer),
        },
      ],
    };
    const archivePath = join(directory, 'backup.tar.gz');
    await writeRawArchive(archivePath, manifest, dataBuffer);

    await expect(
      service.readAndValidateArchive(
        archivePath,
        join(directory, 'staging'),
        1024 * 1024,
      ),
    ).rejects.toThrow('not supported');
  });

  it('detects a manifest checksum mismatch', async () => {
    const { storage } = createStorage();
    const service = createService(storage);
    const data = buildData();
    const dataBuffer = Buffer.from(JSON.stringify(data));
    const manifest: BackupManifest = {
      format: 'vendkit-backup',
      formatVersion: 1,
      appVersion: '0.0.1',
      createdAt: new Date().toISOString(),
      database: { provider: 'postgresql' },
      included: {},
      files: [
        {
          path: 'data.json',
          size: dataBuffer.length,
          sha256: 'f'.repeat(64),
        },
      ],
    };
    const archivePath = join(directory, 'backup.tar.gz');
    await writeRawArchive(archivePath, manifest, dataBuffer);

    await expect(
      service.readAndValidateArchive(
        archivePath,
        join(directory, 'staging'),
        1024 * 1024,
      ),
    ).rejects.toThrow('checksums');
  });
});
