import { createWriteStream } from 'node:fs';
import { mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createGzip } from 'node:zlib';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Role } from '@repo/database';
import request from 'supertest';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { AppModule } from './../src/app.module.js';
import { BACKUP_TABLE_NAMES } from '../src/backups/backups.constants.js';
import { sha256 } from '../src/backups/backups.utils.js';
import { TarWriter } from '../src/backups/tar-archive.js';

const TEST_API_KEY = 'e2e-test-api-key';
const describeBackupE2e =
  process.env.RUN_BACKUP_RESTORE_E2E === '1' ? describe : describe.skip;

function pngBuffer(width = 16, height = 8): Buffer {
  const buffer = Buffer.alloc(32);
  Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).copy(buffer, 0);
  buffer.writeUInt32BE(13, 8);
  buffer.write('IHDR', 12, 'ascii');
  buffer.writeUInt32BE(width, 16);
  buffer.writeUInt32BE(height, 20);
  return buffer;
}

function emptyTables(): Record<string, unknown[]> {
  return Object.fromEntries(
    BACKUP_TABLE_NAMES.map((table) => [table, []]),
  ) as Record<string, unknown[]>;
}

async function writeCustomArchive(
  path: string,
  options: { formatVersion?: number; tables: Record<string, unknown[]> },
): Promise<void> {
  const dataBuffer = Buffer.from(JSON.stringify({ tables: options.tables }));
  const manifest = {
    format: 'vendkit-backup',
    formatVersion: options.formatVersion ?? 1,
    appVersion: '0.0.1',
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

describeBackupE2e('Backups (e2e)', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let adminToken: string;
  let regularToken: string;
  let adminUserId: string;
  let storageDir: string;
  let backupDir: string;
  let workDir: string;
  let categoryId: string;
  let productId: string;
  let imageId: string;
  let imageBytes: Buffer;

  const uniqueSuffix = Date.now().toString();
  const email = `backups-admin-${uniqueSuffix}@example.com`;
  const regularEmail = `backups-user-${uniqueSuffix}@example.com`;
  const password = 'strong-password-123';
  const namePrefix = `E2E Backup ${uniqueSuffix}`;

  function auth(token = adminToken) {
    return { Authorization: `Bearer ${token}` };
  }

  function get(path: string, token = adminToken) {
    return request(app.getHttpServer())
      .get(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth(token));
  }

  function post(
    path: string,
    body: Record<string, unknown>,
    token = adminToken,
  ) {
    return request(app.getHttpServer())
      .post(path)
      .set('x-api-key', TEST_API_KEY)
      .set(auth(token))
      .send(body);
  }

  async function waitForBackup(id: string) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const response = await get('/backups').expect(200);
      const backup = response.body.backups.find(
        (entry: { id: string }) => entry.id === id,
      );
      if (backup && backup.status !== 'IN_PROGRESS') {
        return backup;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Backup did not finish in time');
  }

  async function waitForRestore(id: string) {
    for (let attempt = 0; attempt < 200; attempt += 1) {
      const response = await get(`/backups/restore/${id}`).expect(200);
      if (response.body.status !== 'IN_PROGRESS') {
        return response.body;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error('Restore did not finish in time');
  }

  function uploadArchive(path: string, token = adminToken) {
    return request(app.getHttpServer())
      .post('/backups/restore')
      .set('x-api-key', TEST_API_KEY)
      .set(auth(token))
      .field('confirmation', 'RESTORE')
      .attach('file', path);
  }

  beforeAll(async () => {
    process.env.JWT_SECRET = 'e2e-test-secret';
    process.env.API_KEY = TEST_API_KEY;
    process.env.BACKUP_SAFETY_SNAPSHOT = 'true';

    storageDir = await mkdtemp(join(tmpdir(), 'backups-e2e-media-'));
    backupDir = await mkdtemp(join(tmpdir(), 'backups-e2e-archives-'));
    workDir = await mkdtemp(join(tmpdir(), 'backups-e2e-work-'));
    process.env.IMAGE_STORAGE_DIR = storageDir;
    process.env.BACKUP_STORAGE_DIR = backupDir;

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: true,
      }),
    );
    await app.init();

    prisma = moduleFixture.get(PrismaService);

    const adminRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(201);
    adminUserId = adminRegistration.body.user.id;

    const regularRegistration = await request(app.getHttpServer())
      .post('/auth/register')
      .set('x-api-key', TEST_API_KEY)
      .send({ email: regularEmail, password })
      .expect(201);
    regularToken = regularRegistration.body.accessToken;

    await prisma.client.user.update({
      where: { id: adminUserId },
      data: { role: Role.ADMIN },
    });

    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .set('x-api-key', TEST_API_KEY)
      .send({ email, password })
      .expect(200);
    adminToken = login.body.accessToken;

    const category = await post('/categories', {
      name: `${namePrefix} Category`,
    }).expect(201);
    categoryId = category.body.id;

    imageBytes = pngBuffer();
    const image = await request(app.getHttpServer())
      .post('/images')
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .attach('file', imageBytes, `backup-${uniqueSuffix}.png`)
      .expect(201);
    imageId = image.body.id;

    const product = await post('/products', {
      name: `${namePrefix} Product`,
      categoryId,
      sellingPrice: 25,
      stockQuantity: 10,
      imageIds: [imageId],
    }).expect(201);
    productId = product.body.id;

    const customer = await post('/customers', {
      name: `${namePrefix} Customer`,
      phone: '01712345678',
    }).expect(201);

    await post('/orders', {
      customerId: customer.body.id,
      items: [{ productId, quantity: 2 }],
    }).expect(201);
  });

  afterAll(async () => {
    await app.close();
    await Promise.all([
      rm(storageDir, { recursive: true, force: true }),
      rm(backupDir, { recursive: true, force: true }),
      rm(workDir, { recursive: true, force: true }),
    ]);
  });

  it('restricts backup endpoints to administrators', async () => {
    await get('/backups', regularToken).expect(403);
    await post('/backups', {}, regularToken).expect(403);
  });

  it('creates, downloads and restores a complete backup', async () => {
    const created = await post('/backups', {}).expect(201);
    const completed = await waitForBackup(created.body.id);

    expect(completed.status).toBe('COMPLETED');
    expect(Number(completed.sizeBytes)).toBeGreaterThan(0);
    expect(completed.counts.mediaFiles).toBe(1);

    const download = await get(`/backups/${created.body.id}/download`).expect(
      200,
    );
    expect(download.headers['content-type']).toContain('application/gzip');
    expect(download.body.length).toBeGreaterThan(0);

    const archivePath = join(workDir, 'downloaded.tar.gz');
    await writeFile(archivePath, download.body as Buffer);

    const extra = await post('/categories', {
      name: `${namePrefix} Temporary`,
    }).expect(201);

    const restore = await post(`/backups/${created.body.id}/restore`, {
      confirmation: 'RESTORE',
    }).expect(202);
    const restoreJob = await waitForRestore(restore.body.id);

    expect(restoreJob.status).toBe('COMPLETED');
    expect(restoreJob.progress).toBe(100);

    const categories = await get('/categories').expect(200);
    const names = categories.body.data.map(
      (category: { name: string }) => category.name,
    );
    expect(names).toContain(`${namePrefix} Category`);
    expect(names).not.toContain(extra.body.name);

    const products = await get('/products').expect(200);
    expect(
      products.body.data.some(
        (product: { id: string }) => product.id === productId,
      ),
    ).toBe(true);

    const file = await get(`/images/${imageId}/file`).expect(200);
    expect(Buffer.from(file.body)).toEqual(imageBytes);
  });

  it('requires an explicit restore confirmation', async () => {
    const created = await post('/backups', {}).expect(201);
    const completed = await waitForBackup(created.body.id);

    await post(`/backups/${completed.id}/restore`, {}).expect(400);
  });

  it('rejects an invalid archive without changing existing data', async () => {
    const invalidPath = join(workDir, 'invalid.tar.gz');
    await writeFile(invalidPath, Buffer.from('this is not a backup archive'));

    const response = await uploadArchive(invalidPath).expect(202);
    const job = await waitForRestore(response.body.id);

    expect(job.status).toBe('FAILED');
    expect(job.errorMessage).toContain('not a valid VendKit backup');

    const categories = await get('/categories').expect(200);
    expect(
      categories.body.data.some(
        (category: { id: string }) => category.id === categoryId,
      ),
    ).toBe(true);
  });

  it('rejects an incompatible backup format version', async () => {
    const path = join(workDir, 'incompatible.tar.gz');
    await writeCustomArchive(path, {
      formatVersion: 999,
      tables: emptyTables(),
    });

    const response = await uploadArchive(path).expect(202);
    const job = await waitForRestore(response.body.id);

    expect(job.status).toBe('FAILED');
    expect(job.errorMessage).toContain('not supported');
  });

  it('rolls back the transaction when restored data violates a constraint', async () => {
    const tables = emptyTables();
    const createdAt = '2026-01-01T00:00:00.000Z';
    tables.categories = [
      {
        id: '11111111-1111-4111-8111-111111111111',
        name: `${namePrefix} Duplicate A`,
        slug: `duplicate-${uniqueSuffix}`,
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
      {
        id: '22222222-2222-4222-8222-222222222222',
        name: `${namePrefix} Duplicate B`,
        slug: `duplicate-${uniqueSuffix}`,
        isActive: true,
        createdAt,
        updatedAt: createdAt,
      },
    ];

    const path = join(workDir, 'constraint-failure.tar.gz');
    await writeCustomArchive(path, { tables });

    const response = await uploadArchive(path).expect(202);
    const job = await waitForRestore(response.body.id);

    expect(job.status).toBe('FAILED');
    expect(job.errorMessage).toContain('rolled back');

    const categories = await get('/categories').expect(200);
    expect(
      categories.body.data.some(
        (category: { id: string }) => category.id === categoryId,
      ),
    ).toBe(true);

    const file = await get(`/images/${imageId}/file`).expect(200);
    expect(Buffer.from(file.body)).toEqual(imageBytes);
  });

  it('deletes a backup and rejects downloading it afterwards', async () => {
    const created = await post('/backups', {}).expect(201);
    const completed = await waitForBackup(created.body.id);

    await request(app.getHttpServer())
      .delete(`/backups/${completed.id}`)
      .set('x-api-key', TEST_API_KEY)
      .set(auth())
      .expect(204);

    await get(`/backups/${completed.id}/download`).expect(404);
  });

  it('does not mark a backup successful when a media file is missing', async () => {
    const image = await prisma.client.image.findUniqueOrThrow({
      where: { id: imageId },
      select: { storageKey: true },
    });
    await rm(join(storageDir, image.storageKey));

    const created = await post('/backups', {}).expect(201);
    const failed = await waitForBackup(created.body.id);

    expect(failed.status).toBe('FAILED');
    expect(Number(failed.sizeBytes)).toBe(0);
    expect(failed.errorMessage).toBeTruthy();

    await get(`/backups/${created.body.id}/download`).expect(409);
  });
});
