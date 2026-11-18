import { ForbiddenException } from '@nestjs/common';
import { Role } from '@repo/database';
import * as bcrypt from 'bcrypt';
import type { ConfigService } from '@nestjs/config';
import type { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service.js';
import type { PrismaService } from '../prisma/prisma.service.js';

function createHarness(config: Record<string, string> = {}) {
  const prisma = {
    client: {
      user: {
        count: vi.fn().mockResolvedValue(0),
        findUnique: vi.fn(),
        create: vi.fn(),
        update: vi.fn(),
      },
      refreshToken: {
        create: vi.fn().mockResolvedValue({}),
        deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
      },
    },
  };

  const jwt = { sign: vi.fn().mockReturnValue('access-token') };
  const configService = {
    get: vi.fn((key: string) => config[key]),
    getOrThrow: vi.fn((key: string) => config[key] ?? 'test-secret'),
  };

  const service = new AuthService(
    prisma as unknown as PrismaService,
    jwt as unknown as JwtService,
    configService as unknown as ConfigService,
  );

  return { service, prisma, configService };
}

const userFixture = async (overrides: Record<string, unknown> = {}) => ({
  id: 'user-1',
  email: 'owner@example.com',
  name: 'Owner',
  password: await bcrypt.hash('current-password', 4),
  role: Role.ADMIN,
  createdAt: new Date(),
  updatedAt: new Date(),
  ...overrides,
});

describe('AuthService registration policy', () => {
  it('makes the first account an administrator', async () => {
    const { service, prisma } = createHarness();
    prisma.client.user.count.mockResolvedValue(0);
    prisma.client.user.create.mockImplementation(async ({ data }) => ({
      ...data,
      id: 'user-1',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const tokens = await service.register({
      email: 'owner@example.com',
      password: 'a-strong-password',
      name: 'Owner',
    });

    expect(prisma.client.user.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ role: Role.ADMIN }),
      }),
    );
    expect(tokens.user.role).toBe(Role.ADMIN);
  });

  it('closes registration after the first account by default', async () => {
    const { service, prisma } = createHarness();
    prisma.client.user.count.mockResolvedValue(1);

    await expect(
      service.register({
        email: 'second@example.com',
        password: 'a-strong-password',
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    expect(prisma.client.user.create).not.toHaveBeenCalled();
  });

  it('allows later accounts only when explicitly enabled', async () => {
    const { service, prisma } = createHarness({
      ALLOW_PUBLIC_REGISTRATION: 'true',
    });
    prisma.client.user.count.mockResolvedValue(3);
    prisma.client.user.create.mockImplementation(async ({ data }) => ({
      ...data,
      id: 'user-4',
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    const tokens = await service.register({
      email: 'teammate@example.com',
      password: 'a-strong-password',
    });

    expect(tokens.user.role).toBe(Role.USER);
  });

  it('reports whether the next account becomes the administrator', async () => {
    const { service, prisma } = createHarness();
    prisma.client.user.count.mockResolvedValue(0);

    await expect(service.getRegistrationStatus()).resolves.toEqual({
      open: true,
      isFirstUser: true,
    });
  });
});

describe('AuthService password changes', () => {
  it('rejects an incorrect current password', async () => {
    const { service, prisma } = createHarness();
    prisma.client.user.findUnique.mockResolvedValue(await userFixture());

    await expect(
      service.changePassword('user-1', 'wrong-password', 'new-password-123'),
    ).rejects.toThrow('Current password is incorrect');
    expect(prisma.client.user.update).not.toHaveBeenCalled();
  });

  it('stores a new password hash', async () => {
    const { service, prisma } = createHarness();
    const user = await userFixture();
    prisma.client.user.findUnique.mockResolvedValue(user);
    prisma.client.user.update.mockResolvedValue(user);

    await service.changePassword('user-1', 'current-password', 'new-password-123');

    const update = prisma.client.user.update.mock.calls[0]?.[0] as {
      data: { password: string };
    };
    expect(await bcrypt.compare('new-password-123', update.data.password)).toBe(
      true,
    );
  });
});
